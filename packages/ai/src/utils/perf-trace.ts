/**
 * Lightweight latency measurement for the LLM request pipeline.
 *
 * Enable with: PI_PERF_TRACE=1 (env var) or setPerfTraceEnabled(true)
 *
 * Measures time-to-first-token (TTFT) broken down by phase:
 *   - transformContext: context transform hook
 *   - convertToLlm: message conversion to LLM format
 *   - getApiKey: API key resolution (may involve OAuth refresh)
 *   - buildParams: message serialization for the provider
 *   - httpRequest: from SDK call to first SSE event
 *   - total: end-to-end from streamAssistantResponse entry to first token
 *
 * Usage in tests/benchmarks:
 *   import { setPerfTraceEnabled, getLastTrace, resetTrace } from "./utils/perf-trace.js";
 *   setPerfTraceEnabled(true);
 *   // ... run a prompt ...
 *   const trace = getLastTrace();
 *   console.log(`TTFT: ${trace.total}ms (http: ${trace.httpRequest}ms)`);
 */

export interface PerfTrace {
	/** Phase timings in milliseconds */
	transformContext?: number;
	convertToLlm?: number;
	getApiKey?: number;
	buildParams?: number;
	createClient?: number;
	convertMessages?: number;
	httpToFirstEvent?: number;
	total?: number;
	/** Timestamp when this trace was created */
	timestamp: number;
}

let enabled = typeof process !== "undefined" && process.env?.PI_PERF_TRACE === "1";

let currentTrace: PerfTrace = { timestamp: 0 };
let lastTrace: PerfTrace = { timestamp: 0 };

/** Enable or disable perf tracing at runtime */
export function setPerfTraceEnabled(value: boolean): void {
	enabled = value;
}

export function isPerfTraceEnabled(): boolean {
	return enabled;
}

/** Start a new trace. Call at the beginning of a request. */
export function startTrace(): void {
	if (!enabled) return;
	currentTrace = { timestamp: performance.now() };
}

/** Record a phase timing */
export function tracePhase(phase: keyof PerfTrace, startTime: number): void {
	if (!enabled) return;
	(currentTrace as any)[phase] = performance.now() - startTime;
}

/** Finish the current trace and compute total */
export function endTrace(): PerfTrace | undefined {
	if (!enabled) return undefined;
	currentTrace.total = performance.now() - currentTrace.timestamp;
	lastTrace = { ...currentTrace };

	// Log if enabled
	const t = lastTrace;
	const parts: string[] = [];
	if (t.transformContext !== undefined) parts.push(`transformCtx=${t.transformContext.toFixed(1)}ms`);
	if (t.convertToLlm !== undefined) parts.push(`convertToLlm=${t.convertToLlm.toFixed(1)}ms`);
	if (t.getApiKey !== undefined) parts.push(`getApiKey=${t.getApiKey.toFixed(1)}ms`);
	if (t.createClient !== undefined) parts.push(`createClient=${t.createClient.toFixed(1)}ms`);
	if (t.buildParams !== undefined) parts.push(`buildParams=${t.buildParams.toFixed(1)}ms`);
	if (t.convertMessages !== undefined) parts.push(`convertMsgs=${t.convertMessages.toFixed(1)}ms`);
	if (t.httpToFirstEvent !== undefined) parts.push(`httpToFirst=${t.httpToFirstEvent.toFixed(1)}ms`);
	if (t.total !== undefined) parts.push(`TOTAL=${t.total.toFixed(1)}ms`);

	console.log(`[perf-trace] ${parts.join(" | ")}`);

	return lastTrace;
}

/** Get the last completed trace */
export function getLastTrace(): PerfTrace {
	return lastTrace;
}

/** Reset trace state */
export function resetTrace(): void {
	currentTrace = { timestamp: 0 };
	lastTrace = { timestamp: 0 };
}
