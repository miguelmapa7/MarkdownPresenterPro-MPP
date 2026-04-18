import type { IPersistenceAdapter } from "./IPersistenceAdapter";

/**
 * Adaptador de persistencia usando localStorage.
 *
 * Degradación elegante:
 * - localStorage no disponible → valores en memoria
 * - Datos corruptos → reset a null, warning en consola
 * - Cuota excedida → continuar sin persistir, warning en consola
 */
export class LocalPersistenceAdapter implements IPersistenceAdapter {
  private fallbackStore: Map<string, string> = new Map();
  private useLocalStorage: boolean;

  constructor() {
    // Verificar si localStorage está disponible
    try {
      const testKey = "__mpp_test__";
      localStorage.setItem(testKey, "1");
      localStorage.removeItem(testKey);
      this.useLocalStorage = true;
    } catch {
      console.warn(
        "[LocalPersistenceAdapter] localStorage no disponible, usando almacenamiento en memoria"
      );
      this.useLocalStorage = false;
    }
  }

  get<T>(key: string): T | null {
    try {
      const raw = this.useLocalStorage
        ? localStorage.getItem(key)
        : (this.fallbackStore.get(key) ?? null);

      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch {
      console.warn(
        `[LocalPersistenceAdapter] Datos corruptos para key "${key}", reseteando`
      );
      this.remove(key);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    const raw = JSON.stringify(value);
    if (this.useLocalStorage) {
      try {
        localStorage.setItem(key, raw);
      } catch {
        console.warn(
          "[LocalPersistenceAdapter] Cuota de localStorage excedida, guardando en memoria"
        );
        this.fallbackStore.set(key, raw);
      }
    } else {
      this.fallbackStore.set(key, raw);
    }
  }

  remove(key: string): void {
    if (this.useLocalStorage) {
      localStorage.removeItem(key);
    }
    this.fallbackStore.delete(key);
  }
}
