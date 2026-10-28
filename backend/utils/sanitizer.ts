
/**
 * ============================================================
 * BASIC INPUT SANITIZER
 * ============================================================
 *
 * Removes angle brackets from ordinary text fields and trims
 * surrounding whitespace.
 */

export const sanitizeInput = <T extends string | number | boolean | null | undefined>(
  value: T
): T extends null | undefined ? T : string => {
  if (value === null || value === undefined) {
    return value as T extends null | undefined ? T : string;
  }

  return String(value).trim().replace(/[<>]/g, "") as T extends null | undefined
    ? T
    : string;
};

/**
 * ============================================================
 * ADDRESS SANITIZER
 * ============================================================
 *
 * Preserves a limited set of rich-text HTML tags.
 *
 * Allowed tags:
 * p, br, strong, b, em, i, u, s, ul, ol, li
 */

const ALLOWED_ADDRESS_TAGS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "ul",
  "ol",
  "li",
] as const;

const DANGEROUS_TAGS =
  /<(script|style|iframe|object|embed|svg|math|form|input|textarea|select|button)[^>]*>[\s\S]*?<\/\1>/gi;

const DANGEROUS_SELF_CLOSING_TAGS =
  /<(script|style|iframe|object|embed|svg|math|form|input|textarea|select|button)[^>]*\/?>/gi;

export const sanitizeAddress = (
  value: string | number | null | undefined
): string => {
  if (!value) {
    return "";
  }

  let sanitized = String(value);

  // Remove HTML comments.
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, "");

  // Remove dangerous elements and their content.
  sanitized = sanitized.replace(DANGEROUS_TAGS, "");

  // Remove dangerous self-closing/opening tags.
  sanitized = sanitized.replace(DANGEROUS_SELF_CLOSING_TAGS, "");

  // Strip attributes from opening tags.
  // Example: <p onclick="..."> becomes <p>.
  sanitized = sanitized.replace(
    /<([a-z][a-z0-9]*)\b[^>]*>/gi,
    "<$1>"
  );

  // Keep only the approved formatting tags.
  sanitized = sanitized.replace(
    /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
    (fullMatch: string, tagName: string): string => {
      const normalizedTag = tagName.toLowerCase();

      return (ALLOWED_ADDRESS_TAGS as readonly string[]).includes(
        normalizedTag
      )
        ? fullMatch
        : "";
    }
  );

  return sanitized.trim();
};
