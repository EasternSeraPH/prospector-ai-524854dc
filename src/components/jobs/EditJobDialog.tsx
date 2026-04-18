import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useJobs } from "@/contexts/JobsContext";
import type { Job, JobFrequency } from "@/types";

interface Props {
  job: Job;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Lightweight quick-edit dialog. Only the most important fields,
 * pre-filled with the job's current values.
 */
export function EditJobDialog({ job, open, onOpenChange }: Props) {
  const { updateJob } = useJobs();
  const [title, setTitle] = useState(job.title);
  const [industry, setIndustry] = useState(job.industry);
  const [location, setLocation] = useState(job.location);
  const [targetCount, setTargetCount] = useState(String(job.targetCount ?? ""));
  const [frequency, setFrequency] = useState<JobFrequency>(job.frequency);
  const [conditions, setConditions] = useState(job.conditions ?? "");

  // Re-sync when opening with a (possibly) different job.
  useEffect(() => {
    if (open) {
      setTitle(job.title);
      setIndustry(job.industry);
      setLocation(job.location);
      setTargetCount(String(job.targetCount ?? ""));
      setFrequency(job.frequency);
      setConditions(job.conditions ?? "");
    }
  }, [open, job]);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !industry.trim() || !location.trim()) {
      toast.error("Title, industry and location are required.");
      return;
    }
    updateJob(job.id, {
      title: title.trim(),
      industry: industry.trim(),
      location: location.trim(),
      targetCount: Number(targetCount) || 0,
      frequency,
      conditions: conditions.trim(),
    });
    toast.success("Job updated");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quick edit</DialogTitle>
          <DialogDescription>Update the job in a few seconds.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-industry">Industry</Label>
              <Input
                id="edit-industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-target">Target</Label>
              <Input
                id="edit-target"
                type="number"
                min={0}
                value={targetCount}
                onChange={(e) => setTargetCount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-frequency">Schedule</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as JobFrequency)}>
                <SelectTrigger id="edit-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-conditions">Conditions</Label>
            <Textarea
              id="edit-conditions"
              rows={2}
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary hover:opacity-90">
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
