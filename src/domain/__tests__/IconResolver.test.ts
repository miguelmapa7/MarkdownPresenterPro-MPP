import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { IconResolver } from "@/domain";
import {
  slideMetadataWithoutIconArb,
  slideMetadataWithValidSvgArb,
  slideMetadataWithInvalidSvgArb,
} from "@//__tests__/generators/slideMetadata.gen";

describe("IconResolver", () => {
  // Feature: markdown-presenter-pro, Property 10: Correctitud de la resolución de iconos
  describe("P10: Icon resolution correctness", () => {
    it("returns custom-svg for valid SVG icon metadata", () => {
      fc.assert(
        fc.property(slideMetadataWithValidSvgArb, (metadata) => {
          const resolver = new IconResolver();
          const result = resolver.resolve(metadata);
          expect(result.type).toBe("custom-svg");
          expect(result.fallback).toBe(false);
          expect(result.content).toContain("<svg");
        }),
        { numRuns: 100 }
      );
    });

    it("returns default icon for metadata without custom icon", () => {
      fc.assert(
        fc.property(
          slideMetadataWithoutIconArb,
          fc.integer({ min: 0, max: 20 }),
          (metadata, index) => {
            const resolver = new IconResolver();
            const result = resolver.resolve(metadata, index);
            expect(result.type).toBe("default");
            expect(result.content).toContain("<svg");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("returns fallback icon with warning for invalid SVG", () => {
      fc.assert(
        fc.property(slideMetadataWithInvalidSvgArb, (metadata) => {
          const resolver = new IconResolver();
          const result = resolver.resolve(metadata);
          expect(result.type).toBe("custom-svg");
          expect(result.fallback).toBe(true);
          expect(result.warning).toBeDefined();
        }),
        { numRuns: 100 }
      );
    });

    it("content-mode returns icon matching contentType", () => {
      fc.assert(
        fc.property(slideMetadataWithoutIconArb, (metadata) => {
          const resolver = new IconResolver();
          resolver.setMode("content");
          const result = resolver.resolve(metadata);
          expect(result.type).toBe("default");
          expect(result.content).toContain("<svg");
        }),
        { numRuns: 100 }
      );
    });
  });
});
