export interface AIToolParameter {
  type: string;
  description?: string;
  enum?: string[];
  items?: AIToolParameter;
  properties?: Record<string, AIToolParameter>;
  required?: string[];
}

export interface AITool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, AIToolParameter>;
    required?: string[];
  };
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  name?: string; // used for tool responses
  tool_calls?: {
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string; // JSON string
    };
  }[];
  tool_call_id?: string; // used for tool responses
}

export interface AIRequest {
  systemPrompt: string;
  messages: AIMessage[];
  tools?: AITool[];
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string | null;
  toolCalls?: {
    id: string;
    name: string;
    arguments: any;
  }[];
}

export interface AIProvider {
  generateResponse(request: AIRequest): Promise<AIResponse>;
}
