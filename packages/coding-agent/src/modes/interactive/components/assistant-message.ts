import type { AssistantMessage } from "@mariozechner/pi-ai";
import { Container, Markdown, type MarkdownTheme, Spacer, Text } from "@mariozechner/pi-tui";
import { getMarkdownTheme, theme } from "../theme/theme.js";

/**
 * Return only complete lines (up to the last newline).
 * The trailing partial line is held back so it appears atomically
 * when its newline arrives, eliminating the character-by-character
 * teletype effect during streaming.
 */
function bufferToCompleteLines(fullText: string): string {
	const lastNewline = fullText.lastIndexOf("\n");
	if (lastNewline === -1) return "";
	return fullText.slice(0, lastNewline + 1);
}

/**
 * Component that renders a complete assistant message.
 *
 * Optimised for streaming: text content is line-buffered (only complete
 * lines are rendered) and Markdown components are pooled so the cache
 * inside Markdown.render() stays warm between deltas.
 */
export class AssistantMessageComponent extends Container {
	private contentContainer: Container;
	private hideThinkingBlock: boolean;
	private markdownTheme: MarkdownTheme;
	private lastMessage?: AssistantMessage;
	private streaming = true;

	/** Pooled Markdown components keyed by "{type}-{contentIndex}". */
	private markdownPool: Map<string, Markdown> = new Map();

	constructor(
		message?: AssistantMessage,
		hideThinkingBlock = false,
		markdownTheme: MarkdownTheme = getMarkdownTheme(),
	) {
		super();

		this.hideThinkingBlock = hideThinkingBlock;
		this.markdownTheme = markdownTheme;

		// Container for text/thinking content
		this.contentContainer = new Container();
		this.addChild(this.contentContainer);

		if (message) {
			this.updateContent(message);
		}
	}

	override invalidate(): void {
		// Theme or visibility change — the pool is stale.
		this.markdownPool.clear();
		super.invalidate();
		if (this.lastMessage) {
			this.rebuildContent();
		}
	}

	setHideThinkingBlock(hide: boolean): void {
		if (this.hideThinkingBlock === hide) return;
		this.hideThinkingBlock = hide;
		// Thinking blocks switch between Markdown and Text — clear pool.
		this.markdownPool.clear();
	}

	/**
	 * Called on every streaming delta and once on message_end.
	 * Defers to rebuildContent() which does the real work.
	 */
	updateContent(message: AssistantMessage): void {
		this.lastMessage = message;
		this.rebuildContent();
	}

	/**
	 * Mark the message as complete — flushes any buffered partial line.
	 */
	finalise(): void {
		this.streaming = false;
		if (this.lastMessage) {
			this.rebuildContent();
		}
	}

	// -------------------------------------------------------------------
	// Internals
	// -------------------------------------------------------------------

	/**
	 * Get a Markdown from the pool (reusing via setText for cache benefit)
	 * or create a fresh one.
	 */
	private getMarkdown(
		key: string,
		text: string,
		style?: { color?: (t: string) => string; italic?: boolean },
	): Markdown {
		let md = this.markdownPool.get(key);
		if (md) {
			md.setText(text); // no-op if unchanged (cache stays warm)
		} else {
			md = new Markdown(text, 0, 0, this.markdownTheme, style);
			this.markdownPool.set(key, md);
		}
		return md;
	}

	/**
	 * Rebuild the contentContainer from lastMessage.
	 *
	 * Container.clear() + addChild is cheap (array ops). The expensive
	 * work (marked.lexer) only happens inside Markdown.render() and is
	 * avoided when setText detects unchanged text (cache hit).
	 */
	private rebuildContent(): void {
		const message = this.lastMessage;
		if (!message) return;

		this.contentContainer.clear();

		const hasVisibleContent = message.content.some(
			(c) => (c.type === "text" && c.text.trim()) || (c.type === "thinking" && c.thinking.trim()),
		);

		if (hasVisibleContent) {
			this.contentContainer.addChild(new Spacer(1));
		}

		for (let i = 0; i < message.content.length; i++) {
			const content = message.content[i];

			if (content.type === "text" && content.text.trim()) {
				// During streaming, only render complete lines.
				// On finalise() (or non-streaming), render everything.
				const raw = content.text;
				const displayText = this.streaming ? bufferToCompleteLines(raw).trim() : raw.trim();

				if (displayText) {
					const md = this.getMarkdown(`text-${i}`, displayText);
					this.contentContainer.addChild(md);
				}
			} else if (content.type === "thinking" && content.thinking.trim()) {
				// Add spacing only when another visible assistant content block follows.
				// This avoids a superfluous blank line before separately-rendered tool execution blocks.
				const hasVisibleContentAfter = message.content
					.slice(i + 1)
					.some((c) => (c.type === "text" && c.text.trim()) || (c.type === "thinking" && c.thinking.trim()));

				if (this.hideThinkingBlock) {
					this.contentContainer.addChild(new Text(theme.italic(theme.fg("thinkingText", "Thinking...")), 0, 0));
					if (hasVisibleContentAfter) {
						this.contentContainer.addChild(new Spacer(1));
					}
				} else {
					// Thinking blocks also benefit from line buffering.
					const raw = content.thinking;
					const displayText = this.streaming ? bufferToCompleteLines(raw).trim() : raw.trim();

					if (displayText) {
						const md = this.getMarkdown(`thinking-${i}`, displayText, {
							color: (text: string) => theme.fg("thinkingText", text),
							italic: true,
						});
						this.contentContainer.addChild(md);
					}
					if (hasVisibleContentAfter) {
						this.contentContainer.addChild(new Spacer(1));
					}
				}
			}
		}

		// Error / abort display (only when no tool calls handle it)
		const hasToolCalls = message.content.some((c) => c.type === "toolCall");
		if (!hasToolCalls) {
			if (message.stopReason === "aborted") {
				const abortMessage =
					message.errorMessage && message.errorMessage !== "Request was aborted"
						? message.errorMessage
						: "Operation aborted";
				this.contentContainer.addChild(new Spacer(1));
				this.contentContainer.addChild(new Text(theme.fg("error", abortMessage), 0, 0));
			} else if (message.stopReason === "error") {
				const errorMsg = message.errorMessage || "Unknown error";
				this.contentContainer.addChild(new Spacer(1));
				this.contentContainer.addChild(new Text(theme.fg("error", `Error: ${errorMsg}`), 0, 0));
			}
		}
	}
}
