import type { Job, ProspectingCriteria } from "@/types";

/**
 * n8n webhook stubs. Wire these to your n8n production webhook URLs.
 */

export interface GenerateDatabaseResult {
  sheetUrl: string;
  rowsExported: number;
}

/**
 * Trigger the n8n workflow that generates the prospect database and exports
 * the result to Google Sheets.
 *
 * @param criteria The structured search criteria from the chat card.
 * @returns The Google Sheet URL and number of rows exported.
 */
export async function triggerGenerateDatabaseWebhook(
  _criteria: ProspectingCriteria,
): Promise<GenerateDatabaseResult> {
  throw new Error("Not implemented: wire to your n8n 'Generate Database' webhook.");
}

/**
 * Trigger the n8n workflow that registers a new recurrent job in the
 * downstream system (e.g. scheduling a recurring scrape + report).
 *
 * @param jobConfig The job configuration (industry, location, schedule, etc.).
 * @returns The persisted job record.
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
 *
 * @param jobId The job identifier.
 * @param action The action to perform.
 */
export async function triggerJobActionWebhook(
  _jobId: string,
  _action: JobAction,
): Promise<{ ok: true } | { ok: false; error: string }> {
  throw new Error("Not implemented: wire to your n8n 'Job Action' webhook.");
}
