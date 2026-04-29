/**
 * Thin shims around the AI endpoints. Each helper hits the backend and then
 * streams the result locally for a smooth UX. When the backend grows real
 * SSE/chunked support we can swap the inner stream for a `ReadableStream`
 * reader without changing the call sites.
 */

import { api } from "./api";

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
    yield "AI temporar indisponibil. Reîncearcă în câteva momente.";
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
    yield "AI temporar indisponibil. Reîncearcă în câteva momente.";
  }
}

export async function* deriveTicket(
  message: string
): AsyncGenerator<string, void, unknown> {
  // Best-effort local draft — the actual ticket creation happens through
  // POST /chat/derive-ticket. Streamed copy is just shown next to the bot bubble.
  const result = `Am identificat un ticket din mesaj: "${message.slice(0, 100)}". Propun: verificare, asignare responsabil, termen 3 zile, status inițial "todo".`;
  yield* streamText(result, 10, 28);
}

/** @deprecated Renamed to {@link deriveTicket}. Retained as a thin alias. */
export const deriveTask = deriveTicket;

export async function* suggestPlanForUser(
  userName: string,
  focusItems: string[]
): AsyncGenerator<string, void, unknown> {
  const result = `Plan Smart pentru ${userName}: 1) închide prioritățile de azi (${focusItems.slice(0, 2).join(", ")}), 2) rezervă 45 minute pentru follow-up clienți, 3) trimite minimum o solicitare de contract până la ora 16:00.`;
  yield* streamText(result, 11, 32);
}
