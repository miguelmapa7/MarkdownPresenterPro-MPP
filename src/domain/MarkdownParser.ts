import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkStringify from "remark-stringify";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import type { Root as MdastRoot } from "mdast";

/**
 * Interfaz del parser de Markdown.
 * Define el contrato para parsear, formatear y renderizar Markdown.
 * Principio SOLID (D): las capas superiores dependen de esta interfaz,
 * no de la implementación concreta.
 */
export interface IMarkdownParser {
  /** Markdown → AST (mdast) */
  parse(markdown: string): MdastRoot;
  /** AST (mdast) → Markdown */
  format(ast: MdastRoot): string;
  /** Markdown → HTML */
  toHtml(markdown: string): string;
}

/**
 * Implementación del parser usando el ecosistema Unified.js.
 *
 * Configura 3 pipelines de procesamiento:
 * 1. Parseo: Markdown → AST (remarkParse + remarkGfm + remarkFrontmatter)
 * 2. Renderizado: Markdown → HTML (parseo + remarkRehype + rehypeHighlight + rehypeStringify)
 * 3. Formateo: AST → Markdown (remarkStringify + remarkGfm) para round-trip
 */
export class MarkdownParser implements IMarkdownParser {
  /** Pipeline de parseo: Markdown → AST */
  private readonly parseProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter);

  /** Pipeline de renderizado: Markdown → HTML */
  private readonly htmlProcessor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkFrontmatter)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHighlight)
    .use(rehypeStringify);

  /** Pipeline de formateo: AST → Markdown */
  private readonly formatProcessor = unified()
    .use(remarkStringify, {
      bullet: "-",
      emphasis: "_",
      strong: "*",
    })
    .use(remarkGfm);

  parse(markdown: string): MdastRoot {
    return this.parseProcessor.parse(markdown) as MdastRoot;
  }

  format(ast: MdastRoot): string {
    return this.formatProcessor.stringify(ast);
  }

  toHtml(markdown: string): string {
    const result = this.htmlProcessor.processSync(markdown);
    return String(result);
  }
}
