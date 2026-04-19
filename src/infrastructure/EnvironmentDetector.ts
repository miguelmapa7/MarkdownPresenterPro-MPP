/**
 * Detector de entorno de ejecución.
 *
 * Determina si MPP se ejecuta dentro de Tauri (escritorio) o en un
 * navegador web estándar. La detección es síncrona y se basa en la
 * presencia de `window.__TAURI_INTERNALS__`, que Tauri inyecta
 * automáticamente en el contexto global del WebView.
 *
 * Patrón Strategy: según el resultado, la app instancia adaptadores
 * diferentes (TauriFileSystemAdapter vs WebFileSystemAdapter).
 */

export type RuntimeEnvironment = "tauri" | "web";

/**
 * Retorna `true` si MPP se ejecuta dentro de Tauri.
 * Verificación síncrona — no impacta el tiempo de inicio.
 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Retorna el entorno de ejecución actual como string tipado.
 */
export function getEnvironment(): RuntimeEnvironment {
  return isTauri() ? "tauri" : "web";
}
