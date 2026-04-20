/**
 * Plugin rehype personalizado que detecta contenido potencialmente malicioso
 * en el árbol HTML (hast) ANTES de que rehype-sanitize lo elimine.
 *
 * Se posiciona entre rehypeHighlight y rehypeSanitize en el pipeline.
 * Recorre el árbol buscando patrones peligrosos (scripts, event handlers,
 * elementos prohibidos, URLs javascript:, estilos maliciosos) y los registra
 * via SecurityLogger.
 */

import type { Root, Element } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import { SecurityLogger } from "./SecurityLogger";
import type { SecurityEventType } from "./SecurityLogger";

/** Elementos HTML considerados peligrosos */
const DANGEROUS_ELEMENTS = new Set(["script", "iframe", "object", "embed", "form"]);

/** Atributos de event handler (on*) */
const EVENT_HANDLER_PATTERN = /^on[a-z]/i;

/** Esquemas de URL peligrosos */
const DANGEROUS_URL_PATTERN = /^\s*(javascript|vbscript|data:text\/html)/i;

/** Expresiones CSS maliciosas */
const DANGEROUS_STYLE_PATTERN = /expression\s*\(|url\s*\(\s*javascript:|(-moz-binding)/i;

// Instancia singleton del logger para el pipeline
let sharedLogger: SecurityLogger = new SecurityLogger();

export function getSecurityLogger(): SecurityLogger {
  return sharedLogger;
}

export function resetSecurityLogger(): void {
  sharedLogger = new SecurityLogger();
}

/**
 * Plugin rehype que escanea el árbol hast en busca de contenido malicioso
 * y lo registra en el SecurityLogger antes de que rehype-sanitize lo elimine.
 */
const rehypeSanitizeLogger: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      const tagName = node.tagName.toLowerCase();

      // Detectar elementos peligrosos
      if (DANGEROUS_ELEMENTS.has(tagName)) {
        logEvent("xss_dangerous_element", `Elemento <${tagName}> detectado`);
      }

      // Detectar scripts
      if (tagName === "script") {
        logEvent("xss_script", "Etiqueta <script> detectada");
      }

      // Detectar event handlers y URLs peligrosas en atributos
      if (node.properties) {
        for (const [attr, value] of Object.entries(node.properties)) {
          // Event handlers (onclick, onerror, etc.)
          if (EVENT_HANDLER_PATTERN.test(attr)) {
            logEvent("xss_event_handler", `Atributo ${attr} detectado en <${tagName}>`);
          }

          // URLs con esquema javascript: / vbscript:
          if (
            (attr === "href" || attr === "src") &&
            typeof value === "string" &&
            DANGEROUS_URL_PATTERN.test(value)
          ) {
            logEvent(
              "xss_dangerous_url",
              `URL peligrosa en ${attr} de <${tagName}>: ${value.slice(0, 50)}`
            );
          }

          // Estilos con expresiones ejecutables
          if (
            attr === "style" &&
            typeof value === "string" &&
            DANGEROUS_STYLE_PATTERN.test(value)
          ) {
            logEvent("xss_dangerous_style", `Estilo malicioso detectado en <${tagName}>`);
          }
        }
      }
    });
  };
};

function logEvent(type: SecurityEventType, detail: string): void {
  sharedLogger.log({ type, detail, timestamp: Date.now() });
}

export default rehypeSanitizeLogger;
