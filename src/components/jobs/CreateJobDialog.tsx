import { useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useJobs } from "@/contexts/JobsContext";
import type { JobFrequency } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateJobDialog({ open, onOpenChange }: Props) {
  const { addJob } = useJobs();
  const [title, setTitle] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [targetCount, setTargetCount] = useState("");
  const [conditions, setConditions] = useState("");
  const [frequency, setFrequency] = useState<JobFrequency>("weekly");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setTitle("");
    setIndustry("");
    setLocation("");
    setTargetCount("");
    setConditions("");
    setFrequency("weekly");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !industry.trim() || !location.trim()) {
      toast.error("Please fill in the required fields.");
      return;
    }
    setSubmitting(true);
    try {
      addJob({
        title: title.trim(),
        industry: industry.trim(),
        location: location.trim(),
        targetCount: Number(targetCount) || 0,
        conditions: conditions.trim(),
        frequency,
      });
      toast.success("Job created", { description: "Your new recurrent job is now active." });
      reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a new recurrent job</DialogTitle>
          <DialogDescription>
            Set up an automated prospecting job. You can edit or pause it at any time.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Job title *</Label>
            <Input
              id="title"
              placeholder="e.g. SaaS leads — DACH weekly"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry sector *</Label>
              <Input
                id="industry"
                placeholder="e.g. SaaS, Fintech"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g. Germany, EU"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="target">Target prospects</Label>
              <Input
                id="target"
                type="number"
                min={0}
                placeholder="e.g. 100"
                value={targetCount}
                onChange={(e) => setTargetCount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Schedule</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as JobFrequency)}>
                <SelectTrigger id="frequency">
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

          <div className="space-y-2">
            <Label htmlFor="conditions">Custom conditions</Label>
            <Textarea
              id="conditions"
              placeholder="e.g. 50–200 employees, raised funding in last 12 months"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-gradient-primary hover:opacity-90">
              {submitting ? "Creating…" : "Create job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
