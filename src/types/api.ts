import type { CharacterInfo, CharacterSlug } from "./character";

export type Role =
  | "user"
  | "assistant"
  | "system";

export interface Message {
  id: number;
  conversation_id: string;
  role: Role;
  content: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  character: CharacterSlug;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatRequest {
  conversation_id: string;
  character: CharacterSlug;
  message: string;
}

export interface ChatResponse {
  conversation_id: string;
  character: CharacterSlug;
  reply: string;
  error?: string;
}

export interface Document {
  id: string;
  conversation_id: string;
  filename: string;
  chunk_count: number;
  created_at: string;
}

export interface CharacterListResponse {
  characters: CharacterInfo[];
  total: number;
}

export interface ConversationListResponse {
  conversations: Conversation[];
  total: number;
}

export interface MessageListResponse {
  conversation: Conversation;
  messages: Message[];
  total: number;
}

export interface UploadDocumentResponse {
  conversation_id: string;
  document_id: string;
  filename: string;
  chunk_count: number;
  message: string;
}

export interface DeleteConversationResponse {
  message: string;
}

export interface RenameConversationRequest {
    title: string
}