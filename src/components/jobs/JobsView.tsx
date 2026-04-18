import { useMemo, useState } from "react";
import { useJobs } from "@/contexts/JobsContext";
import { CreateJobDialog } from "./CreateJobDialog";
import { EmptyJobsState } from "./EmptyJobsState";
import { JobCard } from "./JobCard";
import { JobsControlBar } from "./JobsControlBar";
import { JobsListSkeleton } from "./JobsListSkeleton";

export function JobsView() {
  const { jobs, isLoading, searchQuery, filters } = useJobs();
  const [createOpen, setCreateOpen] = useState(false);

  const industries = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.industry).filter(Boolean))).sort(),
    [jobs],
  );
  const locations = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.location).filter(Boolean))).sort(),
    [jobs],
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((j) => {
      if (filters.industry && j.industry !== filters.industry) return false;
      if (filters.location && j.location !== filters.location) return false;
      if (filters.status && j.status !== filters.status) return false;
      if (!q) return true;
      const haystack = `${j.title} ${j.industry} ${j.location} ${j.conditions}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [jobs, searchQuery, filters]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Recurrent Jobs</h1>
        <p className="text-sm text-muted-foreground">
          Automated prospecting jobs that run on a schedule. Manage, pause, or edit any job at any time.
        </p>
      </div>

      <JobsControlBar
        onCreate={() => setCreateOpen(true)}
        industries={industries}
        locations={locations}
      />

      {isLoading ? (
        <JobsListSkeleton />
      ) : jobs.length === 0 ? (
        <EmptyJobsState variant="no-jobs" onCreate={() => setCreateOpen(true)} />
      ) : filtered.length === 0 ? (
        <EmptyJobsState variant="no-results" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      <CreateJobDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
