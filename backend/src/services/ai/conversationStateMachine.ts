import { db } from '../../database/client';
import { logger } from '../../utils/logger';

export type ConversationState =
  | 'NEW'
  | 'DISCOVERY'
  | 'QUALIFICATION'
  | 'PROPERTY_SEARCH'
  | 'PROPERTY_PRESENTATION'
  | 'PROPERTY_DISCUSSION'
  | 'BROCHURE_REQUEST'
  | 'SITE_VISIT_DISCUSSION'
  | 'SITE_VISIT_SCHEDULING'
  | 'NEGOTIATION'
  | 'FOLLOW_UP'
  | 'HUMAN_HANDOFF'
  | 'CLOSED';

export interface StateTransitionInput {
  currentState: ConversationState;
  intents: string[];
  requirements?: {
    max_budget?: number | null;
    min_budget?: number | null;
    property_type?: string | null;
    min_bhk?: number | null;
    preferred_locations?: string[] | null;
    purchase_timeline?: string | null;
  };
  hasFoundProperties?: boolean;
  siteVisitScheduled?: boolean;
  humanRequested?: boolean;
}

export class ConversationStateMachine {
  /**
   * Deterministically calculates the next state in the customer sales journey
   */
  public determineNextState(input: StateTransitionInput): ConversationState {
    const { currentState, intents, requirements, hasFoundProperties, siteVisitScheduled, humanRequested } = input;

    // 1. Immediate Human Handoff triggers
    if (
      humanRequested ||
      intents.includes('HUMAN_REQUEST') ||
      intents.includes('COMPLAINT') ||
      intents.includes('LEGAL_QUESTION') ||
      intents.includes('NEGOTIATION') ||
      intents.includes('DISCOUNT_REQUEST')
    ) {
      return 'HUMAN_HANDOFF';
    }

    // 2. Opt Out / Closed
    if (intents.includes('OPT_OUT')) {
      return 'CLOSED';
    }

    // 3. Site visit triggers
    if (siteVisitScheduled) {
      return 'FOLLOW_UP';
    }

    if (intents.includes('SITE_VISIT_REQUEST') || intents.includes('SITE_VISIT_RESCHEDULE')) {
      return 'SITE_VISIT_SCHEDULING';
    }

    if (intents.includes('BROCHURE_REQUEST')) {
      return 'BROCHURE_REQUEST';
    }

    // 4. Requirements readiness check
    const hasCoreRequirements = Boolean(
      (requirements?.max_budget || requirements?.min_budget) &&
      (requirements?.property_type || requirements?.min_bhk)
    );

    // 5. State-by-State Evaluation
    switch (currentState) {
      case 'NEW':
        if (hasCoreRequirements) return 'QUALIFICATION';
        return 'DISCOVERY';

      case 'DISCOVERY':
        if (intents.includes('PROPERTY_SEARCH') && hasCoreRequirements) {
          return 'PROPERTY_SEARCH';
        }
        if (hasCoreRequirements) {
          return 'QUALIFICATION';
        }
        return 'DISCOVERY';

      case 'QUALIFICATION':
        if (intents.includes('PROPERTY_SEARCH') || hasFoundProperties) {
          return 'PROPERTY_PRESENTATION';
        }
        return 'PROPERTY_SEARCH';

      case 'PROPERTY_SEARCH':
        if (hasFoundProperties) {
          return 'PROPERTY_PRESENTATION';
        }
        return 'PROPERTY_DISCUSSION';

      case 'PROPERTY_PRESENTATION':
      case 'PROPERTY_DISCUSSION':
        if (intents.includes('PROPERTY_DETAILS') || intents.includes('PRICE_INQUIRY') || intents.includes('AVAILABILITY') || intents.includes('AMENITY_INQUIRY')) {
          return 'PROPERTY_DISCUSSION';
        }
        if (intents.includes('SITE_VISIT_REQUEST')) {
          return 'SITE_VISIT_DISCUSSION';
        }
        return 'PROPERTY_DISCUSSION';

      case 'SITE_VISIT_DISCUSSION':
      case 'SITE_VISIT_SCHEDULING':
        if (siteVisitScheduled) return 'FOLLOW_UP';
        return 'SITE_VISIT_SCHEDULING';

      case 'BROCHURE_REQUEST':
        return 'PROPERTY_DISCUSSION';

      case 'HUMAN_HANDOFF':
        return 'HUMAN_HANDOFF';

      case 'FOLLOW_UP':
      case 'CLOSED':
      default:
        return currentState;
    }
  }

  /**
   * Retrieves or initializes conversation state from the database
   */
  public async getConversationState(conversationId: string): Promise<ConversationState> {
    const client = db.getClient();
    const { data } = await client
      .from('ai_conversation_state')
      .select('state')
      .eq('conversation_id', conversationId)
      .single();

    return (data?.state as ConversationState) || 'NEW';
  }

  /**
   * Updates the authoritative conversation state in the database
   */
  public async updateConversationState(
    conversationId: string,
    state: ConversationState,
    metadata: {
      lastIntent?: string;
      confidence?: number;
      lastToolCalled?: string;
      summary?: any;
    } = {}
  ): Promise<void> {
    const client = db.getClient();

    try {
      await client
        .from('ai_conversation_state')
        .upsert(
          {
            conversation_id: conversationId,
            state,
            last_intent: metadata.lastIntent,
            confidence: metadata.confidence ?? 1.0,
            last_tool_called: metadata.lastToolCalled,
            summary: metadata.summary || {},
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'conversation_id' }
        );
    } catch (error) {
      logger.error({ error, conversationId, state }, 'Failed to update AI conversation state');
    }
  }
}

export const conversationStateMachine = new ConversationStateMachine();
