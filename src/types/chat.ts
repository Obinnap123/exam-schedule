export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: number;
  content: string;
  role: ChatRole;
  createdAt: Date;
  updatedAt: Date;
  chatId: number;
}

export interface Chat {
  id: number;
  title?: string | null;
  userId: number;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatStartResponse {
  id: number;
  title: string;
  createdAt: Date;
  status: 'success';
}

export interface ChatMessageResponse {
  id: number;
  content: string;
  role: ChatRole;
  createdAt: Date;
  updatedAt: Date;
  status: 'success';
}

export interface ChatError {
  error: string;
}

// API request types
export interface StartChatRequest {
  title?: string;
}

export interface SendMessageRequest {
  chatId: number | string;
  content: string;
  model?: string;
}
