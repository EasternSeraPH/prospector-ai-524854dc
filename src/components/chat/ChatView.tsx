import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChat } from "@/contexts/ChatContext";
import { sendMessageToN8n } from "@/lib/api/n8nChat";
import { ChatComposer } from "./ChatComposer";
import { EmptyChatState } from "./EmptyChatState";
import { MessageList } from "./MessageList";

export function ChatView() {
  const { messages, draft, setDraft, isSending, setIsSending, appendMessage } = useChat();

  async function handleSend() {
    const text = draft.trim();
    if (!text || isSending) return;

    appendMessage("user", { type: "text", text });
    setDraft("");
    setIsSending(true);

    try {
      const res = await sendMessageToN8n({
        conversationId: "default",
        message: text,
        history: messages,
      });
      appendMessage("assistant", res.content);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error("Assistant unavailable", { description: message });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <ScrollArea className="flex-1">
        {messages.length === 0 && !isSending ? (
          <div className="h-[calc(100vh-12rem)]">
            <EmptyChatState />
          </div>
        ) : (
          <MessageList messages={messages} isSending={isSending} />
        )}
      </ScrollArea>
      <ChatComposer
        value={draft}
        onChange={setDraft}
        onSend={handleSend}
        disabled={isSending}
        isSending={isSending}
      />
    </div>
  );
}
