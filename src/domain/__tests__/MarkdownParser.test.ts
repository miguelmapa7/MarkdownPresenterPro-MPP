import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { MarkdownParser } from "@/domain";
import { safeMarkdownArb } from "@//__tests__/generators/markdown.gen";

const parser = new MarkdownParser();

describe("MarkdownParser", () => {
  // Feature: markdown-presenter-pro, Property 1: Round-trip de parseo Markdown
  describe("P1: Round-trip parsing", () => {
    it("parse(format(parse(md))) produces equivalent AST to parse(md)", () => {
      fc.assert(
        fc.property(safeMarkdownArb, (markdown) => {
          const ast1 = parser.parse(markdown);
          const formatted = parser.format(ast1);
          const ast2 = parser.parse(formatted);

          // Compare children types and structure (not exact equality due to position info)
          expect(ast2.type).toBe(ast1.type);
          expect(ast2.children.length).toBe(ast1.children.length);
          for (let i = 0; i < ast1.children.length; i++) {
            expect(ast2.children[i]!.type).toBe(ast1.children[i]!.type);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: markdown-presenter-pro, Property 2: Correspondencia estructural HTML
  describe("P2: HTML structural correspondence", () => {
    it("headings produce corresponding <hN> tags", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 6 }),
          fc.lorem({ maxCount: 3 }),
          (level, text) => {
            const md = `${"#".repeat(level)} ${text}`;
            const html = parser.toHtml(md);
            expect(html).toContain(`<h${level}>`);
            expect(html).toContain(`</h${level}>`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("paragraphs produce <p> tags", () => {
      fc.assert(
        fc.property(
          fc.lorem({ minCount: 1, maxCount: 10 }).filter((t) => t.trim().length > 0),
          (text) => {
            const html = parser.toHtml(text);
            expect(html).toContain("<p>");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("GFM tables produce <table> tags", () => {
      fc.assert(
        fc.property(
          fc.array(fc.lorem({ maxCount: 2 }), { minLength: 2, maxLength: 4 }),
          (cols) => {
            const header = `| ${cols.join(" | ")} |`;
            const sep = `| ${cols.map(() => "---").join(" | ")} |`;
            const row = `| ${cols.map(() => "cell").join(" | ")} |`;
            const md = `${header}\n${sep}\n${row}`;
            const html = parser.toHtml(md);
            expect(html).toContain("<table>");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: markdown-presenter-pro, Property 3: Determinación de resaltado de sintaxis
  describe("P3: Syntax highlighting determination", () => {
    it("code blocks with language hint produce hljs classes", () => {
      fc.assert(
        fc.property(fc.constantFrom("javascript", "typescript", "python"), (lang) => {
          const md = `\`\`\`${lang}\nconst x = 1;\n\`\`\``;
          const html = parser.toHtml(md);
          expect(html).toMatch(/class="[^"]*language-|class="[^"]*hljs/);
        }),
        { numRuns: 100 }
      );
    });

    it("code blocks without language hint produce plain pre>code", () => {
      fc.assert(
        fc.property(fc.lorem({ maxCount: 5 }), (code) => {
          const md = `\`\`\`\n${code}\n\`\`\``;
          const html = parser.toHtml(md);
          expect(html).toContain("<pre>");
          expect(html).toContain("<code>");
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: markdown-presenter-pro, Property 4: Resiliencia del parser
  describe("P4: Parser resilience", () => {
    it("never throws on arbitrary string input", () => {
      fc.assert(
        fc.property(fc.string({ maxLength: 500 }), (input) => {
          expect(() => parser.toHtml(input)).not.toThrow();
          expect(() => parser.parse(input)).not.toThrow();
        }),
        { numRuns: 100 }
      );
    });

    it("produces output for any input including empty strings", () => {
      fc.assert(
        fc.property(fc.string({ maxLength: 200 }), (input) => {
          const html = parser.toHtml(input);
          expect(typeof html).toBe("string");
        }),
        { numRuns: 100 }
      );
    });
  });
});
