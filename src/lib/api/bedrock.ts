import type { Message, MessageContent } from "@/types";

/**
 * AWS Bedrock chat API stubs.
 * Wire these up to your Bedrock-backed endpoint (or an edge function proxy).
 */

export interface BedrockSendPayload {
  conversationId: string;
  message: string;
  history: Message[];
}

export interface BedrockResponse {
  /** Either a plain text reply, or a structured component payload to render in chat. */
  content: MessageContent;
}

/**
 * Send a single user message to AWS Bedrock and await the full assistant reply.
 *
 * @param payload Conversation context + new user message.
 * @returns The assistant's reply (text or component payload).
 */
export async function sendMessageToBedrock(
  _payload: BedrockSendPayload,
): Promise<BedrockResponse> {
  throw new Error("Not implemented: connect sendMessageToBedrock to AWS Bedrock.");
}

/**
 * Stream the assistant reply from Bedrock, calling onChunk for each text delta.
 *
 * @param payload Conversation context + new user message.
 * @param onChunk Callback invoked with each streamed text chunk.
 * @returns The fully assembled response once streaming completes.
 */
export async function streamBedrockResponse(
  _payload: BedrockSendPayload,
  _onChunk: (chunk: string) => void,
): Promise<BedrockResponse> {
  throw new Error("Not implemented: connect streamBedrockResponse to AWS Bedrock.");
}

/**
 * Fetch persisted chat history for a given conversation id.
 *
 * @param conversationId Stable identifier for the conversation.
 * @returns Ordered list of historical messages.
 */
export async function fetchChatHistory(_conversationId: string): Promise<Message[]> {
  throw new Error("Not implemented: connect fetchChatHistory to your storage backend.");
}
