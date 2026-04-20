/**
 * Generador fast-check de documentos Markdown válidos.
 * Produce Markdown con elementos CommonMark y GFM variados.
 */
import fc from "fast-check";

/** Genera un heading Markdown (h1-h6) */
const headingArb = fc
  .tuple(fc.integer({ min: 1, max: 6 }), fc.lorem({ maxCount: 5 }))
  .map(([level, text]) => `${"#".repeat(level)} ${text}`);

/** Genera un párrafo de texto */
const paragraphArb = fc.lorem({ maxCount: 20 }).map((text) => text);

/** Genera un bloque de código con lenguaje opcional */
const codeBlockArb = fc
  .tuple(
    fc.constantFrom("", "javascript", "typescript", "python", "rust", "html"),
    fc.lorem({ maxCount: 10 })
  )
  .map(([lang, code]) => `\`\`\`${lang}\n${code}\n\`\`\``);

/** Genera una lista no ordenada */
const listArb = fc
  .array(fc.lorem({ maxCount: 5 }), { minLength: 1, maxLength: 5 })
  .map((items) => items.map((item) => `- ${item}`).join("\n"));

/** Genera una tabla GFM simple */
const tableArb = fc
  .array(fc.lorem({ maxCount: 2 }), { minLength: 2, maxLength: 4 })
  .map((cols) => {
    const header = `| ${cols.join(" | ")} |`;
    const separator = `| ${cols.map(() => "---").join(" | ")} |`;
    const row = `| ${cols.map(() => "data").join(" | ")} |`;
    return `${header}\n${separator}\n${row}`;
  });

/** Genera un enlace Markdown */
const linkArb = fc
  .tuple(fc.lorem({ maxCount: 3 }), fc.webUrl())
  .map(([text, url]) => `[${text}](${url})`);

/** Genera una imagen Markdown con URL HTTPS */
const imageArb = fc
  .lorem({ maxCount: 3 })
  .map((alt) => `![${alt}](https://example.com/image.png)`);

/** Genera un elemento Markdown aleatorio */
const markdownElementArb = fc.oneof(
  headingArb,
  paragraphArb,
  codeBlockArb,
  listArb,
  tableArb,
  linkArb,
  imageArb
);

/** Genera un documento Markdown completo con múltiples elementos */
export const markdownDocumentArb = fc
  .array(markdownElementArb, { minLength: 1, maxLength: 8 })
  .map((elements) => elements.join("\n\n"));

/** Genera Markdown con solo elementos legítimos (sin HTML embebido) */
export const safeMarkdownArb = fc
  .array(fc.oneof(headingArb, paragraphArb, codeBlockArb, listArb, tableArb), {
    minLength: 1,
    maxLength: 5,
  })
  .map((elements) => elements.join("\n\n"));

/** Genera un bloque de código que intenta inyectar HTML */
export const codeBlockWithHtmlArb = fc.constantFrom(
  "```\n</code></pre><script>alert(1)</script>\n```",
  "```html\n<script>alert('xss')</script>\n```",
  "```\n</pre><img src=x onerror=alert(1)>\n```"
);

/** Genera Markdown con frontmatter YAML */
export const markdownWithFrontmatterArb = fc
  .tuple(fc.lorem({ maxCount: 3 }), paragraphArb)
  .map(([title, body]) => `---\ntitle: ${title}\n---\n\n# ${title}\n\n${body}`);

/** Genera Markdown con separadores para división en slides */
export const markdownWithSeparatorsArb = (separatorCount: number) =>
  fc
    .array(paragraphArb, {
      minLength: separatorCount + 1,
      maxLength: separatorCount + 1,
    })
    .map((sections) => sections.join("\n\n---\n\n"));
