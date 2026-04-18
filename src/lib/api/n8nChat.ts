import type { Message, MessageContent, ProspectingCriteria } from "@/types";

/**
 * n8n Chat webhook integration.
 * The n8n workflow receives the user message + history and responds with
 * either plain text or a structured payload that we render in the chat.
 */

export const N8N_CHAT_WEBHOOK_URL =
  "https://zephyr6352.app.n8n.cloud/webhook-test/chat";

export interface N8nChatPayload {
  conversationId: string;
  message: string;
  history: Message[];
}

export interface N8nChatResponse {
  content: MessageContent;
}

/**
 * Try to coerce an arbitrary n8n response into a MessageContent we can render.
 * Supports:
 *  - { type: "text", text }
 *  - { type: "component", componentName: "ProspectingSummaryCard", props }
 *  - { output | reply | message | text | answer: string }
 *  - raw string
 *  - array (uses the first item)
 */
function coerceToMessageContent(raw: unknown): MessageContent {
  if (raw == null) {
    return { type: "text", text: "" };
  }

  if (typeof raw === "string") {
    return { type: "text", text: raw };
  }

  if (Array.isArray(raw)) {
    return coerceToMessageContent(raw[0]);
  }

  if (typeof raw === "object") {
    const obj = raw as Record<string, unknown>;

    // Already in our MessageContent shape
    if (obj.type === "text" && typeof obj.text === "string") {
      return { type: "text", text: obj.text };
    }

    if (
      obj.type === "component" &&
      obj.componentName === "ProspectingSummaryCard" &&
      obj.props &&
      typeof obj.props === "object"
    ) {
      return {
        type: "component",
        componentName: "ProspectingSummaryCard",
        props: obj.props as ProspectingCriteria,
      };
    }

    // Common n8n / LLM output keys
    const textCandidate =
      obj.output ?? obj.reply ?? obj.message ?? obj.text ?? obj.answer ?? obj.response;
    if (typeof textCandidate === "string") {
      return { type: "text", text: textCandidate };
    }
    if (textCandidate && typeof textCandidate === "object") {
      return coerceToMessageContent(textCandidate);
    }

    // Nested data envelope
    if (obj.data) {
      return coerceToMessageContent(obj.data);
    }
  }

  // Last resort: stringify so the user sees *something* rather than a blank bubble
  return { type: "text", text: JSON.stringify(raw) };
}

/**
 * Send a user message to the configured n8n chat webhook and return the
 * assistant's reply as a renderable MessageContent.
 */
export async function sendMessageToN8n(
  payload: N8nChatPayload,
): Promise<N8nChatResponse> {
  const res = await fetch(N8N_CHAT_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversationId: payload.conversationId,
      message: payload.message,
      history: payload.history.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `n8n webhook responded ${res.status} ${res.statusText}${body ? ` — ${body}` : ""}`,
    );
  }

  // n8n may return JSON or plain text depending on the "Respond to Webhook" node config.
  const contentType = res.headers.get("content-type") ?? "";
  let raw: unknown;
  if (contentType.includes("application/json")) {
    raw = await res.json();
  } else {
    const text = await res.text();
    try {
      raw = JSON.parse(text);
    } catch {
      raw = text;
    }
  }

  return { content: coerceToMessageContent(raw) };
}
