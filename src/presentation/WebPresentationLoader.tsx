import React, { useRef, useState, useCallback } from "react";
import { useTranslation } from "./I18nProvider";
import type { WebFileSystemAdapter } from "@/infrastructure/WebFileSystemAdapter";

interface WebPresentationLoaderProps {
  /** Callback cuando se cargan archivos exitosamente */
  onLoad: (path: string, type: "file" | "directory") => void;
  /** Referencia al WebFileSystemAdapter para registrar archivos */
  webFs: WebFileSystemAdapter;
  /** Si está cargando actualmente */
  isLoading: boolean;
  /** Mensaje de error si la carga falló */
  error: string | null;
}

/**
 * Detecta si el navegador soporta el atributo webkitdirectory.
 * Crea un input temporal y verifica la propiedad.
 */
function supportsWebkitDirectory(): boolean {
  try {
    const input = document.createElement("input");
    return "webkitdirectory" in input;
  } catch {
    return false;
  }
}

/**
 * Componente de carga para Modo Web.
 *
 * Reemplaza los diálogos nativos de Tauri con <input type="file"> ocultos.
 * Soporta:
 * - Selección de archivo .md individual (accept=".md,.markdown")
 * - Selección de carpeta (webkitdirectory)
 * - Selección múltiple de archivos .md
 * - Drag & drop de archivos y carpetas
 * - Detección de soporte webkitdirectory
 */
export const WebPresentationLoader: React.FC<WebPresentationLoaderProps> = ({
  onLoad,
  webFs,
  isLoading,
  error,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const hasWebkitDirectory = supportsWebkitDirectory();

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      webFs.setFiles(files);

      if (files.length === 1) {
        const file = files[0]!;
        const path = file.webkitRelativePath || file.name;
        onLoad(path, "file");
      } else {
        const firstFile = files[0]!;
        const dirPath = firstFile.webkitRelativePath
          ? (firstFile.webkitRelativePath.split("/")[0] ?? ".")
          : ".";
        onLoad(dirPath, "directory");
      }

      // Reset input para permitir re-selección del mismo archivo
      e.target.value = "";
    },
    [onLoad, webFs]
  );

  const handleFolderSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      webFs.setFiles(files);

      const firstFile = files[0]!;
      const dirPath = firstFile.webkitRelativePath
        ? (firstFile.webkitRelativePath.split("/")[0] ?? ".")
        : ".";
      onLoad(dirPath, "directory");

      e.target.value = "";
    },
    [onLoad, webFs]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;

      // Filtrar solo archivos .md/.markdown
      const mdFiles: File[] = [];
      for (const file of Array.from(files)) {
        const name = file.name.toLowerCase();
        if (name.endsWith(".md") || name.endsWith(".markdown")) {
          mdFiles.push(file);
        }
      }

      if (mdFiles.length === 0) return;

      webFs.setFiles(mdFiles);

      if (mdFiles.length === 1) {
        onLoad(mdFiles[0]!.name, "file");
      } else {
        onLoad(".", "directory");
      }
    },
    [onLoad, webFs]
  );

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 p-8">
      {/* Inputs ocultos */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        data-testid="web-file-input"
      />
      {hasWebkitDirectory && (
        <input
          ref={folderInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is non-standard but widely supported
          webkitdirectory=""
          className="hidden"
          onChange={handleFolderSelect}
          data-testid="web-folder-input"
        />
      )}

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
          transition-colors ${
            dragOver
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
          }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <p className="text-gray-400 dark:text-gray-500 text-sm">{t("web.dragHint")}</p>

        <div className="flex gap-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="px-6 py-3 rounded-lg bg-blue-500 text-white font-medium
              hover:bg-blue-600 disabled:bg-blue-300 dark:disabled:bg-blue-800 transition-colors"
          >
            {isLoading ? t("loader.loading") : t("web.openFile")}
          </button>

          {hasWebkitDirectory ? (
            <button
              onClick={() => folderInputRef.current?.click()}
              disabled={isLoading}
              className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-medium
                hover:bg-gray-300 disabled:bg-gray-100
                dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 dark:disabled:bg-gray-800
                transition-colors"
            >
              {t("web.openFolder")}
            </button>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 text-xs self-center max-w-48 text-center">
              {t("web.folderNotSupported")}
            </p>
          )}
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
