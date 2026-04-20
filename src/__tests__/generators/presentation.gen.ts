/**
 * Generador fast-check de Presentation y Slide para tests de propiedades.
 */
import fc from "fast-check";
import { Slide, Presentation } from "@/domain";
import type { SlideMetadata, SlideContentType } from "@/domain";

const contentTypeArb: fc.Arbitrary<SlideContentType> = fc.constantFrom(
  "code",
  "image",
  "text",
  "table",
  "mixed"
);

const slideMetadataArb: fc.Arbitrary<SlideMetadata> = fc
  .tuple(fc.lorem({ maxCount: 3 }), contentTypeArb)
  .map(([title, contentType]) => ({
    title,
    contentType,
    sourceFile: "test.md",
  }));

/** Genera un Slide con Markdown simple */
export const slideArb: fc.Arbitrary<Slide> = fc
  .tuple(fc.lorem({ maxCount: 10 }), slideMetadataArb)
  .map(([md, meta]) => new Slide(md, meta));

/** Genera una Presentation con N slides (mínimo 1) */
export const presentationArb = (
  minSlides = 1,
  maxSlides = 20
): fc.Arbitrary<Presentation> =>
  fc
    .array(slideArb, { minLength: minSlides, maxLength: maxSlides })
    .map((slides) => new Presentation(slides));

/** Genera un índice válido para una presentación de tamaño N */
export const validIndexArb = (totalSlides: number): fc.Arbitrary<number> =>
  fc.integer({ min: 0, max: totalSlides - 1 });
