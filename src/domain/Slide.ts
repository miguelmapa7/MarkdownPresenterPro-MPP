/**
 * Tipos de contenido predominante en una diapositiva.
 * Se usa para asignar iconos predeterminados en el Dock.
 */
export type SlideContentType = "code" | "image" | "text" | "table" | "mixed";

/**
 * Metadatos asociados a una diapositiva.
 */
export interface SlideMetadata {
  /** Ruta a SVG personalizado o nombre de icono predeterminado */
  icon?: string;
  /** Título extraído del primer heading o nombre de archivo */
  title: string;
  /** Tipo de contenido predominante */
  contentType: SlideContentType;
  /** Archivo .md de origen */
  sourceFile: string;
}

/**
 * Entidad Slide — Unidad de contenido dentro de una presentación.
 *
 * Cada diapositiva contiene el Markdown crudo, sus metadatos
 * y un caché opcional del HTML renderizado para evitar
 * re-procesamiento innecesario.
 */
export class Slide {
  readonly id: string;
  private cachedHtml: string | null = null;

  constructor(
    readonly rawMarkdown: string,
    readonly metadata: SlideMetadata
  ) {
    this.id = crypto.randomUUID();
  }

  getRawMarkdown(): string {
    return this.rawMarkdown;
  }

  getMetadata(): SlideMetadata {
    return this.metadata;
  }

  getCachedHtml(): string | null {
    return this.cachedHtml;
  }

  setCachedHtml(html: string): void {
    this.cachedHtml = html;
  }
}
