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

    try {
      // 1. Initial Conversation Mode Check
      if (!(await shouldAIRespond(conversationId))) {
        logger.info({ conversationId }, 'SalesAgent blocked: Mode is not AI');
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

      // 4. Multi-Intent Classification
      const { intents, confidence } = await detectIntents(latestIncoming);
      logger.debug({ conversationId, intents, confidence }, 'Detected customer intents');

      // 5. Short-circuit for Immediate Opt-Out
      if (intents.includes('OPT_OUT') && confidence > 0.7) {
        await executeRequestHumanAgent(conversationId, JSON.stringify({ reason: 'Customer requested opt-out' }));
        await conversationStateMachine.updateConversationState(conversationId, 'CLOSED', {
          lastIntent: 'OPT_OUT',
          confidence,
        });
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

      // 9. Multi-Step Tool Execution Loop (up to 4 iterations)
      while (iterationCount < 4) {
        iterationCount++;

        const response = await aiProvider.generateResponse({
          systemPrompt,
          messages: conversationMessages,
          tools,
          temperature: 0.3,
          maxTokens: 500,
        });

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

            try {
              switch (call.name) {
                case 'searchProperties':
                  toolResult = await executePropertySearch(ctx.lead.id, call.arguments);
                  break;
                case 'getPropertyDetails':
                  toolResult = await executeGetPropertyDetails(call.arguments);
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
                latencyMs: Date.now() - startTime,
              });
            } catch (e: any) {
              toolResult = { error: e.message };
            }

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

      if (!finalResponseContent) return;

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
          const waResponse = await whatsappMessageService.sendText({
            to: ctx.conversation.whatsapp_phone,
            text: finalResponseContent,
          });
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
    } catch (error: any) {
      logger.error({ error: error.message, conversationId }, 'SalesAgentService failed');
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
