/**
 * Adaptador de sistema de archivos para navegador web.
 *
 * Patrón Adapter: traduce la API File del navegador a la interfaz
 * IFileSystemAdapter. Opera sobre objetos File almacenados en un
 * Map interno, que se puebla cuando el usuario selecciona archivos
 * mediante <input type="file"> o drag & drop.
 *
 * Los casos de uso (LoadPresentationUseCase, etc.) no saben si están
 * leyendo del disco nativo o de la memoria del navegador — solo
 * interactúan con IFileSystemAdapter.
 */

import type { IFileSystemAdapter, FileEntry } from "./IFileSystemAdapter";

/** Tamaño máximo de archivo: 10 MB */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Tipos MIME considerados texto válido */
const TEXT_MIME_TYPES = ["text/plain", "text/markdown", "text/x-markdown"];

/** Extensiones de archivo soportadas */
const SUPPORTED_EXTENSIONS = [".md", ".markdown", ".txt"];

export class WebFileSystemAdapter implements IFileSystemAdapter {
  /** Mapa de nombre/ruta relativa → objeto File del navegador */
  private files: Map<string, File> = new Map();

  /**
   * Registra archivos seleccionados por el usuario para lectura posterior.
   * Se invoca desde WebPresentationLoader al seleccionar archivos o carpetas.
   */
  setFiles(fileList: FileList | File[]): void {
    this.files.clear();
    for (const file of Array.from(fileList)) {
      // webkitRelativePath contiene la ruta relativa dentro de la carpeta
      const key = file.webkitRelativePath || file.name;
      this.files.set(key, file);
    }
  }

  async readFile(path: string): Promise<string> {
    const file = this.files.get(path);
    if (!file) {
      throw new Error(`Archivo no encontrado: ${path}`);
    }

    // Validar tipo de archivo
    if (!this.isTextFile(file)) {
      throw new Error(
        `Tipo de archivo no soportado: ${file.type || "desconocido"}. ` +
          `Solo se aceptan archivos .md, .markdown y .txt`
      );
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(
        `El archivo excede el tamaño máximo de 10 MB: ${file.name} ` +
          `(${(file.size / 1024 / 1024).toFixed(1)} MB)`
      );
    }

    return file.text();
  }

  async readDirectory(path: string): Promise<FileEntry[]> {
    const entries: FileEntry[] = [];

    for (const [key, file] of this.files.entries()) {
      const relativePath = file.webkitRelativePath || file.name;
      if (this.isInDirectory(relativePath, path)) {
        const name = file.name;
        const ext = name.includes(".") ? `.${name.split(".").pop()}` : "";
        entries.push({
          name,
          path: key,
          isDirectory: false,
          extension: ext,
        });
      }
    }

    return entries.sort((a, b) => a.name.localeCompare(b.name));
  }

  async exists(path: string): Promise<boolean> {
    // Verificar coincidencia exacta (archivo individual)
    if (this.files.has(path)) return true;

    // Verificar si es un directorio (algún archivo tiene esta ruta como prefijo)
    for (const key of this.files.keys()) {
      if (key.startsWith(path + "/") || key.startsWith(path)) return true;
    }

    return false;
  }

  /** Obtiene la lista de archivos cargados actualmente */
  getLoadedFiles(): Map<string, File> {
    return new Map(this.files);
  }

  /** Limpia los archivos cargados */
  clear(): void {
    this.files.clear();
  }

  /** Verifica si un archivo es de tipo texto/markdown soportado */
  private isTextFile(file: File): boolean {
    return (
      TEXT_MIME_TYPES.includes(file.type) ||
      SUPPORTED_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)) ||
      file.type === "" // Algunos navegadores no asignan MIME a .md
    );
  }

  /** Verifica si un archivo pertenece a un directorio dado */
  private isInDirectory(filePath: string, dirPath: string): boolean {
    if (!dirPath || dirPath === "" || dirPath === ".") return true;
    return filePath.startsWith(dirPath);
  }
}
