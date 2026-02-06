/**
 * Benchmarks for streaming render performance.
 *
 * Run:  npx vitest bench test/streaming-render.bench.ts
 *
 * Measures the hot path: setText → render, comparing buffered vs unbuffered.
 */

import { Markdown, type MarkdownTheme } from "@mariozechner/pi-tui";
import { bench, describe } from "vitest";

/** Minimal theme — no ANSI, pure throughput measurement. */
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

/** Line buffer — only complete lines. */
function bufferToCompleteLines(fullText: string): string {
	const lastNewline = fullText.lastIndexOf("\n");
	if (lastNewline === -1) return "";
	return fullText.slice(0, lastNewline + 1);
}

/** Realistic response with code block, list, multiple paragraphs. */
const RESPONSE = [
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

/** Pre-compute all streaming prefixes. */
const DELTAS = Array.from({ length: RESPONSE.length }, (_, i) => RESPONSE.slice(0, i + 1));

// ---------------------------------------------------------------------------
// Benchmarks
// ---------------------------------------------------------------------------

describe("Markdown.setText", () => {
	bench("cache hit (same text)", () => {
		const md = new Markdown("Hello world", 0, 0, bareTheme);
		md.render(WIDTH); // warm up cache
		for (let i = 0; i < 100; i++) {
			md.setText("Hello world");
			md.render(WIDTH);
		}
	});

	bench("cache miss (changing text)", () => {
		const md = new Markdown("", 0, 0, bareTheme);
		for (let i = 0; i < 100; i++) {
			md.setText(`Line ${i}`);
			md.render(WIDTH);
		}
	});
});

describe("Streaming simulation", () => {
	bench("unbuffered (every character)", () => {
		const md = new Markdown("", 0, 0, bareTheme);
		for (const text of DELTAS) {
			md.setText(text.trim());
			md.render(WIDTH);
		}
	});

	bench("line-buffered (complete lines only)", () => {
		const md = new Markdown("", 0, 0, bareTheme);
		let prevBuffered = "";
		for (const text of DELTAS) {
			const buffered = bufferToCompleteLines(text).trim();
			if (buffered !== prevBuffered) {
				md.setText(buffered);
				md.render(WIDTH);
				prevBuffered = buffered;
			}
		}
		// Final flush
		md.setText(RESPONSE.trim());
		md.render(WIDTH);
	});
});

describe("Realistic workload", () => {
	bench("10 messages unbuffered", () => {
		for (let msg = 0; msg < 10; msg++) {
			const md = new Markdown("", 0, 0, bareTheme);
			for (const text of DELTAS) {
				md.setText(text.trim());
				md.render(WIDTH);
			}
		}
	});

	bench("10 messages line-buffered", () => {
		for (let msg = 0; msg < 10; msg++) {
			const md = new Markdown("", 0, 0, bareTheme);
			let prevBuffered = "";
			for (const text of DELTAS) {
				const buffered = bufferToCompleteLines(text).trim();
				if (buffered !== prevBuffered) {
					md.setText(buffered);
					md.render(WIDTH);
					prevBuffered = buffered;
				}
			}
			md.setText(RESPONSE.trim());
			md.render(WIDTH);
		}
	});
});

describe("Wall-clock time comparison", () => {
	// Measure actual elapsed time, not ops/sec
	// This shows the real-world time savings

	bench("unbuffered total time", () => {
		const md = new Markdown("", 0, 0, bareTheme);
		for (const text of DELTAS) {
			md.setText(text.trim());
			md.render(WIDTH);
		}
	});

	bench("line-buffered total time", () => {
		const md = new Markdown("", 0, 0, bareTheme);
		let prevBuffered = "";
		for (const text of DELTAS) {
			const buffered = bufferToCompleteLines(text).trim();
			if (buffered !== prevBuffered) {
				md.setText(buffered);
				md.render(WIDTH);
				prevBuffered = buffered;
			}
		}
		// Final flush
		md.setText(RESPONSE.trim());
		md.render(WIDTH);
	});
});
