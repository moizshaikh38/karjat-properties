import { db } from '../../database/client';
import { logger } from '../../utils/logger';
import { shouldAIRespond } from '../aiModeGuard';
import { buildFullContext } from './conversationContextService';
import { detectIntents } from './intentDetectionService';
import { extractRequirements, updateLeadRequirementsWithExtraction } from './requirementExtractionService';
import { getAIProvider } from './aiService';
import { AIMessage, AITool } from './aiProvider';
import { validateAIResponse } from './aiResponseValidator';
import { whatsappMessageService } from '../whatsapp/whatsappMessageService';
import * as messageRepo from '../../repositories/messageRepository';
import { conversationStateMachine, ConversationState } from './conversationStateMachine';
import { buildSalesAgentSystemPrompt } from './salesAgentPrompt';
import { getNextBestAction } from '../nextActionService';

// Import All Tools
import {
  propertySearchToolDefinition,
  executePropertySearch,
  getPropertyDetailsToolDefinition,
  executeGetPropertyDetails,
  checkPropertyAvailabilityToolDefinition,
  executeCheckPropertyAvailability,
  getCurrentPropertyPriceToolDefinition,
  executeGetCurrentPropertyPrice,
  comparePropertiesToolDefinition,
  executeCompareProperties,
  sendPropertyBrochureToolDefinition,
  executeSendPropertyBrochure,
  sendPropertyImagesToolDefinition,
  executeSendPropertyImages,
  createSiteVisitToolDefinition,
  executeCreateSiteVisitRequest,
  getSiteVisitSlotsToolDefinition,
  executeGetSiteVisitSlots,
  getSiteVisitStatusToolDefinition,
  executeGetSiteVisitStatus,
  cancelSiteVisitToolDefinition,
  executeCancelSiteVisit,
  requestHumanAgentToolDefinition,
  executeRequestHumanAgent,
  scheduleFollowupToolDefinition,
  executeScheduleFollowup,
  updateLeadRequirementsToolDefinition,
  executeUpdateLeadRequirements,
  logPropertyInteractionToolDefinition,
  executeLogPropertyInteraction,
  sendPropertyToCustomerToolDefinition,
  executeSendPropertyToCustomer,
} from './tools';

export class SalesAgentService {
  /**
   * Main entry point to process an incoming conversation turn with the AI Sales Agent
   */
  public async processConversation(conversationId: string): Promise<void> {
    const startTime = Date.now();
    logger.info({ conversationId }, `[PERF] AI_PROCESS_START`);

    try {
      // 1. Initial Conversation Mode Check
      if (!(await shouldAIRespond(conversationId))) {
        logger.info({ conversationId }, 'SalesAgent blocked: Mode is not AI');
        logger.info({ conversationId, duration: Date.now() - startTime }, `[PERF] AI_PROCESS_END`);
        return;
      }

      // 2. Assemble Full Lead & Conversation Context
      const ctx = await buildFullContext(conversationId);
      if (ctx.messages.length === 0) return;

      const latestIncoming = ctx.messages
        .filter((m) => m.role === 'user')
        .slice(-3)
        .map((m) => m.content)
        .join('\n');

      // 3. Extract Requirements Asynchronously
      extractRequirements(latestIncoming)
        .then((extracted) => {
          if (extracted) updateLeadRequirementsWithExtraction(ctx.lead.id, extracted);
        })
        .catch((e) => logger.error(e));

      // 4. Multi-Intent Classification (Non-Blocking)
      // We fire this asynchronously so it doesn't block the main AI response generation.
      const intents = ['PENDING_ANALYSIS'];
      const confidence = 0.5;
      
      detectIntents(latestIncoming)
        .then((res) => {
           logger.debug({ conversationId, intents: res.intents, confidence: res.confidence }, 'Detected customer intents (background)');
           // Analytics or background states can use this later
        })
        .catch((e) => logger.error(e));

      // 5. Short-circuit for Immediate Opt-Out
      // Since intent detection is now non-blocking, we rely on the main LLM 
      // or explicit tool calls to handle opt-outs.
      if (latestIncoming.toLowerCase().trim() === 'stop') {
        await executeRequestHumanAgent(conversationId, JSON.stringify({ reason: 'Customer requested opt-out explicitly' }));
        await conversationStateMachine.updateConversationState(conversationId, 'CLOSED', {
          lastIntent: 'OPT_OUT',
          confidence: 1.0,
        });
        logger.info({ conversationId, duration: Date.now() - startTime }, `[PERF] AI_PROCESS_END`);
        return;
      }

      // 6. Compute Next Best Action & State Transition
      const nextAction = getNextBestAction(ctx.lead as any, ctx.requirements as any, ctx.interactions as any);

      const currentState = await conversationStateMachine.getConversationState(conversationId);
      const nextState = conversationStateMachine.determineNextState({
        currentState,
        intents,
        requirements: ctx.requirements as any,
      });

      // 7. Assemble Structured System Prompt
      const systemPrompt = buildSalesAgentSystemPrompt({
        leadName: ctx.lead.name || 'Valued Customer',
        leadStage: ctx.lead.status,
        conversationState: nextState,
        intents,
        requirements: ctx.requirements,
        nextBestAction: nextAction,
      });

      // 8. Tool Definitions
      const tools: AITool[] = [
        propertySearchToolDefinition,
        getPropertyDetailsToolDefinition,
        checkPropertyAvailabilityToolDefinition,
        getCurrentPropertyPriceToolDefinition,
        comparePropertiesToolDefinition,
        sendPropertyBrochureToolDefinition,
        sendPropertyImagesToolDefinition,
        createSiteVisitToolDefinition,
        getSiteVisitSlotsToolDefinition,
        getSiteVisitStatusToolDefinition,
        cancelSiteVisitToolDefinition,
        requestHumanAgentToolDefinition,
        scheduleFollowupToolDefinition,
        updateLeadRequirementsToolDefinition,
        logPropertyInteractionToolDefinition,
        sendPropertyToCustomerToolDefinition,
      ];

      const aiProvider = getAIProvider();
      const conversationMessages: AIMessage[] = [...ctx.messages];

      let iterationCount = 0;
      let finalResponseContent = '';
      let conversationModeSwitched = false;
      let lastToolCalledName: string | undefined;
      const discoveredProperties: any[] = [];

      // 9. Multi-Step Tool Execution Loop (up to 4 iterations)
      while (iterationCount < 4) {
        iterationCount++;

        logger.info({ conversationId }, `[PERF] LLM_CALL_START iteration=${iterationCount}`);
        const llmStart = Date.now();
        const response = await aiProvider.generateResponse({
          systemPrompt,
          messages: conversationMessages,
          tools,
          temperature: 0.3,
          maxTokens: 500,
        });
        logger.info({ conversationId, duration: Date.now() - llmStart }, `[PERF] LLM_CALL_END iteration=${iterationCount}`);

        if (response.content) {
          finalResponseContent = response.content;
        }

        if (response.toolCalls && response.toolCalls.length > 0) {
          // MUST push the assistant message containing the tool calls to satisfy OpenAI API spec
          conversationMessages.push({ 
            role: 'assistant', 
            content: response.content || null,
            tool_calls: response.toolCalls.map(tc => ({
              id: tc.id,
              type: 'function',
              function: { name: tc.name, arguments: JSON.stringify(tc.arguments) }
            }))
          });

            for (const call of response.toolCalls) {
            lastToolCalledName = call.name;
            let toolResult: any;

            logger.info({ conversationId, tool: call.name }, `[PERF] TOOL_CALL_START tool=${call.name}`);
            const toolStart = Date.now();

            try {
              switch (call.name) {
                case 'searchProperties':
                  toolResult = await executePropertySearch(ctx.lead.id, call.arguments);
                  if (toolResult?.success) {
                    if (Array.isArray(toolResult.exactMatches)) {
                      discoveredProperties.push(...toolResult.exactMatches);
                    }
                    if (Array.isArray(toolResult.alternatives)) {
                      discoveredProperties.push(...toolResult.alternatives);
                    }
                  }
                  break;
                case 'getPropertyDetails':
                  toolResult = await executeGetPropertyDetails(call.arguments);
                  if (toolResult?.success && toolResult.property) {
                    discoveredProperties.push(toolResult.property);
                  }
                  break;
                case 'checkPropertyAvailability':
                  toolResult = await executeCheckPropertyAvailability(call.arguments);
                  break;
                case 'getCurrentPropertyPrice':
                  toolResult = await executeGetCurrentPropertyPrice(call.arguments);
                  break;
                case 'compareProperties':
                  toolResult = await executeCompareProperties(call.arguments);
                  break;
                case 'sendPropertyBrochure':
                  toolResult = await executeSendPropertyBrochure(conversationId, ctx.lead.id, call.arguments);
                  break;
                case 'sendPropertyImages':
                  toolResult = await executeSendPropertyImages(conversationId, ctx.lead.id, call.arguments);
                  break;
                case 'createSiteVisitRequest':
                  toolResult = await executeCreateSiteVisitRequest(ctx.lead.id, conversationId, call.arguments);
                  break;
                case 'getSiteVisitSlots':
                  toolResult = await executeGetSiteVisitSlots();
                  break;
                case 'getSiteVisitStatus':
                  toolResult = await executeGetSiteVisitStatus(ctx.lead.id);
                  break;
                case 'cancelSiteVisit':
                  toolResult = await executeCancelSiteVisit(ctx.lead.id, call.arguments);
                  break;
                case 'requestHumanAgent':
                  toolResult = await executeRequestHumanAgent(conversationId, call.arguments);
                  conversationModeSwitched = true;
                  break;
                case 'scheduleFollowup':
                  toolResult = await executeScheduleFollowup(ctx.lead.id, conversationId, call.arguments);
                  break;
                case 'updateLeadRequirements':
                  toolResult = await executeUpdateLeadRequirements(ctx.lead.id, call.arguments);
                  break;
                case 'logPropertyInteraction':
                  toolResult = await executeLogPropertyInteraction(ctx.lead.id, call.arguments);
                  break;
                case 'sendPropertyToCustomer':
                  toolResult = await executeSendPropertyToCustomer(conversationId, call.arguments);
                  if (toolResult?.property) {
                    discoveredProperties.push(toolResult.property);
                  }
                  break;
                default:
                  toolResult = { error: `Unknown tool: ${call.name}` };
                  break;
              }

              // Record Analytics Event for Tool Execution
              this.recordAnalyticsEvent({
                conversationId,
                leadId: ctx.lead.id,
                eventType: 'TOOL_CALL',
                toolName: call.name,
                latencyMs: Date.now() - toolStart,
              });
            } catch (e: any) {
              toolResult = { error: e.message };
            }
            
            logger.info({ conversationId, tool: call.name, duration: Date.now() - toolStart }, `[PERF] TOOL_CALL_END tool=${call.name}`);

            conversationMessages.push({
              role: 'tool',
              tool_call_id: call.id,
              name: call.name,
              content: JSON.stringify(toolResult),
            });
          }

          if (conversationModeSwitched) {
            break;
          }
        } else {
          break; // No more tool calls requested
        }
      }

      if (!finalResponseContent) {
         logger.info({ conversationId, duration: Date.now() - startTime }, `[PERF] AI_PROCESS_END`);
         return;
      }

      // 10. Anti-Hallucination & Response Validation
      const validation = validateAIResponse(finalResponseContent);
      if (!validation.isValid) {
        logger.warn({ error: validation.error }, 'AI generated unverified response, escalating safely');
        finalResponseContent =
          "I'm verifying that specific detail with our property sales team. Let me connect you with an executive directly.";
        await executeRequestHumanAgent(conversationId, JSON.stringify({ reason: validation.error }));
      } else {
        finalResponseContent = validation.safeResponse;
      }

      // 11. Final Mode & Race-Condition Check
      if (await shouldAIRespond(conversationId)) {
        let msgId = `ai-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        try {
          logger.info({ conversationId }, `[PERF] FAST2SMS_SEND_START`);
          const fast2smsStart = Date.now();
          const waResponse = await whatsappMessageService.sendText({
            to: ctx.conversation.whatsapp_phone,
            text: finalResponseContent,
          });
          logger.info({ conversationId, duration: Date.now() - fast2smsStart }, `[PERF] FAST2SMS_SEND_END`);
          if (waResponse?.messageId) msgId = waResponse.messageId;
          else if (waResponse?.messages?.[0]?.id) msgId = waResponse.messages[0].id;
        } catch (waErr: any) {
          logger.warn({ error: waErr.message }, 'WhatsApp dispatch note: recording response in chat history');
        }

        // Always record outgoing AI message in database
        await messageRepo.createMessage({
          conversation_id: conversationId,
          whatsapp_message_id: msgId,
          direction: 'outgoing',
          message_type: 'text',
          recipient_phone: ctx.conversation.whatsapp_phone,
          text_content: finalResponseContent,
          status: 'sent',
          sent_at: new Date().toISOString(),
        });

        // Update conversation last_message_at
        await db.getClient().from('whatsapp_conversations').update({
          last_message_at: new Date().toISOString()
        }).eq('id', conversationId);

        // 11b. Dispatch verified property photos via Fast2SMS if properties were recommended
        if (discoveredProperties.length > 0) {
          try {
            const responseLower = (finalResponseContent || '').toLowerCase();
            const matchedProperties: any[] = [];
            const seenIds = new Set<string>();

            // Identify which properties were actually presented/mentioned in final response
            for (const prop of discoveredProperties) {
              if (!prop || !prop.id || seenIds.has(prop.id)) continue;
              const titleMatch = prop.title && responseLower.includes(prop.title.toLowerCase());
              const nameMatch = prop.name && responseLower.includes(prop.name.toLowerCase());
              const idMatch = prop.id && responseLower.includes(prop.id.toLowerCase());

              if (titleMatch || nameMatch || idMatch) {
                seenIds.add(prop.id);
                matchedProperties.push(prop);
              }
            }

            // Fallback: If no direct name match in text, take the top exact match from search
            if (matchedProperties.length === 0 && discoveredProperties.length > 0) {
              const topProp = discoveredProperties[0];
              if (topProp && topProp.id) {
                matchedProperties.push(topProp);
                seenIds.add(topProp.id);
              }
            }

            // Limit to top 2 properties to keep WhatsApp feed clean and readable (Rule 10)
            const propertiesToDispatch = matchedProperties.slice(0, 2);

            for (const prop of propertiesToDispatch) {
              // Rule 13: Mode safety check before each property
              if (!(await shouldAIRespond(conversationId))) {
                logger.info({ conversationId, propId: prop.id }, 'Mode switched away from AI; halting media dispatch');
                break;
              }

              const images: string[] = Array.isArray(prop.images) ? prop.images : [];
              if (images.length === 0) {
                logger.info({ propId: prop.id, title: prop.title || prop.name }, 'No photos available for property; skipping media dispatch without error');
                continue;
              }

              // Rule 9: Send 1 to 3 best available photos per property
              const imagesToSend = images.slice(0, 3);

              for (let i = 0; i < imagesToSend.length; i++) {
                if (!(await shouldAIRespond(conversationId))) break;

                const imgUrl = imagesToSend[i];
                // Rule 8: Associate caption with the correct property
                const caption = i === 0
                  ? `📸 ${prop.title || prop.name || 'Karjat Property'} · ${prop.location || prop.location_city || 'Karjat'}${prop.priceFormatted ? ' · ' + prop.priceFormatted : ''}`
                  : undefined;

                let mediaMsgId = `media-${Date.now()}-${Math.random().toString(36).substring(7)}`;

                try {
                  logger.info({ conversationId, propId: prop.id, imgUrl }, 'Dispatching property photo via Fast2SMS');
                  const mediaRes = await whatsappMessageService.sendImage({
                    to: ctx.conversation.whatsapp_phone,
                    url: imgUrl,
                    caption,
                  });
                  if (mediaRes?.messageId) mediaMsgId = mediaRes.messageId;
                } catch (imgErr: any) {
                  // Rule 11: Failure handling - log and continue with property details, don't crash
                  logger.error({ error: imgErr.message, propId: prop.id, imgUrl }, 'Failed to dispatch property image via Fast2SMS');
                  continue;
                }

                // Record media message in database so it appears in CRM Inbox
                try {
                  await messageRepo.createMessage({
                    conversation_id: conversationId,
                    whatsapp_message_id: mediaMsgId,
                    direction: 'outgoing',
                    message_type: 'image',
                    recipient_phone: ctx.conversation.whatsapp_phone,
                    text_content: caption || '',
                    media_url: imgUrl,
                    status: 'sent',
                    sent_at: new Date().toISOString(),
                  });
                } catch (dbErr: any) {
                  logger.warn({ error: dbErr.message }, 'Failed to save media message record');
                }
              }
            }
          } catch (mediaErr: any) {
            logger.error({ error: mediaErr.message, conversationId }, 'Unexpected error in property media dispatch loop');
          }
        }

        // Update State Machine
        await conversationStateMachine.updateConversationState(conversationId, nextState, {
          lastIntent: intents[0],
          confidence,
          lastToolCalled: lastToolCalledName,
        });
      } else {
        logger.info({ conversationId }, 'Final check blocked response: Mode switched during execution.');
      }

      // 12. Asynchronous Sales Intelligence Background Task
      const { analyzeConversationIntelligence } = await import('./salesIntelligenceService');
      analyzeConversationIntelligence(
        conversationId,
        ctx.messages.map((m) => `${m.role}: ${m.content}`).join('\n')
      ).catch((e) => logger.error(e));
      
      logger.info({ conversationId, duration: Date.now() - startTime }, `[PERF] AI_PROCESS_END`);
    } catch (error: any) {
      logger.error({ error: error.message, conversationId }, 'SalesAgentService failed');
      logger.info({ conversationId, duration: Date.now() - startTime, failed: true }, `[PERF] AI_PROCESS_END`);
    }
  }

  private async recordAnalyticsEvent(event: {
    conversationId: string;
    leadId: string;
    eventType: string;
    toolName?: string;
    latencyMs?: number;
    tokensUsed?: number;
  }): Promise<void> {
    try {
      const client = db.getClient();
      await client.from('ai_analytics_events').insert({
        conversation_id: event.conversationId,
        lead_id: event.leadId,
        event_type: event.eventType,
        tool_name: event.toolName,
        latency_ms: event.latencyMs,
        tokens_used: event.tokensUsed,
      });
    } catch {
      // Gracefully ignore if analytics table write fails
    }
  }
}

export const salesAgentService = new SalesAgentService();
