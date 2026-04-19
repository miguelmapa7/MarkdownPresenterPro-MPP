import React from "react";
import { useTranslation } from "./I18nProvider";

interface WebModeBadgeProps {
  className?: string;
}

/**
 * Badge sutil que indica el modo de ejecución web.
 * Se muestra en la esquina inferior izquierda de la interfaz.
 * Solo visible cuando MPP se ejecuta en Modo Web.
 *
 * Requerimiento 7.1: indicador visual que identifique el modo "Web".
 */
export const WebModeBadge: React.FC<WebModeBadgeProps> = ({ className = "" }) => {
  const { t } = useTranslation();

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 px-3 py-1 rounded-full text-xs font-medium
        bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300
        opacity-70 hover:opacity-100 transition-opacity ${className}`}
      data-testid="web-mode-badge"
    >
      {t("web.badge")}
    </div>
  );
};
