// Capa de Infraestructura — Adaptadores
// Exporta los adaptadores a servicios externos (filesystem, persistencia)

export type { IFileSystemAdapter, FileEntry } from "./IFileSystemAdapter";
export type { IPersistenceAdapter } from "./IPersistenceAdapter";
export { TauriFileSystemAdapter } from "./TauriFileSystemAdapter";
export { LocalPersistenceAdapter } from "./LocalPersistenceAdapter";
