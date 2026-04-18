/**
 * Hook helper para detectar la plataforma y adaptar atajos de teclado.
 *
 * macOS usa Cmd (⌘), Windows/Linux usan Ctrl.
 * Detectamos con navigator.platform para adaptar los atajos.
 */

export function isMac(): boolean {
  return navigator.platform.toUpperCase().includes("MAC");
}

/** Retorna "⌘" en macOS, "Ctrl" en Windows/Linux */
export function getModifierKey(): string {
  return isMac() ? "⌘" : "Ctrl";
}

/** Verifica si la tecla modificadora correcta está presionada */
export function isModifierPressed(event: KeyboardEvent): boolean {
  return isMac() ? event.metaKey : event.ctrlKey;
}

/** Mapa de atajos con sus descripciones para mostrar en UI */
export function getShortcutDescriptions(): Record<string, string> {
  const mod = getModifierKey();
  return {
    nextSlide: "→ / Space",
    previousSlide: "←",
    togglePresenterMode: "P",
    toggleFullscreen: "F / F11",
    exitPresentation: "Escape",
    openFile: `${mod}+O`,
  };
}
