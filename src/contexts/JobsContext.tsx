import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Job, JobInput } from "@/types";

export interface JobFilters {
  industry: string; // "" = all
  location: string;
  status: string; // "" | "active" | "paused"
}

interface JobsContextValue {
  jobs: Job[];
  isLoading: boolean;
  searchQuery: string;
  filters: JobFilters;
  setSearchQuery: (value: string) => void;
  setFilters: (patch: Partial<JobFilters>) => void;
  addJob: (input: JobInput) => Job;
  updateJob: (id: string, patch: Partial<Job>) => void;
  removeJob: (id: string) => void;
  setIsLoading: (value: boolean) => void;
}

const JobsContext = createContext<JobsContextValue | null>(null);

const initialFilters: JobFilters = { industry: "", location: "", status: "" };

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFiltersState] = useState<JobFilters>(initialFilters);

  const setFilters = useCallback((patch: Partial<JobFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...patch }));
  }, []);

  const addJob = useCallback<JobsContextValue["addJob"]>((input) => {
    const job: Job = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: input.title,
      industry: input.industry,
      location: input.location,
      targetCount: input.targetCount,
      conditions: input.conditions,
      frequency: input.frequency,
      status: input.status ?? "active",
      lastRunAt: null,
      nextRunAt: null,
      createdAt: new Date().toISOString(),
    };
    setJobs((prev) => [job, ...prev]);
    return job;
  }, []);

  const updateJob = useCallback<JobsContextValue["updateJob"]>((id, patch) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const removeJob = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      jobs,
      isLoading,
      searchQuery,
      filters,
      setSearchQuery,
      setFilters,
      addJob,
      updateJob,
      removeJob,
      setIsLoading,
    }),
    [jobs, isLoading, searchQuery, filters, setFilters, addJob, updateJob, removeJob],
  );

  return <JobsContext.Provider value={value}>{children}</JobsContext.Provider>;
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error("useJobs must be used within JobsProvider");
  return ctx;
}
