import { useEffect, useState } from "react";
import { Building2, MapPin, Target, Sparkles, Database, Repeat, Loader2, Pencil, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { ProspectingCriteria } from "@/types";
import { generateProspects, downloadProspectsXlsx } from "@/lib/api/prospects";
import { useJobs } from "@/contexts/JobsContext";
import { useAppTab } from "@/contexts/AppTabContext";
import { useChat } from "@/contexts/ChatContext";

interface Props extends ProspectingCriteria {}

export function ProspectingSummaryCard(props: Props) {
  // Local, editable copy of the criteria so the user can fix missing/wrong values
  // before generating the Excel or creating a recurrent job.
  const [industry, setIndustry] = useState(props.industry || "");
  const [geoArea, setGeoArea] = useState(props.geoArea || "");
  const [targetCount, setTargetCount] = useState<number>(props.targetCount || 0);
  const metrics = props.metrics ?? [];

  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const { addJob } = useJobs();
  const { setTab } = useAppTab();
  const { messages } = useChat();

  async function handleGenerate() {
    if (!industry.trim() || !geoArea.trim()) {
      toast.error("Please fill in industry and geographic area first.");
      return;
    }
    setIsGenerating(true);
    const toastId = toast.loading("Generating prospects with AI…", {
      description: `Targeting ${targetCount} prospects in ${industry} (${geoArea}). This runs in parallel batches.`,
    });
    try {
      const userBrief = messages
        .filter((m) => m.role === "user" && m.content.type === "text")
        .map((m) => (m.content.type === "text" ? m.content.text : ""))
        .filter(Boolean)
        .join("\n\n");

      const result = await generateProspects(
        { industry, geoArea, targetCount, metrics },
        userBrief,
      );
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
    if (!industry.trim() || !geoArea.trim()) {
      toast.error("Please fill in industry and geographic area first.");
      return;
    }
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
            <p className="text-xs text-muted-foreground">Tap any field to edit, then confirm</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <EditableField
            icon={<Building2 className="h-4 w-4" />}
            label="Industry"
            value={industry}
            placeholder="e.g. SaaS"
            onSave={setIndustry}
          />
          <EditableField
            icon={<MapPin className="h-4 w-4" />}
            label="Geographic Area"
            value={geoArea}
            placeholder="e.g. Berlin, DE"
            onSave={setGeoArea}
          />
          <EditableField
            icon={<Target className="h-4 w-4" />}
            label="Target Prospects"
            value={String(targetCount)}
            placeholder="10"
            type="number"
            onSave={(v) => setTargetCount(Math.max(0, Number(v) || 0))}
          />
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

interface EditableFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  placeholder?: string;
  type?: "text" | "number";
  onSave: (value: string) => void;
}

function EditableField({ icon, label, value, placeholder, type = "text", onSave }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  // Keep draft in sync if the parent value changes (e.g. another field was edited and re-render happened).
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  function start() {
    setDraft(value);
    setEditing(true);
  }
  function commit() {
    onSave(draft.trim());
    setEditing(false);
  }
  function cancel() {
    setDraft(value);
    setEditing(false);
  }

  const trimmed = (value ?? "").trim();
  const isEmpty = !trimmed || trimmed === "—";

  return (
    <div className="rounded-lg border bg-muted/30 p-3 space-y-1 group">
      <div className="flex items-center justify-between gap-1.5 text-muted-foreground">
        <div className="flex items-center gap-1.5 min-w-0">
          {icon}
          <span className="text-xs font-medium truncate">{label}</span>
        </div>
        {!editing && (
          <button
            type="button"
            onClick={start}
            className="opacity-60 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
            aria-label={`Edit ${label}`}
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="flex items-center gap-1">
          <Input
            autoFocus
            type={type}
            value={draft}
            placeholder={placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
            onBlur={commit}
            className="h-7 text-sm px-2"
          />
          <button
            type="button"
            onMouseDown={(e) => {
              // prevent blur firing before click handler
              e.preventDefault();
              commit();
            }}
            className="text-success hover:opacity-80"
            aria-label="Save"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              cancel();
            }}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          className="text-left w-full"
          title="Click to edit"
        >
          <p
            className={`text-sm font-semibold truncate ${
              isEmpty ? "text-muted-foreground italic" : "text-foreground"
            }`}
          >
            {isEmpty ? placeholder ?? "—" : value}
          </p>
        </button>
      )}
    </div>
  );
}
