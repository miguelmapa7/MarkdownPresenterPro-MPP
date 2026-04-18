import React, { useState } from "react";
import { useTranslation } from "./I18nProvider";

interface PresentationLoaderProps {
  /** Callback cuando se carga una presentación exitosamente */
  onLoad: (path: string, type: "file" | "directory") => void;
  /** Si está cargando actualmente */
  isLoading: boolean;
  /** Mensaje de error si la carga falló */
  error: string | null;
}

/**
 * Componente PresentationLoader — Pantalla inicial de carga.
 *
 * Muestra opciones para abrir un archivo .md o una carpeta.
 * Usa la Tauri Dialog API para diálogos nativos del SO.
 * Maneja estados: idle, loading, error.
 */
export const PresentationLoader: React.FC<PresentationLoaderProps> = ({
  onLoad,
  isLoading,
  error,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const { t } = useTranslation();

  const handleOpenFile = async () => {
    try {
      // Importación dinámica de Tauri dialog API
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: false,
        filters: [{ name: "Markdown", extensions: ["md"] }],
      });
      if (selected) {
        onLoad(selected as string, "file");
      }
    } catch {
      // Fallback si no estamos en Tauri (desarrollo web)
      console.warn("Tauri dialog no disponible, usando modo web");
    }
  };

  const handleOpenFolder = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({ directory: true });
      if (selected) {
        onLoad(selected as string, "directory");
      }
    } catch {
      console.warn("Tauri dialog no disponible, usando modo web");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
      {/* Logo y título */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          {t("loader.title")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400">{t("loader.subtitle")}</p>
      </div>

      {/* Zona de drop / botones */}
      <div
        className={`flex flex-col items-center gap-4 p-12 rounded-2xl border-2 border-dashed
          transition-colors ${dragOver ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20" : "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800"}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files[0];
          if (file?.name.endsWith(".md")) {
            onLoad(file.name, "file");
          }
        }}
      >
        <p className="text-gray-400 dark:text-gray-500 text-sm">{t("loader.dragHint")}</p>

        <div className="flex gap-4">
          <button
            onClick={handleOpenFile}
            disabled={isLoading}
            className="px-6 py-3 rounded-lg bg-blue-500 text-white font-medium
              hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 transition-colors"
          >
            {isLoading ? t("loader.loading") : t("loader.openFile")}
          </button>

          <button
            onClick={handleOpenFolder}
            disabled={isLoading}
            className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-medium
              hover:bg-gray-300 disabled:bg-gray-100
              dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:disabled:bg-gray-800
              transition-colors"
          >
            {t("loader.openFolder")}
          </button>
        </div>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="px-6 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
};
