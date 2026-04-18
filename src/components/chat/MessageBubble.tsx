import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";
import { ProspectingSummaryCard } from "./ProspectingSummaryCard";

interface Props {
  message: Message;
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 animate-fade-in", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
        aria-hidden
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className={cn("flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]", isUser ? "items-end" : "items-start")}>
        {message.content.type === "text" ? (
          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm",
              isUser
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-muted text-foreground rounded-tl-sm",
            )}
          >
            {message.content.text}
          </div>
        ) : (
          <ProspectingSummaryCard {...message.content.props} />
        )}
        <span className="text-[10px] text-muted-foreground px-1">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
}
