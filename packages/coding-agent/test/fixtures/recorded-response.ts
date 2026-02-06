/**
 * Recorded API response for replay benchmarks.
 *
 * This fixture contains a realistic streaming response that can be replayed
 * deterministically for performance testing.
 *
 * Note: Uses 'as any' casts because these are test fixtures, not real API responses.
 * The actual types require fields (api, provider, model, usage) that aren't needed for benchmarks.
 */

/**
 * Events as they would arrive from the streaming API.
 * Recorded from a real response to ensure realistic structure.
 * Type is 'any[]' because test fixtures don't need full API response metadata.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const RECORDED_EVENTS: any[] = [
	{
		type: "start",
		partial: {
			role: "assistant",
			content: [],
			timestamp: Date.now(),
		},
	},
	// Text streaming - character by character initially, then larger chunks
	{
		type: "text_start",
		index: 0,
		partial: { role: "assistant", content: [{ type: "text", text: "" }], timestamp: Date.now() },
	},
	{
		type: "text_delta",
		index: 0,
		delta: "Here's",
		partial: { role: "assistant", content: [{ type: "text", text: "Here's" }], timestamp: Date.now() },
	},
	{
		type: "text_delta",
		index: 0,
		delta: " how",
		partial: { role: "assistant", content: [{ type: "text", text: "Here's how" }], timestamp: Date.now() },
	},
	{
		type: "text_delta",
		index: 0,
		delta: " to",
		partial: { role: "assistant", content: [{ type: "text", text: "Here's how to" }], timestamp: Date.now() },
	},
	{
		type: "text_delta",
		index: 0,
		delta: " fix",
		partial: { role: "assistant", content: [{ type: "text", text: "Here's how to fix" }], timestamp: Date.now() },
	},
	{
		type: "text_delta",
		index: 0,
		delta: " the",
		partial: { role: "assistant", content: [{ type: "text", text: "Here's how to fix the" }], timestamp: Date.now() },
	},
	{
		type: "text_delta",
		index: 0,
		delta: " authentication",
		partial: {
			role: "assistant",
			content: [{ type: "text", text: "Here's how to fix the authentication" }],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: " issue:\n\n",
		partial: {
			role: "assistant",
			content: [{ type: "text", text: "Here's how to fix the authentication issue:\n\n" }],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: "The problem is in your middleware configuration. ",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. ",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: "You're missing the token refresh handler.\n\n",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: "```typescript\n",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n```typescript\n",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: "import { authMiddleware } from './auth';\n\n",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n```typescript\nimport { authMiddleware } from './auth';\n\n",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: "export function configureAuth(app: Express) {\n",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n```typescript\nimport { authMiddleware } from './auth';\n\nexport function configureAuth(app: Express) {\n",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: "  app.use(authMiddleware({\n",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n```typescript\nimport { authMiddleware } from './auth';\n\nexport function configureAuth(app: Express) {\n  app.use(authMiddleware({\n",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: "    refreshTokens: true,\n",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n```typescript\nimport { authMiddleware } from './auth';\n\nexport function configureAuth(app: Express) {\n  app.use(authMiddleware({\n    refreshTokens: true,\n",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: "    tokenExpiry: 3600,\n",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n```typescript\nimport { authMiddleware } from './auth';\n\nexport function configureAuth(app: Express) {\n  app.use(authMiddleware({\n    refreshTokens: true,\n    tokenExpiry: 3600,\n",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: "  }));\n}\n```\n\n",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n```typescript\nimport { authMiddleware } from './auth';\n\nexport function configureAuth(app: Express) {\n  app.use(authMiddleware({\n    refreshTokens: true,\n    tokenExpiry: 3600,\n  }));\n}\n```\n\n",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: "Key changes:\n\n",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n```typescript\nimport { authMiddleware } from './auth';\n\nexport function configureAuth(app: Express) {\n  app.use(authMiddleware({\n    refreshTokens: true,\n    tokenExpiry: 3600,\n  }));\n}\n```\n\nKey changes:\n\n",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: "- Added `refreshTokens: true` to enable automatic refresh\n",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n```typescript\nimport { authMiddleware } from './auth';\n\nexport function configureAuth(app: Express) {\n  app.use(authMiddleware({\n    refreshTokens: true,\n    tokenExpiry: 3600,\n  }));\n}\n```\n\nKey changes:\n\n- Added `refreshTokens: true` to enable automatic refresh\n",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: "- Set `tokenExpiry` to 1 hour (3600 seconds)\n",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n```typescript\nimport { authMiddleware } from './auth';\n\nexport function configureAuth(app: Express) {\n  app.use(authMiddleware({\n    refreshTokens: true,\n    tokenExpiry: 3600,\n  }));\n}\n```\n\nKey changes:\n\n- Added `refreshTokens: true` to enable automatic refresh\n- Set `tokenExpiry` to 1 hour (3600 seconds)\n",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: "- Moved middleware before route handlers\n\n",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n```typescript\nimport { authMiddleware } from './auth';\n\nexport function configureAuth(app: Express) {\n  app.use(authMiddleware({\n    refreshTokens: true,\n    tokenExpiry: 3600,\n  }));\n}\n```\n\nKey changes:\n\n- Added `refreshTokens: true` to enable automatic refresh\n- Set `tokenExpiry` to 1 hour (3600 seconds)\n- Moved middleware before route handlers\n\n",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_delta",
		index: 0,
		delta: "This should resolve the 401 errors you're seeing.",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n```typescript\nimport { authMiddleware } from './auth';\n\nexport function configureAuth(app: Express) {\n  app.use(authMiddleware({\n    refreshTokens: true,\n    tokenExpiry: 3600,\n  }));\n}\n```\n\nKey changes:\n\n- Added `refreshTokens: true` to enable automatic refresh\n- Set `tokenExpiry` to 1 hour (3600 seconds)\n- Moved middleware before route handlers\n\nThis should resolve the 401 errors you're seeing.",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "text_end",
		index: 0,
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n```typescript\nimport { authMiddleware } from './auth';\n\nexport function configureAuth(app: Express) {\n  app.use(authMiddleware({\n    refreshTokens: true,\n    tokenExpiry: 3600,\n  }));\n}\n```\n\nKey changes:\n\n- Added `refreshTokens: true` to enable automatic refresh\n- Set `tokenExpiry` to 1 hour (3600 seconds)\n- Moved middleware before route handlers\n\nThis should resolve the 401 errors you're seeing.",
				},
			],
			timestamp: Date.now(),
		},
	},
	{
		type: "done",
		partial: {
			role: "assistant",
			content: [
				{
					type: "text",
					text: "Here's how to fix the authentication issue:\n\nThe problem is in your middleware configuration. You're missing the token refresh handler.\n\n```typescript\nimport { authMiddleware } from './auth';\n\nexport function configureAuth(app: Express) {\n  app.use(authMiddleware({\n    refreshTokens: true,\n    tokenExpiry: 3600,\n  }));\n}\n```\n\nKey changes:\n\n- Added `refreshTokens: true` to enable automatic refresh\n- Set `tokenExpiry` to 1 hour (3600 seconds)\n- Moved middleware before route handlers\n\nThis should resolve the 401 errors you're seeing.",
				},
			],
			stopReason: "end",
			timestamp: Date.now(),
		},
	},
];

/** The final response text for assertions. */
export const FINAL_TEXT = `Here's how to fix the authentication issue:

The problem is in your middleware configuration. You're missing the token refresh handler.

\`\`\`typescript
import { authMiddleware } from './auth';

export function configureAuth(app: Express) {
  app.use(authMiddleware({
    refreshTokens: true,
    tokenExpiry: 3600,
  }));
}
\`\`\`

Key changes:

- Added \`refreshTokens: true\` to enable automatic refresh
- Set \`tokenExpiry\` to 1 hour (3600 seconds)
- Moved middleware before route handlers

This should resolve the 401 errors you're seeing.`;
