/**
 * Entrada de archivo/directorio del sistema de archivos.
 */
export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  extension: string;
}

/**
 * Interfaz del adaptador de sistema de archivos.
 * Abstrae el acceso a archivos para que los casos de uso
 * no dependan de una implementación concreta (Tauri, Node, mock).
 * Principio SOLID (D): Inversión de Dependencias.
 */
export interface IFileSystemAdapter {
  readFile(path: string): Promise<string>;
  readDirectory(path: string): Promise<FileEntry[]>;
  exists(path: string): Promise<boolean>;
}
