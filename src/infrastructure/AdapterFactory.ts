/**
 * Fábrica de adaptadores — Abstract Factory.
 *
 * Centraliza la creación de adaptadores según el entorno de ejecución.
 * En Modo Escritorio: usa import dinámico para TauriFileSystemAdapter
 * (permite tree-shaking de dependencias Tauri en el build web).
 * En Modo Web: instancia WebFileSystemAdapter directamente.
 *
 * Esto elimina la lógica de imports dinámicos dispersa en App.tsx
 * y garantiza que cada entorno reciba los adaptadores correctos.
 */

import type { IFileSystemAdapter } from "./IFileSystemAdapter";
import { isTauri } from "./EnvironmentDetector";
import { WebFileSystemAdapter } from "./WebFileSystemAdapter";

export interface AdapterSet {
  fileSystem: IFileSystemAdapter;
  isWeb: boolean;
  /** Solo disponible en modo web — referencia para registrar archivos */
  webFileSystem?: WebFileSystemAdapter;
}

/**
 * Crea el conjunto de adaptadores apropiado según el entorno de ejecución.
 */
export async function createAdapters(): Promise<AdapterSet> {
  if (isTauri()) {
    const { TauriFileSystemAdapter } = await import("./TauriFileSystemAdapter");
    return {
      fileSystem: new TauriFileSystemAdapter(),
      isWeb: false,
    };
  }

  const webFs = new WebFileSystemAdapter();
  return {
    fileSystem: webFs,
    isWeb: true,
    webFileSystem: webFs,
  };
}
