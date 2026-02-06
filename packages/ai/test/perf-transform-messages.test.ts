import { describe, expect, it } from "vitest";
import { transformMessages } from "../src/providers/transform-messages.js";
import type { AssistantMessage, Message, Model, ToolCall } from "../src/types.js";

function makeModel(): Model<"anthropic-messages"> {
	return {
		id: "claude-sonnet-4-5-20250929",
		name: "Claude Sonnet 4.5",
		api: "anthropic-messages",
		provider: "anthropic",
		baseUrl: "https://api.anthropic.com",
		reasoning: true,
		input: ["text", "image"],
		cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
		contextWindow: 200000,
		maxTokens: 8192,
	};
}

function makeConversation(turnCount: number): Message[] {
	const messages: Message[] = [];
	for (let i = 0; i < turnCount; i++) {
		messages.push({
			role: "user",
			content: `User message ${i}: ${"lorem ipsum dolor sit amet ".repeat(20)}`,
			timestamp: Date.now(),
		});

		const toolCall: ToolCall = {
			type: "toolCall",
			id: `toolu_${i}`,
			name: "read",
			arguments: { file_path: `/path/to/file${i}.ts` },
		};

		const assistant: AssistantMessage = {
			role: "assistant",
			content: [
				{ type: "thinking", thinking: `Thinking about step ${i}...`, thinkingSignature: `sig_${i}` },
				{ type: "text", text: `Response ${i}: ${"some analysis ".repeat(10)}` },
				toolCall,
			],
			api: "anthropic-messages",
			provider: "anthropic",
			model: "claude-sonnet-4-5-20250929",
			usage: {
				input: 1000,
				output: 500,
				cacheRead: 0,
				cacheWrite: 0,
				totalTokens: 1500,
				cost: { input: 0.003, output: 0.0075, cacheRead: 0, cacheWrite: 0, total: 0.0105 },
			},
			stopReason: "toolUse",
			timestamp: Date.now(),
		};
		messages.push(assistant);

		messages.push({
			role: "toolResult",
			toolCallId: `toolu_${i}`,
			toolName: "read",
			content: [{ type: "text", text: `File content ${i}: ${"code line\n".repeat(50)}` }],
			isError: false,
			timestamp: Date.now(),
		});
	}
	return messages;
}

describe("transformMessages performance", () => {
	it("should handle 50-turn conversation efficiently", () => {
		const model = makeModel();
		const messages = makeConversation(50); // 150 messages (user + assistant + toolResult)
		const iterations = 100;

		const start = performance.now();
		let result: Message[] = [];
		for (let i = 0; i < iterations; i++) {
			result = transformMessages(messages, model, (id) => id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 64));
		}
		const elapsed = performance.now() - start;

		console.log(
			`transformMessages: ${messages.length} messages × ${iterations} iterations = ${elapsed.toFixed(1)}ms (${(elapsed / iterations).toFixed(2)}ms/call)`,
		);

		// Verify correctness
		expect(result.length).toBe(messages.length);
		expect(result.filter((m) => m.role === "user").length).toBe(50);
		expect(result.filter((m) => m.role === "assistant").length).toBe(50);
		expect(result.filter((m) => m.role === "toolResult").length).toBe(50);
	});

	it("should handle orphaned tool calls correctly in single pass", () => {
		const model = makeModel();
		const messages: Message[] = [
			{ role: "user", content: "do something", timestamp: Date.now() },
			{
				role: "assistant",
				content: [
					{ type: "text", text: "I'll do two things" },
					{ type: "toolCall", id: "tool_1", name: "read", arguments: { file_path: "/a" } },
					{ type: "toolCall", id: "tool_2", name: "read", arguments: { file_path: "/b" } },
				],
				api: "anthropic-messages",
				provider: "anthropic",
				model: "claude-sonnet-4-5-20250929",
				usage: {
					input: 100,
					output: 50,
					cacheRead: 0,
					cacheWrite: 0,
					totalTokens: 150,
					cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
				},
				stopReason: "toolUse",
				timestamp: Date.now(),
			} as AssistantMessage,
			// Only one tool result — tool_2 is orphaned
			{
				role: "toolResult",
				toolCallId: "tool_1",
				toolName: "read",
				content: [{ type: "text", text: "file content" }],
				isError: false,
				timestamp: Date.now(),
			},
			// User message interrupts before tool_2 result
			{ role: "user", content: "actually stop", timestamp: Date.now() },
		];

		const result = transformMessages(messages, model);

		// Should have synthetic tool result for tool_2 inserted before the user message
		const toolResults = result.filter((m) => m.role === "toolResult");
		expect(toolResults.length).toBe(2); // original + synthetic
		expect(toolResults[1].toolCallId).toBe("tool_2");
	});
});
