/**
 * Interfaz del adaptador de persistencia.
 * Abstrae el almacenamiento de configuración para que los casos de uso
 * no dependan de localStorage, Tauri Store u otra implementación concreta.
 */
export interface IPersistenceAdapter {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}
