import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";
import { LocalPersistenceAdapter } from "@/infrastructure/LocalPersistenceAdapter";

describe("Security: Local Storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Feature: security-testing, Property 12: Round-trip de almacenamiento local con validación
  describe("Round-trip with validation", () => {
    it("round-trips valid theme values correctly", () => {
      fc.assert(
        fc.property(fc.constantFrom("light", "dark"), (theme) => {
          const adapter = new LocalPersistenceAdapter();
          adapter.set("theme", theme);
          const result = adapter.get<string>("theme");
          expect(result).toBe(theme);
        }),
        { numRuns: 100 }
      );
    });

    it("round-trips valid language values correctly", () => {
      fc.assert(
        fc.property(fc.constantFrom("es", "en"), (language) => {
          const adapter = new LocalPersistenceAdapter();
          adapter.set("language", language);
          const result = adapter.get<string>("language");
          expect(result).toBe(language);
        }),
        { numRuns: 100 }
      );
    });

    it("round-trips valid dockPosition values correctly", () => {
      fc.assert(
        fc.property(fc.constantFrom("top", "bottom", "left", "right"), (position) => {
          const adapter = new LocalPersistenceAdapter();
          adapter.set("dockPosition", position);
          const result = adapter.get<string>("dockPosition");
          expect(result).toBe(position);
        }),
        { numRuns: 100 }
      );
    });

    it("returns null for invalid theme values", () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => s !== "light" && s !== "dark"),
          (invalidTheme) => {
            const adapter = new LocalPersistenceAdapter();
            // Manually write an invalid value to localStorage
            localStorage.setItem("mpp_theme", JSON.stringify(invalidTheme));
            const result = adapter.get<string>("theme");
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("uses mpp_ prefix for all keys", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("theme", "language", "dockPosition"),
          fc.constantFrom("light", "es", "top"),
          (key, value) => {
            localStorage.clear();
            const adapter = new LocalPersistenceAdapter();
            adapter.set(key, value);

            // The key in localStorage should have the mpp_ prefix
            const prefixedKey = `mpp_${key}`;
            const raw = localStorage.getItem(prefixedKey);
            expect(raw).not.toBeNull();
            expect(JSON.parse(raw!)).toBe(value);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("handles corrupted JSON gracefully", () => {
      fc.assert(
        fc.property(fc.constantFrom("theme", "language", "dockPosition"), (key) => {
          localStorage.setItem(`mpp_${key}`, "not-valid-json{{{");
          const adapter = new LocalPersistenceAdapter();
          const result = adapter.get<string>(key);
          expect(result).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });
});
