// Capa de Infraestructura — Adaptadores
// Exporta los adaptadores a servicios externos (filesystem, persistencia)

export type { IFileSystemAdapter, FileEntry } from "./IFileSystemAdapter";
export type { IPersistenceAdapter } from "./IPersistenceAdapter";
export { TauriFileSystemAdapter } from "./TauriFileSystemAdapter";
export { LocalPersistenceAdapter } from "./LocalPersistenceAdapter";
export { isTauri, getEnvironment } from "./EnvironmentDetector";
export type { RuntimeEnvironment } from "./EnvironmentDetector";
export { createAdapters } from "./AdapterFactory";
export type { AdapterSet } from "./AdapterFactory";
export { WebFileSystemAdapter } from "./WebFileSystemAdapter";
