#!/usr/bin/env npx tsx
/**
 * End-to-end TTFT benchmark for Pi.
 *
 * Measures time-to-first-token for a simple prompt against the Anthropic API.
 * Run multiple iterations to get stable numbers, then compare branches.
 *
 * Usage:
 *   # On the optimized branch:
 *   ANTHROPIC_API_KEY=sk-... npx tsx packages/ai/test/bench-ttft.ts
 *
 *   # Then on main (after cherry-picking just this file + perf-trace.ts):
 *   git stash && git checkout main
 *   git checkout claude/reduce-api-latency-OGqXv -- packages/ai/test/bench-ttft.ts packages/ai/src/utils/perf-trace.ts
 *   ANTHROPIC_API_KEY=sk-... npx tsx packages/ai/test/bench-ttft.ts
 *   git checkout . && git stash pop
 *
 * What it measures:
 *   - Total TTFT: from calling streamSimple() to receiving the first "start" event
 *   - This includes: client creation, message conversion, HTTP request, server processing
 *   - Runs N iterations to show cold (1st) vs warm (2nd+) performance
 */

import { type Context, getLastTrace, getModel, setPerfTraceEnabled, streamSimple } from "../src/index.js";

const ITERATIONS = 5;
const MODEL_PROVIDER = "anthropic";
const MODEL_ID = "claude-sonnet-4-5-20250929";

async function measureTTFT(context: Context, _iteration: number): Promise<{ ttft: number; traceTotal?: number }> {
	const model = getModel(MODEL_PROVIDER, MODEL_ID);
	if (!model) {
		throw new Error(`Model ${MODEL_ID} not found for provider ${MODEL_PROVIDER}`);
	}

	const start = performance.now();

	const stream = streamSimple(model, context, {
		maxTokens: 50, // Keep responses short
	});

	// Wait for first event (the "start" event = first token)
	let ttft = 0;
	for await (const event of stream) {
		if (event.type === "start") {
			ttft = performance.now() - start;
			// Don't break — let the stream complete to avoid connection issues
		}
		if (event.type === "done" || event.type === "error") {
			break;
		}
	}

	const trace = getLastTrace();
	return { ttft, traceTotal: trace?.total };
}

async function main() {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		console.error("Set ANTHROPIC_API_KEY environment variable");
		process.exit(1);
	}

	// Enable perf tracing
	setPerfTraceEnabled(true);

	const context: Context = {
		systemPrompt: "You are a helpful assistant. Be very brief.",
		messages: [
			{
				role: "user",
				content: "Say hello in exactly 3 words.",
				timestamp: Date.now(),
			},
		],
	};

	console.log(`\nBenchmarking TTFT: ${ITERATIONS} iterations against ${MODEL_ID}\n`);
	console.log("─".repeat(70));

	const results: number[] = [];

	for (let i = 0; i < ITERATIONS; i++) {
		const { ttft } = await measureTTFT(context, i);
		results.push(ttft);
		console.log(`  Iteration ${i + 1}: TTFT = ${ttft.toFixed(0)}ms ${i === 0 ? "(cold)" : "(warm)"}`);
	}

	console.log("─".repeat(70));

	const cold = results[0];
	const warm = results.slice(1);
	const avgWarm = warm.reduce((a, b) => a + b, 0) / warm.length;
	const minWarm = Math.min(...warm);
	const maxWarm = Math.max(...warm);

	console.log(`\n  Cold (1st request):  ${cold.toFixed(0)}ms`);
	console.log(`  Warm average:        ${avgWarm.toFixed(0)}ms`);
	console.log(`  Warm range:          ${minWarm.toFixed(0)}ms - ${maxWarm.toFixed(0)}ms`);
	console.log(`  Cold→Warm delta:     ${(cold - avgWarm).toFixed(0)}ms (client cache savings)\n`);
}

main().catch(console.error);
