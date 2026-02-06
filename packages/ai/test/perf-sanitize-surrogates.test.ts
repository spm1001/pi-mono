import { describe, expect, it } from "vitest";
import { sanitizeSurrogates } from "../src/utils/sanitize-unicode.js";

describe("sanitizeSurrogates performance", () => {
	it("fast-path: pure ASCII text should not hit regex", () => {
		const ascii = "Hello, this is a test message with no unicode.".repeat(100);
		const iterations = 10000;

		const start = performance.now();
		for (let i = 0; i < iterations; i++) {
			sanitizeSurrogates(ascii);
		}
		const elapsed = performance.now() - start;

		// Should complete very fast since no surrogates present
		console.log(
			`sanitizeSurrogates fast-path: ${iterations} iterations in ${elapsed.toFixed(1)}ms (${((elapsed / iterations) * 1000).toFixed(1)}µs/call)`,
		);
		expect(elapsed).toBeLessThan(500); // sanity check
	});

	it("preserves valid emoji (paired surrogates)", () => {
		expect(sanitizeSurrogates("Hello 🙈 World")).toBe("Hello 🙈 World");
	});

	it("removes unpaired surrogates", () => {
		const unpaired = String.fromCharCode(0xd83d);
		expect(sanitizeSurrogates(`Text ${unpaired} here`)).toBe("Text  here");
	});
});
