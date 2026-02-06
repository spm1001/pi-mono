/**
 * Replay benchmarks for agent loop performance.
 *
 * Uses recorded API responses to measure the agent loop + render path
 * in isolation from network latency. Results are deterministic and
 * comparable across runs.
 *
 * Run:  npx vitest bench test/agent-loop-replay.bench.ts
 */

import { type AgentContext, type AgentEvent, type AgentLoopConfig, agentLoop } from "@mariozechner/pi-agent-core";
import { bench, describe } from "vitest";
import { createSyncMockStreamFn } from "./fixtures/mock-stream.js";
import { RECORDED_EVENTS } from "./fixtures/recorded-response.js";

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

/** Minimal model config for benchmarks (cast to any to avoid needing full Model type) */
const mockModel: any = {
	id: "mock-model",
	provider: "mock",
	name: "Mock Model",
	contextWindow: 100000,
};

/** Create a minimal agent context */
function createContext(): AgentContext {
	return {
		systemPrompt: "You are a helpful assistant.",
		messages: [],
		tools: [],
	};
}

/** Create minimal loop config */
function createConfig(): AgentLoopConfig {
	return {
		model: mockModel,
		convertToLlm: (messages) => messages.filter((m) => m.role !== "custom") as any,
	};
}

/** Collect all events from the agent loop */
async function drainEvents(stream: AsyncIterable<AgentEvent>): Promise<AgentEvent[]> {
	const events: AgentEvent[] = [];
	for await (const event of stream) {
		events.push(event);
	}
	return events;
}

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

describe("Agent loop replay", () => {
	const mockStreamFn = createSyncMockStreamFn(RECORDED_EVENTS);

	bench("single message (sync replay)", async () => {
		const context = createContext();
		context.messages.push({
			role: "user",
			content: [{ type: "text", text: "How do I fix authentication?" }],
			timestamp: Date.now(),
		});

		const config = createConfig();
		const stream = agentLoop([], context, config, undefined, mockStreamFn);
		await drainEvents(stream);
	});

	bench("10 messages (sync replay)", async () => {
		for (let i = 0; i < 10; i++) {
			const context = createContext();
			context.messages.push({
				role: "user",
				content: [{ type: "text", text: "How do I fix authentication?" }],
				timestamp: Date.now(),
			});

			const config = createConfig();
			const stream = agentLoop([], context, config, undefined, mockStreamFn);
			await drainEvents(stream);
		}
	});
});

describe("Event processing overhead", () => {
	const mockStreamFn = createSyncMockStreamFn(RECORDED_EVENTS);

	bench("count events only", async () => {
		const context = createContext();
		context.messages.push({
			role: "user",
			content: [{ type: "text", text: "How do I fix authentication?" }],
			timestamp: Date.now(),
		});

		const config = createConfig();
		const stream = agentLoop([], context, config, undefined, mockStreamFn);

		let _count = 0;
		for await (const _ of stream) {
			_count++;
		}
	});

	bench("extract timing events", async () => {
		const context = createContext();
		context.messages.push({
			role: "user",
			content: [{ type: "text", text: "How do I fix authentication?" }],
			timestamp: Date.now(),
		});

		const config = createConfig();
		const stream = agentLoop([], context, config, undefined, mockStreamFn);

		const timings: { label: string; ms: number }[] = [];
		for await (const event of stream) {
			if (event.type === "timing") {
				timings.push({ label: event.label, ms: event.ms });
			}
		}
	});
});

describe("Timing verification", () => {
	const mockStreamFn = createSyncMockStreamFn(RECORDED_EVENTS);

	bench("verify timing events are emitted", async () => {
		const context = createContext();
		context.messages.push({
			role: "user",
			content: [{ type: "text", text: "How do I fix authentication?" }],
			timestamp: Date.now(),
		});

		const config = createConfig();
		const stream = agentLoop([], context, config, undefined, mockStreamFn);

		const events = await drainEvents(stream);
		const timingEvents = events.filter((e) => e.type === "timing");

		// Should have at least: convert_to_llm, api_call_start, time_to_first_token, api_call_end
		if (timingEvents.length < 4) {
			throw new Error(`Expected at least 4 timing events, got ${timingEvents.length}`);
		}
	});
});
