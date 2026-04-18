import { useState } from "react";
import { Building2, MapPin, Target, Sparkles, Database, Repeat, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { ProspectingCriteria } from "@/types";
import { generateProspects, downloadProspectsXlsx } from "@/lib/api/prospects";
import { useJobs } from "@/contexts/JobsContext";
import { useAppTab } from "@/contexts/AppTabContext";
import { useChat } from "@/contexts/ChatContext";

interface Props extends ProspectingCriteria {}

export function ProspectingSummaryCard(props: Props) {
  const { industry = "—", geoArea = "—", targetCount = 0, metrics = [] } = props ?? {};
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const { addJob } = useJobs();
  const { setTab } = useAppTab();
  const { messages } = useChat();

  async function handleGenerate() {
    setIsGenerating(true);
    const toastId = toast.loading("Generating prospects with AI…", {
      description: `Targeting ${targetCount} prospects in ${industry || "—"} (${geoArea || "—"}). This runs in parallel batches.`,
    });
    try {
      // Build a verbatim brief from every user message so the AI sees the full request.
      const userBrief = messages
        .filter((m) => m.role === "user" && m.content.type === "text")
        .map((m) => (m.content.type === "text" ? m.content.text : ""))
        .filter(Boolean)
        .join("\n\n");

      const result = await generateProspects(props, userBrief);
      downloadProspectsXlsx(result);
      toast.success("Excel file ready", {
        id: toastId,
        description: `${result.summary.total} prospects classified (A: ${result.summary.tierA}, B: ${result.summary.tierB}, C: ${result.summary.tierC}). Download started.`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error("Couldn't generate prospects", { id: toastId, description: message });
    } finally {
      setIsGenerating(false);
    }
  }

  function handleCreateJob() {
    setIsCreatingJob(true);
    try {
      addJob({
        title: `${industry} in ${geoArea}`,
        industry,
        location: geoArea,
        targetCount,
        conditions: metrics.join(", "),
        frequency: "weekly",
      });
      toast.success("Recurrent job created", {
        description: "You can manage it from the Recurrent Jobs tab.",
      });
      setTab("jobs");
    } finally {
      setIsCreatingJob(false);
    }
  }

  return (
    <Card className="w-full max-w-lg border-primary/20 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Prospecting Summary</p>
            <p className="text-xs text-muted-foreground">Review and confirm to proceed</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field icon={<Building2 className="h-4 w-4" />} label="Industry" value={industry} />
          <Field icon={<MapPin className="h-4 w-4" />} label="Geographic Area" value={geoArea} />
          <Field icon={<Target className="h-4 w-4" />} label="Target Prospects" value={String(targetCount)} />
        </div>

        {metrics.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Custom Conditions</p>
            <div className="flex flex-wrap gap-1.5">
              {metrics.map((m) => (
                <Badge key={m} variant="secondary" className="font-normal">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 bg-gradient-primary hover:opacity-90 transition-smooth"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Database className="h-4 w-4" />
            )}
            {isGenerating ? "Generating…" : "Generate Prospects & Download Excel"}
          </Button>
          <Button
            onClick={handleCreateJob}
            disabled={isCreatingJob}
            variant="outline"
            className="flex-1"
          >
            <Repeat className="h-4 w-4" />
            Create Recurrent Job
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-sm font-semibold text-foreground truncate" title={value}>
        {value}
      </p>
    </div>
  );
}
