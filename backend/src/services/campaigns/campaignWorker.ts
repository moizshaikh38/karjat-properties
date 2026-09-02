import { db } from '../../database/client';
import { logger } from '../../utils/logger';
import { isMarketingEligible } from './audienceBuilderService';
import { whatsappMessageService } from '../whatsapp/whatsappMessageService';

const BATCH_SIZE = 50;
let isRunning = false;

export const processCampaignQueue = async () => {
  if (isRunning) return;
  isRunning = true;
  
  try {
    const client = db.getClient();
    const now = new Date();

    // Enforce business hours (Asia/Kolkata 09:00 - 21:00)
    // For simplicity, we just use local hour if server is in IST, or strictly use moment-timezone.
    // Assuming server is correctly localized or just using simple logic here.
    const currentHour = now.getHours(); 
    if (currentHour < 9 || currentHour >= 21) {
      logger.debug('Outside campaign sending window (09:00 - 21:00). Pausing queue.');
      isRunning = false;
      return;
    }

    // 1. Find RUNNING campaigns
    let { data: campaigns } = await client
      .from('campaigns')
      .select('id, template_id')
      .eq('status', 'RUNNING');

    // 2. Start SCHEDULED campaigns that are due
    const { data: scheduled } = await client
      .from('campaigns')
      .select('id, template_id')
      .eq('status', 'SCHEDULED')
      .lte('scheduled_at', now.toISOString());

    if (scheduled && scheduled.length > 0) {
      for (const c of scheduled) {
        await client.from('campaigns').update({ status: 'RUNNING', started_at: now.toISOString() }).eq('id', c.id);
      }
      campaigns = campaigns ? [...campaigns, ...scheduled] : scheduled;
    }

    if (!campaigns || campaigns.length === 0) {
      isRunning = false;
      return;
    }

    // Process each running campaign
    for (const campaign of campaigns) {
      // Get template body
      const { data: template } = await client.from('whatsapp_templates').select('*').eq('id', campaign.template_id).single();
      if (!template) continue;

      // Get queued recipients
      const { data: recipients } = await client
        .from('campaign_recipients')
        .select('*, lead:leads(phone)')
        .eq('campaign_id', campaign.id)
        .eq('status', 'QUEUED')
        .limit(BATCH_SIZE);

      if (!recipients || recipients.length === 0) {
        // Mark campaign COMPLETED
        await client.from('campaigns').update({ status: 'COMPLETED', completed_at: now.toISOString() }).eq('id', campaign.id);
        continue;
      }

      for (const recipient of recipients) {
        const leadId = recipient.lead_id;
        const phone = recipient.lead?.phone;
        
        if (!phone) {
          await markFailed(recipient.id, 'INVALID_NUMBER');
          continue;
        }

        // Final eligibility check
        const eligible = await isMarketingEligible(leadId);
        if (!eligible) {
          await markSkipped(recipient.id, 'OPTED_OUT_OR_SUPPRESSED');
          continue;
        }

        // Mock Rendering (Replace variables)
        let messageText = template.body;
        messageText = messageText.replace(/{{customer_name}}/g, 'Customer');
        // Add more variables as needed...

        try {
          // Update to SENDING
          await client.from('campaign_recipients').update({ status: 'SENDING', phone }).eq('id', recipient.id);
          
          // Send via WhatsApp
          const response = await whatsappMessageService.sendText({ to: phone, text: messageText });
          
          if (response && response.messages && response.messages[0]) {
            const providerMsgId = response.messages[0].id;
            await client.from('campaign_recipients').update({
              status: 'SENT',
              provider_message_id: providerMsgId,
              sent_at: new Date().toISOString()
            }).eq('id', recipient.id);

            try {
              await client.rpc('increment_campaign_sent', { cid: campaign.id });
            } catch(e) {}
          } else {
            await markFailed(recipient.id, 'PROVIDER_ERROR');
          }
        } catch (err: any) {
          await markFailed(recipient.id, err.message || 'PROVIDER_ERROR');
        }
      }
    }
  } catch (error) {
    logger.error({ error }, 'Error in campaign worker');
  } finally {
    isRunning = false;
  }
};

const markFailed = async (recipientId: string, reason: string) => {
  const client = db.getClient();
  await client.from('campaign_recipients').update({
    status: 'FAILED',
    failed_at: new Date().toISOString(),
    failure_reason: reason
  }).eq('id', recipientId);
};

const markSkipped = async (recipientId: string, reason: string) => {
  const client = db.getClient();
  await client.from('campaign_recipients').update({
    status: 'SKIPPED',
    failure_reason: reason
  }).eq('id', recipientId);
};

// Polling setup
let intervalId: any = null;
export const startCampaignWorker = () => {
  if (intervalId) return;
  intervalId = setInterval(() => {
    processCampaignQueue().catch(e => logger.error(e));
  }, 10000); // Check every 10 seconds
  logger.info('Campaign worker started');
};
