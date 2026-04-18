import { useEffect, useRef } from "react";
import type { Message } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Bot } from "lucide-react";

interface Props {
  messages: Message[];
  isSending: boolean;
}

export function MessageList({ messages, isSending }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  return (
    <div className="flex flex-col gap-5 px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}

      {isSending && (
        <div className="flex gap-3 animate-fade-in">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <Bot className="h-4 w-4" />
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 shadow-sm">
            <TypingIndicator />
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
