import React from "react";
import { useTranslation } from "./I18nProvider";
import type { IconMode } from "@/domain";

interface IconModeToggleProps {
  mode: IconMode;
  onToggle: () => void;
  className?: string;
}

/**
 * IconModeToggle — Alterna entre iconos variados y por contenido.
 * Muestra un botón con el modo actual.
 */
export const IconModeToggle: React.FC<IconModeToggleProps> = ({
  mode,
  onToggle,
  className = "",
}) => {
  const { t } = useTranslation();

  return (
    <button
      onClick={onToggle}
      aria-label={t("icons.mode")}
      title={`${t("icons.mode")}: ${mode === "varied" ? t("icons.varied") : t("icons.content")}`}
      className={`p-2 rounded-lg text-xs font-medium transition-colors
        bg-gray-200/60 hover:bg-gray-300/80 text-gray-700
        dark:bg-gray-700/60 dark:hover:bg-gray-600/80 dark:text-gray-200
        ${className}`}
    >
      {mode === "varied" ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="17" y1="10" x2="3" y2="10" />
          <line x1="21" y1="6" x2="3" y2="6" />
          <line x1="21" y1="14" x2="3" y2="14" />
          <line x1="17" y1="18" x2="3" y2="18" />
        </svg>
      )}
    </button>
  );
};
