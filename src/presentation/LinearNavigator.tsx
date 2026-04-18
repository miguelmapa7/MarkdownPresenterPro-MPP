import React, { useEffect, useCallback } from "react";
import { useTranslation } from "./I18nProvider";

interface LinearNavigatorProps {
  /** Si se puede avanzar a la siguiente diapositiva */
  canGoNext: boolean;
  /** Si se puede retroceder a la anterior */
  canGoPrevious: boolean;
  /** Callback al presionar "Siguiente" */
  onNext: () => void;
  /** Callback al presionar "Anterior" */
  onPrevious: () => void;
}

/**
 * Componente LinearNavigator — Navegación secuencial entre diapositivas.
 *
 * Muestra botones "Anterior" y "Siguiente" con estados habilitado/deshabilitado.
 * Registra listeners de teclado globales (flechas izquierda/derecha).
 * Los botones se deshabilitan visual y funcionalmente en los límites.
 */
export const LinearNavigator: React.FC<LinearNavigatorProps> = ({
  canGoNext,
  canGoPrevious,
  onNext,
  onPrevious,
}) => {
  const { t } = useTranslation();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      switch (event.key) {
        case "ArrowRight":
        case " ": // Space
          if (canGoNext) {
            event.preventDefault();
            onNext();
          }
          break;
        case "ArrowLeft":
          if (canGoPrevious) {
            event.preventDefault();
            onPrevious();
          }
          break;
      }
    },
    [canGoNext, canGoPrevious, onNext, onPrevious]
  );

  // Registrar/limpiar listener de teclado global
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex items-center justify-center gap-4 p-4">
      <button
        onClick={onPrevious}
        disabled={!canGoPrevious}
        aria-label={t("nav.previousSlide")}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors
          enabled:bg-gray-200 enabled:hover:bg-gray-300 enabled:text-gray-700
          disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed
          dark:enabled:bg-gray-700 dark:enabled:hover:bg-gray-600 dark:enabled:text-gray-200
          dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
      >
        {t("nav.previousArrow")}
      </button>

      <button
        onClick={onNext}
        disabled={!canGoNext}
        aria-label={t("nav.nextSlide")}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors
          enabled:bg-gray-200 enabled:hover:bg-gray-300 enabled:text-gray-700
          disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed
          dark:enabled:bg-gray-700 dark:enabled:hover:bg-gray-600 dark:enabled:text-gray-200
          dark:disabled:bg-gray-800 dark:disabled:text-gray-500"
      >
        {t("nav.nextArrow")}
      </button>
    </div>
  );
};
