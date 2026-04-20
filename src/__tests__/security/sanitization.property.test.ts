import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";
import { MarkdownParser, resetSecurityLogger } from "@/domain";

const parser = new MarkdownParser();

/** Dangerous HTML patterns that should never appear in sanitized output */
const DANGEROUS_PATTERNS = [
  /<script[\s>]/i,
  /\bonclick\s*=/i,
  /\bonerror\s*=/i,
  /\bonload\s*=/i,
  /\bonmouseover\s*=/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /<iframe[\s>]/i,
  /<object[\s>]/i,
  /<embed[\s>]/i,
  /<form[\s>]/i,
];

/** Generates Markdown with embedded malicious HTML */
const maliciousMarkdownArb = fc.oneof(
  fc.constant("# Title\n\n<script>alert('xss')</script>"),
  fc.constant("Hello <img src=x onerror=alert(1)> world"),
  fc.constant("[click me](javascript:alert(1))"),
  fc.constant("<iframe src='https://evil.com'></iframe>"),
  fc.constant("<object data='evil.swf'></object>"),
  fc.constant("<embed src='evil.swf'>"),
  fc.constant("<form action='https://evil.com'><input></form>"),
  fc.constant("text <div onclick=alert(1)>click</div>"),
  fc.constant("text <a href='javascript:void(0)'>link</a>"),
  fc.constant("<img src=x onerror='fetch(\"https://evil.com\")'>"),
  fc
    .lorem({ maxCount: 5 })
    .map((text) => `${text}\n\n<script>document.cookie</script>\n\n${text}`),
  fc
    .lorem({ maxCount: 5 })
    .map((text) => `${text}\n\n<div onmouseover="alert(1)">${text}</div>`)
);

describe("Security: Sanitization", () => {
  beforeEach(() => {
    resetSecurityLogger();
  });

  // Feature: security-testing, Property 1: Sanitización completa del HTML
  describe("XSS sanitization", () => {
    it(
      "removes all dangerous HTML elements and attributes from output",
      { timeout: 30000 },
      () => {
        fc.assert(
          fc.property(maliciousMarkdownArb, (markdown) => {
            const html = parser.toHtml(markdown);

            for (const pattern of DANGEROUS_PATTERNS) {
              expect(html).not.toMatch(pattern);
            }
          }),
          { numRuns: 100 }
        );
      }
    );
  });

  // Feature: security-testing, Property 2: Preservación de contenido legítimo
  describe("Content preservation", () => {
    it("preserves text content from safe Markdown elements", { timeout: 30000 }, () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "Hello world",
            "Test content",
            "Simple text",
            "Another paragraph",
            "More words here"
          ),
          (text) => {
            const html = parser.toHtml(text);
            const words = text.split(/\s+/).filter((w) => w.length > 2);
            for (const word of words.slice(0, 3)) {
              expect(html).toContain(word);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it("preserves headings structure", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 6 }),
          fc.constantFrom("Hello", "World", "Test", "Title", "Section"),
          (level, text) => {
            const md = `${"#".repeat(level)} ${text}`;
            const html = parser.toHtml(md);
            expect(html).toContain(`<h${level}>`);
            expect(html).toContain(text);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: security-testing, Property 10: Escapado correcto de bloques de código
  describe("Code block escaping", () => {
    it("keeps injected HTML escaped inside code blocks", { timeout: 30000 }, () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "```\n<script>alert(1)</script>\n```",
            "```\n</code></pre><script>alert(1)</script>\n```",
            "```html\n<img src=x onerror=alert(1)>\n```",
            "```\n<iframe src=evil></iframe>\n```"
          ),
          (markdown) => {
            const html = parser.toHtml(markdown);
            // Should not have unescaped script tags outside code blocks
            expect(html).not.toMatch(/<script[\s>]/i);
            expect(html).not.toMatch(/<iframe[\s>]/i);
            // Should still have pre/code structure
            expect(html).toContain("<pre>");
            expect(html).toMatch(/<code/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
