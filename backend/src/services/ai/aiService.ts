import axios from 'axios';
import { AIProvider, AIRequest, AIResponse } from './aiProvider';
import { config } from '../../config/ai';
import { logger } from '../../utils/logger';

// --- OPENROUTER / OPENAI-COMPATIBLE PROVIDER ---
export class OpenRouterProvider implements AIProvider {
  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor() {
    this.apiKey = config.AI_API_KEY || '';
    this.baseURL = (config.AI_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/+$/, '');
    this.defaultModel = config.AI_MODEL || 'openai/gpt-4o';
  }

  async generateResponse(request: AIRequest): Promise<AIResponse> {
    if (!this.apiKey) {
      logger.warn('AI_API_KEY is not set. Falling back to MockAIProvider response.');
      return new MockAIProvider().generateResponse(request);
    }

    try {
      // 1. Build OpenAI-compatible messages array
      const apiMessages: any[] = [
        { role: 'system', content: request.systemPrompt },
      ];

      for (const msg of request.messages) {
        if (msg.role === 'tool') {
          apiMessages.push({
            role: 'tool',
            tool_call_id: msg.tool_call_id || 'call_default',
            name: msg.name,
            content: msg.content || '',
          });
        } else if (msg.role === 'assistant' && msg.tool_calls) {
          apiMessages.push({
            role: 'assistant',
            content: msg.content || null,
            tool_calls: msg.tool_calls,
          });
        } else {
          apiMessages.push({
            role: msg.role,
            content: msg.content || '',
          });
        }
      }

      // 2. Build Tools array
      const apiTools = request.tools && request.tools.length > 0
        ? request.tools.map((t) => ({
            type: 'function',
            function: {
              name: t.name,
              description: t.description,
              parameters: t.parameters,
            },
          }))
        : undefined;

      const payload: any = {
        model: this.defaultModel,
        messages: apiMessages,
        temperature: request.temperature ?? config.AI_TEMPERATURE,
        max_tokens: request.maxTokens ?? config.AI_MAX_TOKENS,
      };

      if (apiTools) {
        payload.tools = apiTools;
        payload.tool_choice = 'auto';
      }

      logger.debug({ model: this.defaultModel, messagesCount: apiMessages.length }, 'Sending request to OpenRouter API');

      const response = await axios.post(`${this.baseURL}/chat/completions`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://karjatproperties.com',
          'X-Title': 'Karjat Properties AI CRM',
          'Content-Type': 'application/json',
        },
        timeout: 25000,
      });

      const choice = response.data?.choices?.[0]?.message;
      if (!choice) {
        throw new Error('No completion choice returned by OpenRouter API');
      }

      // Parse tool calls if returned
      let parsedToolCalls: any[] | undefined = undefined;
      if (choice.tool_calls && Array.isArray(choice.tool_calls)) {
        parsedToolCalls = choice.tool_calls.map((tc: any) => {
          let args = {};
          try {
            args = typeof tc.function.arguments === 'string'
              ? JSON.parse(tc.function.arguments)
              : tc.function.arguments;
          } catch {
            args = { raw: tc.function.arguments };
          }
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: args,
          };
        });
      }

      return {
        content: choice.content || null,
        toolCalls: parsedToolCalls,
      };
    } catch (error: any) {
      const errMsg = error.response?.data?.error?.message || error.message;
      logger.error({ error: errMsg }, 'OpenRouter API request failed');
      // Graceful fallback response
      return {
        content: `Sorry, there was a system error: ${errMsg}. Our senior real estate advisor will connect with you shortly.`,
      };
    }
  }
}

// --- MOCK PROVIDER (For Testing & Fallback) ---
export class MockAIProvider implements AIProvider {
  async generateResponse(request: AIRequest): Promise<AIResponse> {
    logger.debug('MockAIProvider generating response');
    
    const lastMessage = request.messages[request.messages.length - 1]?.content?.toLowerCase() || '';

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
    if (config.AI_PROVIDER === 'openrouter' || config.AI_PROVIDER === 'openai') {
      providerInstance = new OpenRouterProvider();
    } else {
      providerInstance = new MockAIProvider();
    }
  }
  return providerInstance;
};
