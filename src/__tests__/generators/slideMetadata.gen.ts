/**
 * Generador fast-check de SlideMetadata para tests de propiedades.
 */
import fc from "fast-check";
import type { SlideMetadata, SlideContentType } from "@/domain";

const contentTypeArb: fc.Arbitrary<SlideContentType> = fc.constantFrom(
  "code",
  "image",
  "text",
  "table",
  "mixed"
);

/** Genera SlideMetadata sin icono personalizado */
export const slideMetadataWithoutIconArb: fc.Arbitrary<SlideMetadata> = fc
  .tuple(fc.lorem({ maxCount: 3 }), contentTypeArb)
  .map(([title, contentType]) => ({
    title,
    contentType,
    sourceFile: "test.md",
  }));

/** Genera SlideMetadata con un SVG personalizado válido */
export const slideMetadataWithValidSvgArb: fc.Arbitrary<SlideMetadata> = fc
  .tuple(fc.lorem({ maxCount: 3 }), contentTypeArb)
  .map(([title, contentType]) => ({
    title,
    contentType,
    sourceFile: "test.md",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>`,
  }));

/** Genera SlideMetadata con un SVG inválido */
export const slideMetadataWithInvalidSvgArb: fc.Arbitrary<SlideMetadata> = fc
  .tuple(fc.lorem({ maxCount: 3 }), contentTypeArb)
  .map(([title, contentType]) => ({
    title,
    contentType,
    sourceFile: "test.md",
    icon: "not-a-valid-svg",
  }));

/** Genera SlideMetadata con cualquier variante de icono */
export const slideMetadataArb: fc.Arbitrary<SlideMetadata> = fc.oneof(
  slideMetadataWithoutIconArb,
  slideMetadataWithValidSvgArb,
  slideMetadataWithInvalidSvgArb
);
