import type { Job, JobInput } from "@/types";

/**
 * Recurrent jobs API stubs. Wire to your jobs backend (REST or edge function).
 */

/**
 * List all recurrent jobs visible to the current user.
 */
export async function fetchJobs(): Promise<Job[]> {
  throw new Error("Not implemented: connect fetchJobs to your backend.");
}

/**
 * Create a new recurrent job.
 *
 * @param job The new job configuration.
 * @returns The persisted job, including server-assigned id and timestamps.
 */
export async function createJob(_job: JobInput): Promise<Job> {
  throw new Error("Not implemented: connect createJob to your backend.");
}

/**
 * Patch fields on an existing job (e.g. status toggle, edit configuration).
 *
 * @param id The job id.
 * @param patch Partial fields to update.
 */
export async function updateJob(_id: string, _patch: Partial<Job>): Promise<Job> {
  throw new Error("Not implemented: connect updateJob to your backend.");
}

/**
 * Permanently delete a job.
 */
export async function deleteJob(_id: string): Promise<void> {
  throw new Error("Not implemented: connect deleteJob to your backend.");
}

/**
 * Manually trigger a single run of the job, outside its schedule.
 */
export async function runJobNow(_id: string): Promise<Job> {
  throw new Error("Not implemented: connect runJobNow to your backend.");
}
