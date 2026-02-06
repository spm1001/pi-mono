/**
 * Prompt-level timing instrumentation for AgentSession.prompt().
 *
 * Traces the time spent in each phase between user pressing Enter
 * and agent.prompt() being called (the "dark matter" before the API request).
 *
 * Enable with PI_PROMPT_TRACE=1 environment variable.
 *
 * This complements the PI_PERF_TRACE in packages/ai which traces
 * the agent-loop/provider layer (message conversion, HTTP request, etc.).
 */

const ENABLED = process.env.PI_PROMPT_TRACE === "1" || process.env.PI_PERF_TRACE === "1";

interface PromptTraceData {
	start: number;
	phases: Array<{ name: string; ms: number }>;
}

let currentTrace: PromptTraceData | null = null;
let lastTrace: PromptTraceData | null = null;

/** Start a new prompt trace. Call at the beginning of AgentSession.prompt(). */
export function startPromptTrace(): void {
	if (!ENABLED) return;
	currentTrace = { start: performance.now(), phases: [] };
}

/** Record a phase timing. `phaseStart` should be the performance.now() when the phase began. */
export function tracePromptPhase(name: string, phaseStart: number): void {
	if (!ENABLED || !currentTrace) return;
	currentTrace.phases.push({ name, ms: performance.now() - phaseStart });
}

/** End the prompt trace and log results. Call just before agent.prompt(). */
export function endPromptTrace(): void {
	if (!ENABLED || !currentTrace) return;
	const total = performance.now() - currentTrace.start;
	currentTrace.phases.push({ name: "total", ms: total });
	lastTrace = currentTrace;

	const parts = currentTrace.phases.map((p) => `${p.name}=${p.ms.toFixed(1)}ms`);
	console.error(`[prompt-trace] ${parts.join(" | ")}`);

	currentTrace = null;
}

/** Get the last completed prompt trace (for testing). */
export function getLastPromptTrace(): PromptTraceData | null {
	return lastTrace;
}
