/**
 * Tests for streaming render optimizations.
 *
 * Simulates the hot path: API sends text deltas → component updates → TUI renders.
 * Verifies that line buffering reduces unnecessary re-renders during streaming.
 */

import { Markdown, type MarkdownTheme } from "@mariozechner/pi-tui";
import { describe, expect, it } from "vitest";

/** Minimal theme — just pass text through. No ANSI, no dependencies on coding-agent theme. */
const bareTheme: MarkdownTheme = {
	heading: (t) => t,
	link: (t) => t,
	linkUrl: (t) => t,
	code: (t) => t,
	codeBlock: (t) => t,
	codeBlockBorder: (t) => t,
	quote: (t) => t,
	quoteBorder: (t) => t,
	hr: (t) => t,
	listBullet: (t) => t,
	bold: (t) => t,
	italic: (t) => t,
	strikethrough: (t) => t,
	underline: (t) => t,
};

const WIDTH = 80;

/**
 * Given the full text so far, return only the complete lines (up to and including
 * the last newline). The trailing partial line is held back.
 *
 * Returns empty string if no newlines yet — the first line appears atomically
 * when its newline arrives.
 */
function bufferToCompleteLines(fullText: string): string {
	const lastNewline = fullText.lastIndexOf("\n");
	if (lastNewline === -1) return ""; // wait for a complete line
	return fullText.slice(0, lastNewline + 1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Simulate streaming: explode a string into progressively longer prefixes. */
function simulateDeltas(full: string): string[] {
	const deltas: string[] = [];
	for (let i = 1; i <= full.length; i++) {
		deltas.push(full.slice(0, i));
	}
	return deltas;
}

/** Render a Markdown component and return its line output. */
function renderMarkdown(md: Markdown): string[] {
	return md.render(WIDTH);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("bufferToCompleteLines", () => {
	it("returns empty when no newlines yet", () => {
		expect(bufferToCompleteLines("Hello")).toBe("");
		expect(bufferToCompleteLines("H")).toBe("");
		expect(bufferToCompleteLines("")).toBe("");
	});

	it("returns up to last newline when newlines exist", () => {
		expect(bufferToCompleteLines("Hello\n")).toBe("Hello\n");
		expect(bufferToCompleteLines("Hello\nWorld")).toBe("Hello\n");
		expect(bufferToCompleteLines("Hello\nWorld\n")).toBe("Hello\nWorld\n");
	});

	it("buffers partial trailing line", () => {
		expect(bufferToCompleteLines("Line 1\nLine 2\nPartial")).toBe("Line 1\nLine 2\n");
	});
});

describe("Markdown.setText caching", () => {
	it("returns same array reference when text is unchanged", () => {
		const md = new Markdown("Hello world", 0, 0, bareTheme);
		const first = renderMarkdown(md);

		md.setText("Hello world"); // same text
		const second = renderMarkdown(md);

		// If cache works, these should be the exact same array
		expect(second).toBe(first);
	});

	it("returns different output when text changes", () => {
		const md = new Markdown("Hello", 0, 0, bareTheme);
		const first = renderMarkdown(md);

		md.setText("Goodbye");
		const second = renderMarkdown(md);

		expect(second).not.toBe(first);
		// Content should differ
		expect(second.join("\n")).not.toEqual(first.join("\n"));
	});
});

describe("Streaming render efficiency", () => {
	const fullText = "Hello world\nThis is line two\nAnd line three\n";

	it("without buffering: re-renders on every character", () => {
		const md = new Markdown("", 0, 0, bareTheme);
		const deltas = simulateDeltas(fullText);

		let renderChanges = 0;
		let prevOutput = "";

		for (const text of deltas) {
			md.setText(text.trim());
			const output = renderMarkdown(md).join("\n");
			if (output !== prevOutput) {
				renderChanges++;
				prevOutput = output;
			}
		}

		// Without buffering, output changes on most deltas (nearly every character)
		expect(renderChanges).toBeGreaterThan(20);
	});

	it("with line buffering: renders only change when complete lines arrive", () => {
		const md = new Markdown("", 0, 0, bareTheme);
		const deltas = simulateDeltas(fullText);

		let renderChanges = 0;
		let prevOutput = "";

		for (const text of deltas) {
			const buffered = bufferToCompleteLines(text).trim();
			md.setText(buffered);
			const output = renderMarkdown(md).join("\n");
			if (output !== prevOutput) {
				renderChanges++;
				prevOutput = output;
			}
		}

		// fullText has 3 lines. Each newline produces one render change.
		// No first-line dribble — the line appears atomically when \n arrives.
		expect(renderChanges).toBe(3);
	});

	it("shows nothing before first newline, then line appears atomically", () => {
		const md = new Markdown("", 0, 0, bareTheme);

		// Before any newline — buffer holds everything back
		const buffered = bufferToCompleteLines("Hello wor");
		expect(buffered).toBe("");

		// Newline arrives — whole line appears at once
		const flushed = bufferToCompleteLines("Hello world\n");
		md.setText(flushed.trim());
		const output = renderMarkdown(md);
		expect(output.join("")).toContain("Hello world");
	});

	it("flush renders everything including trailing partial line", () => {
		const md = new Markdown("", 0, 0, bareTheme);
		const textWithPartial = "Complete line\nTrailing partial";

		// During streaming — partial line is buffered
		const buffered = bufferToCompleteLines(textWithPartial).trim();
		md.setText(buffered);
		const midStream = renderMarkdown(md).join("\n");
		expect(midStream).not.toContain("Trailing partial");

		// On flush (message complete) — render everything
		md.setText(textWithPartial.trim());
		const flushed = renderMarkdown(md).join("\n");
		expect(flushed).toContain("Trailing partial");
	});

	it("quantifies the improvement on a realistic response", () => {
		// Longer response: multiple paragraphs, code block, list
		const response = [
			"Here's how to fix the authentication issue:\n",
			"\n",
			"The problem is in your middleware configuration. ",
			"You're missing the token refresh handler.\n",
			"\n",
			"```typescript\n",
			"import { authMiddleware } from './auth';\n",
			"\n",
			"export function configureAuth(app: Express) {\n",
			"  app.use(authMiddleware({\n",
			"    refreshTokens: true,\n",
			"    tokenExpiry: 3600,\n",
			"  }));\n",
			"}\n",
			"```\n",
			"\n",
			"Key changes:\n",
			"\n",
			"- Added `refreshTokens: true` to enable automatic refresh\n",
			"- Set `tokenExpiry` to 1 hour (3600 seconds)\n",
			"- Moved middleware before route handlers\n",
			"\n",
			"This should resolve the 401 errors you're seeing.\n",
		].join("");

		const deltas = simulateDeltas(response);

		// Count unbuffered renders
		let unbufferedChanges = 0;
		let prevUnbuffered = "";
		const mdUnbuffered = new Markdown("", 0, 0, bareTheme);
		for (const text of deltas) {
			mdUnbuffered.setText(text.trim());
			const output = renderMarkdown(mdUnbuffered).join("\n");
			if (output !== prevUnbuffered) {
				unbufferedChanges++;
				prevUnbuffered = output;
			}
		}

		// Count buffered renders
		let bufferedChanges = 0;
		let prevBuffered = "";
		const mdBuffered = new Markdown("", 0, 0, bareTheme);
		for (const text of deltas) {
			const buffered = bufferToCompleteLines(text).trim();
			mdBuffered.setText(buffered);
			const output = renderMarkdown(mdBuffered).join("\n");
			if (output !== prevBuffered) {
				bufferedChanges++;
				prevBuffered = output;
			}
		}

		const ratio = unbufferedChanges / bufferedChanges;

		// Log for visibility
		console.log(
			`  Render changes: unbuffered=${unbufferedChanges}, buffered=${bufferedChanges}, ratio=${ratio.toFixed(1)}x`,
		);

		// With a longer response, most of the text is after the first newline
		// so buffering should reduce render changes significantly
		expect(ratio).toBeGreaterThan(2);
		// Buffered should be roughly: first-line chars + number of lines
		expect(bufferedChanges).toBeLessThan(unbufferedChanges / 2);
	});
});
