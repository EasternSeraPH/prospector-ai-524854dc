import { Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  variant?: "no-jobs" | "no-results";
  onCreate?: () => void;
}

export function EmptyJobsState({ variant = "no-jobs", onCreate }: Props) {
  const isNoResults = variant === "no-results";
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-card/50 px-6 py-16 text-center animate-fade-in">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
        <Inbox className="h-7 w-7 text-muted-foreground" />
      </div>
      <div className="space-y-1.5 max-w-md">
        <h3 className="text-lg font-semibold">
          {isNoResults ? "No jobs match your filters" : "No recurrent jobs found"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isNoResults
            ? "Try adjusting your search or clearing the filters to see more results."
            : "Recurrent jobs let you automate prospecting on a schedule. Create your first one to get started."}
        </p>
      </div>
      {!isNoResults && onCreate && (
        <Button onClick={onCreate} className="bg-gradient-primary hover:opacity-90 transition-smooth">
          <Plus className="h-4 w-4" />
          Create your first job
        </Button>
      )}
    </div>
  );
}
