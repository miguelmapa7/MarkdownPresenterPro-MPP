import type { IPersistenceAdapter } from "./IPersistenceAdapter";

/**
 * Prefijo de namespace para todas las claves en localStorage.
 * Evita colisiones con datos de otras aplicaciones en el mismo dominio.
 */
const NAMESPACE_PREFIX = "mpp_";

/**
 * Claves de preferencias individuales con valores restringidos.
 * Estas claves tienen validación estricta de valores permitidos.
 */
const ALLOWED_KEYS = ["theme", "language", "dockPosition"] as const;

/**
 * Valores válidos para cada clave de preferencia individual.
 */
const VALID_VALUES: Record<string, string[]> = {
  theme: ["light", "dark"],
  language: ["es", "en"],
  dockPosition: ["top", "bottom", "left", "right"],
};

/**
 * Adaptador de persistencia usando localStorage.
 *
 * Seguridad:
 * - Prefijo `mpp_` en todas las claves (evita colisiones)
 * - Validación de valores contra opciones permitidas
 * - Degradación elegante: localStorage no disponible → valores en memoria
 * - Datos corruptos → reset a null, warning en consola
 * - Cuota excedida → continuar sin persistir, warning en consola
 */
export class LocalPersistenceAdapter implements IPersistenceAdapter {
  private fallbackStore: Map<string, string> = new Map();
  private useLocalStorage: boolean;

  constructor() {
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
    const prefixedKey = this.prefixKey(key);
    try {
      const raw = this.useLocalStorage
        ? localStorage.getItem(prefixedKey)
        : (this.fallbackStore.get(prefixedKey) ?? null);

      if (raw === null) return null;

      const parsed = JSON.parse(raw) as T;

      // Validate individual preference keys against allowed values
      if (this.isAllowedKey(key) && typeof parsed === "string") {
        const allowed = VALID_VALUES[key];
        if (allowed && !allowed.includes(parsed)) {
          console.warn(
            `[LocalPersistenceAdapter] Valor inválido para "${key}": "${parsed}", descartando`
          );
          this.remove(key);
          return null;
        }
      }

      return parsed;
    } catch {
      console.warn(
        `[LocalPersistenceAdapter] Datos corruptos para key "${key}", reseteando`
      );
      this.remove(key);
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    const prefixedKey = this.prefixKey(key);
    const raw = JSON.stringify(value);
    if (this.useLocalStorage) {
      try {
        localStorage.setItem(prefixedKey, raw);
      } catch {
        console.warn(
          "[LocalPersistenceAdapter] Cuota de localStorage excedida, guardando en memoria"
        );
        this.fallbackStore.set(prefixedKey, raw);
      }
    } else {
      this.fallbackStore.set(prefixedKey, raw);
    }
  }

  remove(key: string): void {
    const prefixedKey = this.prefixKey(key);
    if (this.useLocalStorage) {
      localStorage.removeItem(prefixedKey);
    }
    this.fallbackStore.delete(prefixedKey);
  }

  /** Antepone el prefijo de namespace si no lo tiene ya */
  private prefixKey(key: string): string {
    if (key.startsWith(NAMESPACE_PREFIX)) {
      return key;
    }
    return `${NAMESPACE_PREFIX}${key}`;
  }

  /** Verifica si la clave es una de las preferencias individuales con validación */
  private isAllowedKey(key: string): boolean {
    return (ALLOWED_KEYS as readonly string[]).includes(key);
  }
}
