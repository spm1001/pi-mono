#!/usr/bin/env npx tsx

/**
 * Visual simulation of streaming render behaviour.
 *
 * Uses the REAL Markdown render pipeline — same component, same parser,
 * same line output. Feeds text character-by-character with realistic delays
 * so you can see the difference between unbuffered (teletype) and
 * line-buffered rendering.
 *
 * Run:  npx tsx test/streaming-visual.ts
 */

import { Container, Markdown, type MarkdownTheme, Spacer, Text, TUI } from "@mariozechner/pi-tui";
// ---------------------------------------------------------------------------
// Theme — use real ANSI so it looks like the actual product
// ---------------------------------------------------------------------------
import { Chalk } from "chalk";
import { VirtualTerminal } from "../../tui/test/virtual-terminal.js";

const chalk = new Chalk({ level: 3 });

const theme: MarkdownTheme = {
	heading: (t) => chalk.bold.cyan(t),
	link: (t) => chalk.blue(t),
	linkUrl: (t) => chalk.dim(t),
	code: (t) => chalk.yellow(t),
	codeBlock: (t) => chalk.green(t),
	codeBlockBorder: (t) => chalk.dim(t),
	quote: (t) => chalk.italic(t),
	quoteBorder: (t) => chalk.dim(t),
	hr: (t) => chalk.dim(t),
	listBullet: (t) => chalk.cyan(t),
	bold: (t) => chalk.bold(t),
	italic: (t) => chalk.italic(t),
	strikethrough: (t) => chalk.strikethrough(t),
	underline: (t) => chalk.underline(t),
};

// ---------------------------------------------------------------------------
// The response we'll stream
// ---------------------------------------------------------------------------
const RESPONSE = [
	"Here's how to fix the authentication issue:\n",
	"\n",
	"The problem is in your middleware. You're missing the token refresh handler.\n",
	"\n",
	"```typescript\n",
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

// ---------------------------------------------------------------------------
// Line buffer — the actual optimisation
// ---------------------------------------------------------------------------
function bufferToCompleteLines(fullText: string): string {
	const lastNewline = fullText.lastIndexOf("\n");
	if (lastNewline === -1) return ""; // wait for a complete line
	return fullText.slice(0, lastNewline + 1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const WIDTH = 80;
const ROWS = 30;
const DELAY_MS = 20; // per-character delay (simulates token arrival)

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

/**
 * Set up a real TUI + VirtualTerminal, add a title and a Markdown component.
 * Returns handles to drive it.
 */
function createScene(title: string) {
	const vt = new VirtualTerminal(WIDTH, ROWS);
	const tui = new TUI(vt);
	const container = new Container();
	const header = new Text(chalk.bold.inverse(` ${title} `.padEnd(WIDTH)), 0, 0);
	const spacer = new Spacer(1);
	const md = new Markdown("", 0, 0, theme);

	container.addChild(header);
	container.addChild(spacer);
	container.addChild(md);
	tui.addChild(container);
	tui.start();

	return { vt, tui, md };
}

/** Flush the TUI render and capture what the user would see. */
async function captureViewport(vt: VirtualTerminal): Promise<string[]> {
	// Let process.nextTick fire (TUI coalesces renders there)
	await new Promise((r) => setTimeout(r, 0));
	return vt.flushAndGetViewport();
}

/** Print a viewport frame to the real terminal. */
function printFrame(lines: string[]) {
	process.stdout.write("\x1b[H"); // cursor home (no clear — less flicker)
	for (const line of lines) {
		// Pad to WIDTH to overwrite previous content, then newline
		process.stdout.write(line + " ".repeat(Math.max(0, WIDTH - stripAnsi(line).length)) + "\n");
	}
}

/** Poor man's strip-ansi for padding calc */
function stripAnsi(s: string): string {
	return s.replace(/\x1b\[[0-9;]*m/g, "").replace(/\x1b\][^\x07]*\x07/g, "");
}

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------
async function runSimulation(title: string, buffered: boolean) {
	const { vt, tui, md } = createScene(title);
	let prevText = "";
	let renderCount = 0;

	process.stdout.write("\x1b[2J\x1b[H"); // clear screen
	const viewport = await captureViewport(vt);
	printFrame(viewport);
	await sleep(800);

	for (let i = 1; i <= RESPONSE.length; i++) {
		const raw = RESPONSE.slice(0, i);
		const text = buffered ? bufferToCompleteLines(raw).trim() : raw.trim();

		if (text !== prevText && text.length > 0) {
			md.setText(text);
			tui.requestRender();
			const viewport = await captureViewport(vt);
			printFrame(viewport);
			renderCount++;
			prevText = text;
		}

		await sleep(DELAY_MS);
	}

	// Final flush (render any trailing partial)
	if (buffered) {
		md.setText(RESPONSE.trim());
		tui.requestRender();
		const viewport = await captureViewport(vt);
		printFrame(viewport);
		renderCount++;
	}

	tui.stop();
	return renderCount;
}

async function main() {
	// Hide cursor during simulation
	process.stdout.write("\x1b[?25l");

	const countUnbuffered = await runSimulation("WITHOUT BUFFERING  (teletype)", false);
	await sleep(1500);

	const countBuffered = await runSimulation("WITH LINE BUFFERING  (lines appear atomically)", true);
	await sleep(1000);

	// Summary
	process.stdout.write("\x1b[2J\x1b[H");
	process.stdout.write("\x1b[?25h"); // restore cursor

	const ratio = (countUnbuffered / countBuffered).toFixed(1);
	console.log(chalk.bold("\n  Streaming Render Simulation Results\n"));
	console.log(`  Without buffering:  ${chalk.red(String(countUnbuffered))} render updates`);
	console.log(`  With line buffering: ${chalk.green(String(countBuffered))} render updates`);
	console.log(`  Reduction:          ${chalk.cyan(ratio + "x")} fewer renders`);
	console.log();
}

main().catch((e) => {
	process.stdout.write("\x1b[?25h");
	console.error(e);
	process.exit(1);
});
