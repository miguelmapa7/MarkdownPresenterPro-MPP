import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { ConfigurationUseCase } from "@/application";
import type { DockPosition, SupportedLocale } from "@/application";
import type { IPersistenceAdapter } from "@/infrastructure/IPersistenceAdapter";

/** Creates an in-memory persistence adapter for testing */
function createMemoryAdapter(): IPersistenceAdapter {
  const store = new Map<string, string>();
  return {
    get<T>(key: string): T | null {
      const raw = store.get(key);
      if (raw === undefined) return null;
      try {
        return JSON.parse(raw) as T;
      } catch {
        return null;
      }
    },
    set<T>(key: string, value: T): void {
      store.set(key, JSON.stringify(value));
    },
    remove(key: string): void {
      store.delete(key);
    },
  };
}

describe("ConfigurationUseCase", () => {
  // Feature: markdown-presenter-pro, Property 8: Round-trip de persistencia de posición del Dock
  describe("P8: Dock position persistence round-trip", () => {
    it("setDockPosition then getDockPosition returns the same position", () => {
      fc.assert(
        fc.property(
          fc.constantFrom<DockPosition>("top", "bottom", "left", "right"),
          (position) => {
            const adapter = createMemoryAdapter();
            const config = new ConfigurationUseCase(adapter);

            config.setDockPosition(position);
            expect(config.getDockPosition()).toBe(position);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: markdown-presenter-pro, Property 15: Round-trip de persistencia de tema
  describe("P15: Theme persistence round-trip", () => {
    it("setTheme then getTheme returns the same theme", () => {
      fc.assert(
        fc.property(fc.constantFrom<"light" | "dark">("light", "dark"), (theme) => {
          const adapter = createMemoryAdapter();
          const config = new ConfigurationUseCase(adapter);

          config.setTheme(theme);
          expect(config.getTheme()).toBe(theme);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: markdown-presenter-pro, Property 16: Round-trip de persistencia de idioma
  describe("P16: Locale persistence round-trip", () => {
    it("setLocale then getLocale returns the same locale", () => {
      fc.assert(
        fc.property(fc.constantFrom<SupportedLocale>("es", "en"), (locale) => {
          const adapter = createMemoryAdapter();
          const config = new ConfigurationUseCase(adapter);

          config.setLocale(locale);
          expect(config.getLocale()).toBe(locale);
        }),
        { numRuns: 100 }
      );
    });
  });
});
