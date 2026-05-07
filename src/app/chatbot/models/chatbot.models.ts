export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  pending?: boolean;
  isDefaultGreeting?: boolean;
}

export interface GenerationConfig {
  max_tokens: number;
  temperature: number;
  top_p: number;
}

export interface ChatRequestPayload {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  stream: boolean;
  generation_config: GenerationConfig;
}

export interface RagRequestPayload {
  query: string;
  stream: boolean;
  top_k: number;
  generation_config: GenerationConfig;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'danger' | 'warning' | 'info';
  title: string;
  body: string;
  delay?: number;
}

export interface SelectedFileItem {
  file: File;
  name: string;
  size: number;
}