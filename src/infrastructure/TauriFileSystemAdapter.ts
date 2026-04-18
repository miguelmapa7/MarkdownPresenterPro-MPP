import { readTextFile, readDir, exists as fsExists } from "@tauri-apps/plugin-fs";
import type { IFileSystemAdapter, FileEntry } from "./IFileSystemAdapter";

/**
 * Adaptador de sistema de archivos usando Tauri plugin-fs.
 *
 * Patrón Adapter: traduce la API de Tauri a nuestra interfaz
 * IFileSystemAdapter. Si migramos a Electron u otra plataforma,
 * solo cambiamos este adaptador sin tocar los casos de uso.
 */
export class TauriFileSystemAdapter implements IFileSystemAdapter {
  async readFile(path: string): Promise<string> {
    try {
      return await readTextFile(path);
    } catch (error) {
      throw new Error(
        `No se pudo leer el archivo: ${path}. ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  }

  async readDirectory(path: string): Promise<FileEntry[]> {
    try {
      const entries = await readDir(path);
      return entries.map((entry) => {
        const name = entry.name ?? "";
        const ext = name.includes(".") ? `.${name.split(".").pop()}` : "";
        return {
          name,
          path: `${path}/${name}`,
          isDirectory: entry.isDirectory ?? false,
          extension: ext,
        };
      });
    } catch (error) {
      throw new Error(
        `No se pudo leer el directorio: ${path}. ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      return await fsExists(path);
    } catch {
      return false;
    }
  }
}
