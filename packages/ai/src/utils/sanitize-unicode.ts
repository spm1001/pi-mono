/**
 * Removes unpaired Unicode surrogate characters from a string.
 *
 * Unpaired surrogates (high surrogates 0xD800-0xDBFF without matching low surrogates 0xDC00-0xDFFF,
 * or vice versa) cause JSON serialization errors in many API providers.
 *
 * Valid emoji and other characters outside the Basic Multilingual Plane use properly paired
 * surrogates and will NOT be affected by this function.
 *
 * @param text - The text to sanitize
 * @returns The sanitized text with unpaired surrogates removed
 *
 * @example
 * // Valid emoji (properly paired surrogates) are preserved
 * sanitizeSurrogates("Hello 🙈 World") // => "Hello 🙈 World"
 *
 * // Unpaired high surrogate is removed
 * const unpaired = String.fromCharCode(0xD83D); // high surrogate without low
 * sanitizeSurrogates(`Text ${unpaired} here`) // => "Text  here"
 */
// Pre-compiled regex for surrogate detection (avoid re-creation per call)
const SURROGATE_REGEX = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;

// Fast check: if no char is >= 0xD800, there can't be any surrogates.
// This avoids the expensive regex for pure ASCII / BMP-only text (vast majority of cases).
const HAS_SURROGATE_RANGE = /[\uD800-\uDFFF]/;

export function sanitizeSurrogates(text: string): string {
	// Fast path: skip regex replace if no surrogate-range chars present
	if (!HAS_SURROGATE_RANGE.test(text)) {
		return text;
	}
	// Replace unpaired high surrogates (0xD800-0xDBFF not followed by low surrogate)
	// Replace unpaired low surrogates (0xDC00-0xDFFF not preceded by high surrogate)
	SURROGATE_REGEX.lastIndex = 0;
	return text.replace(SURROGATE_REGEX, "");
}
