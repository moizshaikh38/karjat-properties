import { AIProvider, AIRequest, AIResponse } from './aiProvider';
import { config } from '../../config/ai';
import { logger } from '../../utils/logger';

// --- MOCK PROVIDER ---
export class MockAIProvider implements AIProvider {
  async generateResponse(request: AIRequest): Promise<AIResponse> {
    logger.debug('MockAIProvider generating response');
    
    const lastMessage = request.messages[request.messages.length - 1]?.content?.toLowerCase() || '';

    // Mock specific behaviors for tests
    if (lastMessage.includes('handoff') || lastMessage.includes('talk to human')) {
      return {
        content: null,
        toolCalls: [{
          id: 'call_mock_1',
          name: 'requestHumanAgent',
          arguments: { reason: 'Customer requested human' }
        }]
      };
    }

    if (lastMessage.includes('search')) {
      return {
        content: null,
        toolCalls: [{
          id: 'call_mock_2',
          name: 'searchProperties',
          arguments: { location: 'Karjat', minBudget: 5000000 }
        }]
      };
    }
    
    if (lastMessage.includes('update requirements')) {
      return {
        content: null,
        toolCalls: [{
          id: 'call_mock_3',
          name: 'updateLeadRequirements',
          arguments: { requirements: { preferred_city: 'Karjat', min_budget: 5000000 } }
        }]
      };
    }

    // Default mock response based on language detection keywords
    if (lastMessage.includes('chahiye')) {
      return { content: 'Zaroor, main aapki madad karunga!' };
    }
    if (lastMessage.includes('pahije')) {
      return { content: 'Ho, me tumhala madat karto!' };
    }

    return { content: 'This is a mock response from Karjat AI.' };
  }
}

// --- FACTORY ---
let providerInstance: AIProvider | null = null;

export const getAIProvider = (): AIProvider => {
  if (!providerInstance) {
    if (config.AI_PROVIDER === 'mock') {
      providerInstance = new MockAIProvider();
    } else {
      // In the future, instantiate OpenAIProvider or GeminiProvider here.
      logger.warn(`AI_PROVIDER '${config.AI_PROVIDER}' not fully implemented, falling back to mock.`);
      providerInstance = new MockAIProvider();
    }
  }
  return providerInstance;
};
