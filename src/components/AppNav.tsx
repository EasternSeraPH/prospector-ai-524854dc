import { MessageSquare, Repeat, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppTab, type AppTab } from "@/contexts/AppTabContext";

const tabs: { id: AppTab; label: string; icon: typeof MessageSquare }[] = [
  { id: "chat", label: "Chat Assistant", icon: MessageSquare },
  { id: "jobs", label: "Recurrent Jobs", icon: Repeat },
];

export function AppNav() {
  const { tab, setTab } = useAppTab();

  return (
    <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="h-full max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-elegant shrink-0">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <p className="font-semibold text-sm leading-tight truncate">Prospecting Assistant</p>
            <p className="text-[11px] text-muted-foreground leading-tight">AI-powered lead generation</p>
          </div>
        </div>

        <nav className="flex items-center gap-1 rounded-xl bg-muted p-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-medium transition-smooth",
                  active
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">{t.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
