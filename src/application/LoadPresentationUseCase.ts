import { Presentation, Slide } from "@/domain";
import type { SlideContentType } from "@/domain";
import type { IMarkdownParser } from "@/domain";
import type { IIconResolver } from "@/domain";
import type { IFileSystemAdapter } from "@/infrastructure/IFileSystemAdapter";

/**
 * Entrada para cargar una presentación.
 */
export interface LoadPresentationInput {
  path: string;
  type: "file" | "directory";
}

/**
 * Resultado de la carga de una presentación.
 */
export interface LoadPresentationResult {
  success: boolean;
  presentation?: Presentation;
  error?: string;
}

/**
 * Caso de uso: Cargar Presentación.
 *
 * Orquesta la carga de archivos Markdown y su transformación
 * en una Presentación navegable. Soporta dos modos:
 * - Archivo individual: divide por separadores (--- o headings h1/h2)
 * - Carpeta: cada .md es una diapositiva, orden alfabético
 */
export class LoadPresentationUseCase {
  constructor(
    private readonly fileSystem: IFileSystemAdapter,
    private readonly parser: IMarkdownParser,
    private readonly iconResolver: IIconResolver
  ) {}

  async execute(input: LoadPresentationInput): Promise<LoadPresentationResult> {
    try {
      const exists = await this.fileSystem.exists(input.path);
      if (!exists) {
        return { success: false, error: `Ruta no encontrada: ${input.path}` };
      }

      const slides =
        input.type === "file"
          ? await this.loadFile(input.path)
          : await this.loadDirectory(input.path);

      if (slides.length === 0) {
        const msg =
          input.type === "file"
            ? "El archivo no contiene contenido para presentar"
            : "No se encontraron archivos Markdown válidos en la carpeta";
        return { success: false, error: msg };
      }

      return { success: true, presentation: new Presentation(slides) };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, error: msg };
    }
  }

  private async loadFile(filePath: string): Promise<Slide[]> {
    const content = await this.fileSystem.readFile(filePath);
    if (!content.trim()) return [];

    const fileName = filePath.split("/").pop() ?? filePath;
    return this.splitIntoSlides(content, fileName);
  }

  private async loadDirectory(dirPath: string): Promise<Slide[]> {
    const entries = await this.fileSystem.readDirectory(dirPath);

    // Filtrar solo archivos .md y ordenar alfabéticamente
    const mdFiles = entries
      .filter((e) => !e.isDirectory && e.extension === ".md")
      .sort((a, b) => a.name.localeCompare(b.name));

    const slides: Slide[] = [];
    for (const file of mdFiles) {
      const content = await this.fileSystem.readFile(file.path);
      if (!content.trim()) continue;

      const title = file.name.replace(/\.md$/, "");
      const contentType = this.detectContentType(content);
      slides.push(
        new Slide(content, {
          title,
          contentType,
          sourceFile: file.path,
        })
      );
    }
    return slides;
  }

  /**
   * Divide un archivo Markdown en diapositivas usando separadores.
   * Separadores soportados: '---' (horizontal rule) y headings h1/h2.
   */
  splitIntoSlides(markdown: string, sourceFile: string): Slide[] {
    // Dividir por horizontal rules (---) como separador principal
    const sections = markdown.split(/\n---\n/).filter((s) => s.trim());

    return sections.map((section, index) => {
      const title = this.extractTitle(section, index);
      const contentType = this.detectContentType(section);
      return new Slide(section.trim(), {
        title,
        contentType,
        sourceFile,
      });
    });
  }

  private extractTitle(markdown: string, index: number): string {
    // Buscar el primer heading h1 o h2
    const headingMatch = markdown.match(/^#{1,2}\s+(.+)$/m);
    if (headingMatch?.[1]) return headingMatch[1].trim();
    return `Diapositiva ${index + 1}`;
  }

  /**
   * Detecta el tipo de contenido predominante analizando el AST.
   */
  detectContentType(markdown: string): SlideContentType {
    const ast = this.parser.parse(markdown);
    const counts = { code: 0, image: 0, table: 0, text: 0 };

    for (const node of ast.children) {
      switch (node.type) {
        case "code":
          counts.code++;
          break;
        case "table":
          counts.table++;
          break;
        case "paragraph":
          // Revisar si el párrafo contiene imágenes
          if (
            "children" in node &&
            node.children.some((child: { type: string }) => child.type === "image")
          ) {
            counts.image++;
          } else {
            counts.text++;
          }
          break;
        default:
          counts.text++;
      }
    }

    const total = counts.code + counts.image + counts.table + counts.text;
    if (total === 0) return "text";

    // Tipo predominante si supera el 50%
    if (counts.code / total > 0.5) return "code";
    if (counts.image / total > 0.5) return "image";
    if (counts.table / total > 0.5) return "table";
    if (counts.text / total > 0.5) return "text";
    return "mixed";
  }
}
