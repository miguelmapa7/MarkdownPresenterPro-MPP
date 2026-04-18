import type { SlideContentType, SlideMetadata } from "./Slide";

/**
 * Resultado de la resolución de un icono para una diapositiva.
 */
export interface IconResult {
  /** Tipo de icono resuelto */
  type: "custom-svg" | "default";
  /** Contenido SVG string o nombre de icono predeterminado */
  content: string;
  /** true si se usó icono de respaldo por error al cargar el personalizado */
  fallback: boolean;
  /** Mensaje de advertencia si hubo error al cargar SVG personalizado */
  warning?: string;
}

/**
 * Interfaz del resolver de iconos.
 * Principio SOLID (D): las capas superiores dependen de esta interfaz.
 */
export interface IIconResolver {
  resolve(metadata: SlideMetadata): IconResult;
  loadCustomSvg(svgContent: string): IconResult;
}

/** Icono SVG genérico de respaldo (documento simple) */
const FALLBACK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
</svg>`;

/**
 * Servicio IconResolver — Resuelve el icono apropiado para cada diapositiva.
 *
 * Cadena de prioridad:
 * 1. Icono personalizado SVG (si está en los metadatos y es válido)
 * 2. Icono predeterminado por tipo de contenido (code, image, table, text, mixed)
 * 3. Icono genérico de respaldo (si el SVG personalizado falla)
 */
export class IconResolver implements IIconResolver {
  /** Mapa de iconos predeterminados por tipo de contenido */
  private readonly defaultIcons: Map<SlideContentType, string> = new Map([
    [
      "code",
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`,
    ],
    [
      "image",
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
    ],
    [
      "table",
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`,
    ],
    [
      "text",
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/></svg>`,
    ],
    [
      "mixed",
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
    ],
  ]);

  resolve(metadata: SlideMetadata): IconResult {
    // Prioridad 1: Icono personalizado en metadatos
    if (metadata.icon) {
      return this.loadCustomSvg(metadata.icon);
    }

    // Prioridad 2: Icono predeterminado por tipo de contenido
    const defaultIcon = this.defaultIcons.get(metadata.contentType);
    return {
      type: "default",
      content: defaultIcon ?? FALLBACK_ICON,
      fallback: !defaultIcon,
    };
  }

  loadCustomSvg(svgContent: string): IconResult {
    // Validar que el contenido parece ser SVG válido
    const trimmed = svgContent.trim();
    if (!trimmed.startsWith("<svg") || !trimmed.includes("</svg>")) {
      console.warn(
        `[IconResolver] SVG personalizado inválido: no es un elemento SVG válido`
      );
      return {
        type: "custom-svg",
        content: FALLBACK_ICON,
        fallback: true,
        warning: "SVG personalizado inválido: no es un elemento SVG válido",
      };
    }

    return {
      type: "custom-svg",
      content: trimmed,
      fallback: false,
    };
  }
}
