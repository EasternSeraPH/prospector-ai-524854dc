/**
 * Shared TypeScript types for the AI Prospecting Assistant.
 */

export interface ProspectingCriteria {
  industry: string;
  geoArea: string;
  targetCount: number;
  metrics: string[];
}

export type MessageRole = "user" | "assistant";

export type MessageContent =
  | { type: "text"; text: string }
  | { type: "component"; componentName: "ProspectingSummaryCard"; props: ProspectingCriteria };

export interface Message {
  id: string;
  role: MessageRole;
  content: MessageContent;
  createdAt: string; // ISO timestamp
}

export type JobStatus = "active" | "paused";
export type JobFrequency = "daily" | "weekly" | "monthly";

export interface Job {
  id: string;
  title: string;
  industry: string;
  location: string;
  targetCount: number;
  conditions: string;
  frequency: JobFrequency;
  status: JobStatus;
  lastRunAt: string | null; // ISO timestamp
  nextRunAt: string | null; // ISO timestamp
  createdAt: string;
}

export type JobInput = Omit<Job, "id" | "status" | "lastRunAt" | "nextRunAt" | "createdAt"> &
  Partial<Pick<Job, "status">>;
