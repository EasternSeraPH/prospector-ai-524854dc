import { useState } from "react";
import { Bug, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { N8N_CHAT_WEBHOOK_URL, sendMessageToN8n, getOrCreateSessionId } from "@/lib/api/n8nChat";

/**
 * TEMPORARY developer panel to ping the n8n chat webhook and inspect the raw response.
 * Remove once the integration is validated.
 */
export function N8nWebhookTester() {
  const [message, setMessage] = useState("Bonjour, je cherche des prospects.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  async function handleTest() {
    setLoading(true);
    setStatus("idle");
    setResult("");
    try {
      const res = await sendMessageToN8n({
        conversationId: "debug",
        message,
        history: [],
      });
      setStatus("ok");
      setResult(JSON.stringify(res.content, null, 2));
    } catch (err) {
      setStatus("error");
      setResult(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-b bg-amber-50 dark:bg-amber-950/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <Bug className="h-3.5 w-3.5 text-amber-600" />
          <span className="font-semibold text-amber-900 dark:text-amber-200">
            n8n webhook tester (temporary)
          </span>
          <code className="text-[10px] text-muted-foreground truncate hidden sm:inline">
            {N8N_CHAT_WEBHOOK_URL}
          </code>
        </div>
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Test message…"
            className="h-8 text-xs"
            disabled={loading}
          />
          <Button onClick={handleTest} disabled={loading || !message.trim()} size="sm" className="h-8">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            Test
          </Button>
        </div>
        {result && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px]">
              <span
                className={
                  status === "ok"
                    ? "font-medium text-green-700 dark:text-green-400"
                    : "font-medium text-destructive"
                }
              >
                {status === "ok" ? "✓ Success" : "✗ Error"}
              </span>
              <span className="text-muted-foreground">
                sessionId: <code>{getOrCreateSessionId()}</code>
              </span>
            </div>
            <pre className="max-h-40 overflow-auto rounded border bg-background p-2 text-[11px] font-mono whitespace-pre-wrap break-all">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
