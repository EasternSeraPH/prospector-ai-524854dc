import { useEffect, useRef, type KeyboardEvent } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isSending?: boolean;
}

export function ChatComposer({ value, onChange, onSend, disabled, isSending }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-grow
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }

  return (
    <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 sticky bottom-0">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring transition-smooth">
          <Textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your prospecting request… (e.g. SaaS companies in Germany with 50–200 employees)"
            rows={1}
            className="min-h-[40px] max-h-[200px] resize-none border-0 shadow-none focus-visible:ring-0 px-2 py-2 text-sm"
            disabled={disabled}
          />
          <Button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            size="icon"
            className="shrink-0 h-10 w-10 rounded-xl bg-gradient-primary hover:opacity-90 transition-smooth"
            aria-label="Send message"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1.5 px-2">
          Press Enter to send, Shift + Enter for a new line.
        </p>
      </div>
    </div>
  );
}
