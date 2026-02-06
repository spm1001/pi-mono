import { Type } from "@sinclair/typebox";
import { describe, expect, it } from "vitest";
import { validateToolArguments } from "../src/utils/validation.js";

describe("validateToolArguments performance", () => {
	it("should benefit from cached validators on repeated calls", () => {
		const tool = {
			name: "read",
			description: "Read a file",
			parameters: Type.Object({
				file_path: Type.String({ description: "The file path to read" }),
				offset: Type.Optional(Type.Number({ description: "Line offset" })),
				limit: Type.Optional(Type.Number({ description: "Line limit" })),
			}),
		};

		const toolCall = {
			type: "toolCall" as const,
			id: "toolu_123",
			name: "read",
			arguments: { file_path: "/path/to/file.ts", offset: 10, limit: 50 },
		};

		const iterations = 1000;

		// First call compiles the schema
		const firstStart = performance.now();
		validateToolArguments(tool, toolCall);
		const firstElapsed = performance.now() - firstStart;

		// Subsequent calls should use cached validator
		const start = performance.now();
		for (let i = 0; i < iterations; i++) {
			validateToolArguments(tool, toolCall);
		}
		const elapsed = performance.now() - start;

		console.log(
			`validateToolArguments: first call=${firstElapsed.toFixed(2)}ms, ${iterations} cached calls=${elapsed.toFixed(1)}ms (${((elapsed / iterations) * 1000).toFixed(1)}µs/call)`,
		);

		// Cached calls should be significantly faster than first call
		const avgCached = elapsed / iterations;
		expect(avgCached).toBeLessThan(firstElapsed); // Cached should be faster than cold
	});
});
