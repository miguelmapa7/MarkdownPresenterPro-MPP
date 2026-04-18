import type { Slide } from "@/domain";
import type { IMarkdownParser } from "@/domain";

/**
 * Resultado del renderizado de una diapositiva.
 * Incluye el tiempo de renderizado para validar rendimiento (<200ms).
 */
export interface RenderedSlide {
  html: string;
  renderTimeMs: number;
}

/**
 * Interfaz Strategy para renderizado de elementos Markdown.
 * Cada tipo de contenido (código, tabla, imagen, video) implementa
 * su propia estrategia. Principio SOLID (O): Open/Closed —
 * agregar un nuevo tipo = registrar una nueva estrategia.
 */
export interface RenderStrategy {
  /** Determina si esta estrategia puede manejar el nodo */
  canHandle(nodeType: string): boolean;
  /** Transforma el contenido del nodo en HTML */
  render(content: string): string;
}

/**
 * Registro de estrategias de renderizado.
 * Mantiene una lista ordenada de estrategias y resuelve
 * cuál usar para cada tipo de nodo del AST.
 */
export class StrategyRegistry {
  private strategies: RenderStrategy[] = [];

  register(strategy: RenderStrategy): void {
    this.strategies.push(strategy);
  }

  resolve(nodeType: string): RenderStrategy | undefined {
    return this.strategies.find((s) => s.canHandle(nodeType));
  }
}

// --- Estrategias concretas ---

/** Estrategia para bloques de código con syntax highlighting */
export class CodeBlockStrategy implements RenderStrategy {
  canHandle(nodeType: string): boolean {
    return nodeType === "code";
  }
  render(content: string): string {
    return content; // El highlighting lo maneja rehype-highlight en el pipeline
  }
}

/** Estrategia para tablas GFM */
export class TableStrategy implements RenderStrategy {
  canHandle(nodeType: string): boolean {
    return nodeType === "table";
  }
  render(content: string): string {
    return content;
  }
}

/** Estrategia para imágenes locales/remotas */
export class ImageStrategy implements RenderStrategy {
  canHandle(nodeType: string): boolean {
    return nodeType === "image";
  }
  render(content: string): string {
    return content;
  }
}

/** Estrategia para videos embebidos */
export class VideoStrategy implements RenderStrategy {
  canHandle(nodeType: string): boolean {
    return nodeType === "html" || nodeType === "video";
  }
  render(content: string): string {
    return content;
  }
}

/** Estrategia por defecto para cualquier otro tipo de nodo */
export class DefaultStrategy implements RenderStrategy {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canHandle(_nodeType: string): boolean {
    return true; // Acepta cualquier nodo como fallback
  }
  render(content: string): string {
    return content;
  }
}

/**
 * Crea un registro con las estrategias predeterminadas.
 * El orden importa: la primera que pueda manejar el nodo gana.
 * DefaultStrategy va al final como fallback.
 */
export function createDefaultRegistry(): StrategyRegistry {
  const registry = new StrategyRegistry();
  registry.register(new CodeBlockStrategy());
  registry.register(new TableStrategy());
  registry.register(new ImageStrategy());
  registry.register(new VideoStrategy());
  registry.register(new DefaultStrategy());
  return registry;
}

/**
 * Caso de uso: Renderizar Markdown.
 *
 * Transforma una diapositiva de Markdown crudo a HTML renderizado.
 * Usa el MarkdownParser para la transformación y el StrategyRegistry
 * para extensibilidad futura. Mide el tiempo de renderizado.
 */
export class RenderMarkdownUseCase {
  constructor(
    private readonly parser: IMarkdownParser,
    private readonly _strategyRegistry: StrategyRegistry
  ) {}

  render(slide: Slide): RenderedSlide {
    // Usar caché si existe
    const cached = slide.getCachedHtml();
    if (cached) {
      return { html: cached, renderTimeMs: 0 };
    }

    const start = performance.now();
    const html = this.parser.toHtml(slide.getRawMarkdown());
    const renderTimeMs = performance.now() - start;

    // Guardar en caché para evitar re-renderizado
    slide.setCachedHtml(html);

    return { html, renderTimeMs };
  }

  renderToHtml(markdown: string): string {
    return this.parser.toHtml(markdown);
  }
}
