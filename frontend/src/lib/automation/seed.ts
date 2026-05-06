import type { Workflow, WorkflowRun, WorkflowRunStep } from "./types";

/**
 * Build a few example WorkflowRun records from the user's existing workflows.
 *
 * IMPORTANT: this seeds *demo execution metadata* (timestamps, statuses,
 * step paths) — it does NOT fabricate AI response strings. Where a step is
 * an AI step, `ai_output` is omitted until a real `/ai/*` call has filled it.
 */
export function seedRunsForWorkflows(workflows: Workflow[]): WorkflowRun[] {
  if (workflows.length === 0) return [];
  const runs: WorkflowRun[] = [];
  const now = Date.now();

  workflows.slice(0, 6).forEach((wf, wfIdx) => {
    const runCount = Math.max(1, 3 - wfIdx);
    for (let i = 0; i < runCount; i++) {
      const minutesAgo = (wfIdx + 1) * 35 + i * 220;
      const startedAt = new Date(now - minutesAgo * 60_000);
      const finishedAt = new Date(startedAt.getTime() + 1_500 + i * 800);
      const status: WorkflowRun["status"] =
        wfIdx === 1 && i === 0 ? "error" : i === runCount - 1 && wfIdx === 0 ? "running" : "success";

      let steps: WorkflowRunStep[] = wf.steps.map((step, idx) => {
        const lastErr = status === "error" && idx === wf.steps.length - 1;
        const row: WorkflowRunStep = {
          step_index: idx,
          step_path: `0.${idx}`,
          kind: step.kind,
          status: lastErr ? "error" : "success",
          started_at: new Date(startedAt.getTime() + idx * 200).toISOString(),
          finished_at: new Date(startedAt.getTime() + idx * 200 + 180).toISOString(),
        };
        if (lastErr) {
          row.error = "Eroare exemplificativă: integrarea externă a returnat 500.";
        }
        return row;
      });

      if (status === "running") {
        const mid = Math.floor(wf.steps.length / 2);
        steps = steps.map((s, idx) => {
          if (idx === mid) {
            const { finished_at: _f, ...rest } = s;
            return { ...rest, status: "running" as const };
          }
          if (idx > mid) {
            const { finished_at: _f, ...rest } = s;
            return { ...rest, status: "skipped" as const };
          }
          return s;
        });
      }

      const baseRun = {
        id: `run_seed_${wf.id}_${i}`,
        workflow_id: wf.id,
        workflow_name: wf.name,
        trigger_label: wf.trigger.kind,
        started_at: startedAt.toISOString(),
        status,
        steps,
      };

      runs.push(
        status === "running"
          ? baseRun
          : { ...baseRun, finished_at: finishedAt.toISOString() },
      );
    }
  });

  runs.sort((a, b) => b.started_at.localeCompare(a.started_at));
  return runs;
}
