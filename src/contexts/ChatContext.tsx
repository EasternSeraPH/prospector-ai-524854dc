import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Message, MessageContent } from "@/types";

interface ChatContextValue {
  messages: Message[];
  draft: string;
  isSending: boolean;
  setDraft: (value: string) => void;
  appendMessage: (role: Message["role"], content: MessageContent) => Message;
  setIsSending: (value: boolean) => void;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const appendMessage = useCallback<ChatContextValue["appendMessage"]>((role, content) => {
    const msg: Message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setDraft("");
    setIsSending(false);
  }, []);

  const value = useMemo(
    () => ({ messages, draft, isSending, setDraft, appendMessage, setIsSending, clearChat }),
    [messages, draft, isSending, appendMessage, clearChat],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
