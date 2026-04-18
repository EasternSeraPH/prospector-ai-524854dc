import { Sparkles } from "lucide-react";

export function EmptyChatState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-12 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary shadow-elegant">
        <Sparkles className="h-8 w-8 text-primary-foreground" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-semibold tracking-tight">Ask me to find your next prospects…</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Describe the kind of companies you're looking for — industry, region, size, anything specific —
          and I'll help you build a targeted prospect database.
        </p>
      </div>
    </div>
  );
}
