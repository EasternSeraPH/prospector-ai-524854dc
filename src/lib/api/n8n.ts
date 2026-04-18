import type { Job } from "@/types";

/**
 * n8n webhook stubs for the recurrent jobs feature.
 * Note: prospect database generation now uses Lovable AI directly
 * (see `src/lib/api/prospects.ts`), not n8n.
 */

/**
 * Trigger the n8n workflow that registers a new recurrent job in the
 * downstream system (e.g. scheduling a recurring scrape + report).
 */
export async function triggerCreateRecurrentJobWebhook(
  _jobConfig: Omit<Job, "id" | "createdAt">,
): Promise<Job> {
  throw new Error("Not implemented: wire to your n8n 'Create Recurrent Job' webhook.");
}

export type JobAction = "run-now" | "pause" | "resume" | "view-report" | "delete";

/**
 * Trigger an action on an existing recurrent job through n8n
 * (run now, pause/resume, fetch latest report, etc.).
 */
export async function triggerJobActionWebhook(
  _jobId: string,
  _action: JobAction,
): Promise<{ ok: true } | { ok: false; error: string }> {
  throw new Error("Not implemented: wire to your n8n 'Job Action' webhook.");
}

