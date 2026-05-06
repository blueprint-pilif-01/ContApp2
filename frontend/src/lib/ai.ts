import { api } from "./api";
import type { Workflow } from "./automation/types";

export async function* streamText(
  text: string,
  chunkSize = 12,
  delayMs = 35
): AsyncGenerator<string, void, unknown> {
  let built = "";
  for (let i = 0; i < text.length; i += chunkSize) {
    built += text.slice(i, i + chunkSize);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    yield built;
  }
}

const AI_UNAVAILABLE = "AI temporar indisponibil. Reîncearcă în câteva momente.";

export async function* summarize(
  input: string
): AsyncGenerator<string, void, unknown> {
  const cleaned = input.trim();
  if (!cleaned) {
    yield "Nu există conținut pentru sumarizare.";
    return;
  }
  try {
    const res = await api.post<{ summary: string }>("/ai/summarize", {
      text: cleaned,
    });
    yield* streamText(res.summary || "Nu am putut genera un rezumat.");
  } catch {
    yield AI_UNAVAILABLE;
  }
}

export async function* topicDigest(
  inputs: string[]
): AsyncGenerator<string, void, unknown> {
  if (inputs.length === 0) {
    yield "Nu există articole pentru digest.";
    return;
  }
  try {
    const res = await api.post<{ digest: string }>("/ai/topic-digest", {
      articles: inputs,
    });
    yield* streamText(res.digest || "Nu am putut genera un digest.");
  } catch {
    yield AI_UNAVAILABLE;
  }
}

export async function* deriveTicket(
  message: string
): AsyncGenerator<string, void, unknown> {
  const trimmed = message.trim();
  if (!trimmed) return;
  try {
    const res = await api.post<{ suggestion: string }>("/ai/derive-ticket", {
      message: trimmed,
    });
    yield* streamText(res.suggestion || AI_UNAVAILABLE);
  } catch {
    yield AI_UNAVAILABLE;
  }
}

export async function* suggestPlanForUser(
  userName: string,
  focusItems: string[]
): AsyncGenerator<string, void, unknown> {
  try {
    const res = await api.post<{ plan: string }>("/ai/suggest-plan", {
      user_name: userName,
      focus_items: focusItems,
    });
    yield* streamText(res.plan || AI_UNAVAILABLE);
  } catch {
    yield AI_UNAVAILABLE;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Automation Studio — apeluri reale către `/ai/*` (fără text fabricat la erori)
// ─────────────────────────────────────────────────────────────────────────────

export interface DraftWorkflowResponse {
  workflow: Workflow;
  explanation?: string;
}

export async function draftWorkflowFromText(
  prompt: string,
): Promise<DraftWorkflowResponse | null> {
  const trimmed = prompt.trim();
  if (!trimmed) return null;
  try {
    return await api.post<DraftWorkflowResponse>("/ai/draft-workflow", {
      prompt: trimmed,
    });
  } catch {
    return null;
  }
}

export async function* explainWorkflow(
  workflow: Workflow,
): AsyncGenerator<string, void, unknown> {
  try {
    const res = await api.post<{ explanation: string }>(
      "/ai/explain-workflow",
      { workflow },
    );
    yield* streamText(res.explanation || AI_UNAVAILABLE);
  } catch {
    yield AI_UNAVAILABLE;
  }
}

export interface SuggestedWorkflow {
  id: string;
  name: string;
  rationale: string;
  workflow: Workflow;
}

export async function suggestWorkflowsForOrg(): Promise<
  | { ok: true; suggestions: SuggestedWorkflow[] }
  | { ok: false }
> {
  try {
    const res = await api.post<{ suggestions: SuggestedWorkflow[] }>(
      "/ai/suggest-workflows",
      {},
    );
    return {
      ok: true,
      suggestions: Array.isArray(res?.suggestions) ? res.suggestions : [],
    };
  } catch {
    return { ok: false };
  }
}

export async function* draftEmailWithAI(
  context: { subject?: string; recipient?: string; brief: string },
): AsyncGenerator<string, void, unknown> {
  if (!context.brief.trim()) return;
  try {
    const res = await api.post<{ body: string }>("/ai/draft-email", context);
    yield* streamText(res.body || AI_UNAVAILABLE);
  } catch {
    yield AI_UNAVAILABLE;
  }
}

export interface ClassifyResult {
  label: string;
  confidence: number;
}

export async function classifyWithAI(
  text: string,
  labels: string[],
): Promise<ClassifyResult | null> {
  if (!text.trim() || labels.length === 0) return null;
  try {
    return await api.post<ClassifyResult>("/ai/classify", { text, labels });
  } catch {
    return null;
  }
}

export async function extractFieldsWithAI<T extends Record<string, string>>(
  text: string,
  schema: Record<string, string>,
): Promise<T | null> {
  if (!text.trim()) return null;
  try {
    return await api.post<T>("/ai/extract-fields", { text, schema });
  } catch {
    return null;
  }
}

export async function* translateWithAI(
  text: string,
  targetLang: string,
): AsyncGenerator<string, void, unknown> {
  if (!text.trim()) return;
  try {
    const res = await api.post<{ text: string }>("/ai/translate", {
      text,
      target_lang: targetLang,
    });
    yield* streamText(res.text || AI_UNAVAILABLE);
  } catch {
    yield AI_UNAVAILABLE;
  }
}

export interface SentimentResult {
  score: number;
  label: "positive" | "neutral" | "negative";
}

export async function analyseSentimentWithAI(
  text: string,
): Promise<SentimentResult | null> {
  if (!text.trim()) return null;
  try {
    return await api.post<SentimentResult>("/ai/sentiment", { text });
  } catch {
    return null;
  }
}

export interface SuggestedAssignee {
  user_id: string | number;
  name: string;
  reason: string;
}

export async function suggestAssigneeWithAI(
  context: Record<string, unknown>,
): Promise<SuggestedAssignee | null> {
  try {
    return await api.post<SuggestedAssignee>("/ai/suggest-assignee", context);
  } catch {
    return null;
  }
}

export async function predictDueDateWithAI(
  context: Record<string, unknown>,
): Promise<{ due_date: string; rationale: string } | null> {
  try {
    return await api.post<{ due_date: string; rationale: string }>(
      "/ai/predict-due-date",
      context,
    );
  } catch {
    return null;
  }
}

export async function scoreLeadWithAI(
  context: Record<string, unknown>,
): Promise<{ score: number; reasons: string[] } | null> {
  try {
    return await api.post<{ score: number; reasons: string[] }>(
      "/ai/score-lead",
      context,
    );
  } catch {
    return null;
  }
}

export async function* generateTaskDescriptionWithAI(
  title: string,
  context?: Record<string, unknown>,
): AsyncGenerator<string, void, unknown> {
  const trimmed = title.trim();
  if (!trimmed) return;
  try {
    const res = await api.post<{ description: string }>(
      "/ai/generate-task-description",
      { title: trimmed, context: context ?? {} },
    );
    yield* streamText(res.description || AI_UNAVAILABLE);
  } catch {
    yield AI_UNAVAILABLE;
  }
}

export interface AgentRunStep {
  index: number;
  status: "running" | "success" | "error";
  output?: string;
  error?: string;
}

export async function runAgentStep(
  agentId: string,
  step_index: number,
  context: Record<string, unknown>,
): Promise<AgentRunStep | null> {
  try {
    return await api.post<AgentRunStep>("/ai/agent-run", {
      agent_id: agentId,
      step_index,
      context,
    });
  } catch {
    return null;
  }
}
