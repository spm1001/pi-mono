/**
 * Mock stream function for replay benchmarks.
 *
 * Replays recorded events synchronously or with configurable delays.
 * Use for deterministic performance testing of the render path.
 */

import { type AssistantMessage, type Context, EventStream, type Model } from "@mariozechner/pi-ai";

export interface MockStreamOptions {
	/** Events to replay (any[] because test fixtures don't have full types) */
	events: any[];
	/** Delay between events in ms (0 = synchronous) */
	delayMs?: number;
	/** If true, yield events one at a time with microtask breaks */
	yieldBetweenEvents?: boolean;
}

/**
 * Creates a mock stream function that replays recorded events.
 */
export function createMockStreamFn(options: MockStreamOptions) {
	const { events, delayMs = 0, yieldBetweenEvents = false } = options;

	return function mockStreamFn(
		_model: Model<any>,
		_context: Context,
		_options?: any,
	): EventStream<any, AssistantMessage> {
		const stream = new EventStream<any, AssistantMessage>(
			(event: any) => event.type === "done" || event.type === "error",
			(event: any) => (event.type === "done" || event.type === "error" ? event.partial : ({} as AssistantMessage)),
		);

		(async () => {
			for (const event of events) {
				if (delayMs > 0) {
					await new Promise<void>((r) => setTimeout(r, delayMs));
				} else if (yieldBetweenEvents) {
					await new Promise<void>((r) => queueMicrotask(r));
				}
				stream.push(event);
			}
			// Find the final message from done event
			const doneEvent = events.find((e: any) => e.type === "done" || e.type === "error");
			if (doneEvent) {
				stream.end(doneEvent.partial);
			}
		})();

		return stream;
	};
}

/**
 * Creates a synchronous mock stream for maximum benchmark throughput.
 * Events are pushed without any delays or yields.
 */
export function createSyncMockStreamFn(events: any[]) {
	return createMockStreamFn({ events, delayMs: 0, yieldBetweenEvents: false });
}

/**
 * Creates a realistic mock stream that simulates network delays.
 * Events are pushed with small delays to simulate streaming latency.
 */
export function createRealisticMockStreamFn(events: any[], delayMs = 5) {
	return createMockStreamFn({ events, delayMs, yieldBetweenEvents: true });
}
