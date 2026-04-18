import { useState } from "react";
import { Calendar, Clock, FileText, Settings2, MapPin, Building2, Target, Repeat } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { Job } from "@/types";
import { useJobs } from "@/contexts/JobsContext";

interface Props {
  job: Job;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

export function JobCard({ job }: Props) {
  const { updateJob } = useJobs();
  const [busy, setBusy] = useState(false);

  function handleToggle(checked: boolean) {
    updateJob(job.id, { status: checked ? "active" : "paused" });
    toast.success(checked ? "Job resumed" : "Job paused");
  }

  function handleViewReport() {
    setBusy(true);
    toast.info("Latest report not available yet", {
      description: "It will appear here once the first run completes.",
    });
    setTimeout(() => setBusy(false), 400);
  }

  function handleEdit() {
    toast.info("Edit configuration", { description: "Inline editing coming soon." });
  }

  const isActive = job.status === "active";

  return (
    <Card className="transition-smooth hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">{job.title}</h3>
            <p className="text-xs text-muted-foreground">
              Created {formatDate(job.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-xs font-medium ${isActive ? "text-success" : "text-muted-foreground"}`}>
              {isActive ? "Active" : "Paused"}
            </span>
            <Switch checked={isActive} onCheckedChange={handleToggle} aria-label="Toggle job status" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary" className="font-normal gap-1">
            <Building2 className="h-3 w-3" /> {job.industry}
          </Badge>
          <Badge variant="secondary" className="font-normal gap-1">
            <MapPin className="h-3 w-3" /> {job.location}
          </Badge>
          {job.targetCount > 0 && (
            <Badge variant="secondary" className="font-normal gap-1">
              <Target className="h-3 w-3" /> {job.targetCount} prospects
            </Badge>
          )}
          <Badge variant="secondary" className="font-normal gap-1 capitalize">
            <Repeat className="h-3 w-3" /> {job.frequency}
          </Badge>
        </div>

        {job.conditions && (
          <p className="text-xs text-muted-foreground line-clamp-2">{job.conditions}</p>
        )}

        <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t">
          <div className="space-y-0.5 pt-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" /> Last run
            </div>
            <p className="font-medium text-foreground">{formatDate(job.lastRunAt)}</p>
          </div>
          <div className="space-y-0.5 pt-3">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" /> Next run
            </div>
            <p className="font-medium text-foreground">{formatDate(job.nextRunAt)}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={handleViewReport} disabled={busy}>
            <FileText className="h-4 w-4" />
            View Latest News Report
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={handleEdit}>
            <Settings2 className="h-4 w-4" />
            Edit Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
