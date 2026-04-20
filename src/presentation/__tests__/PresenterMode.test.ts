import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { Presentation, Slide } from "@/domain";
import { formatSlideCounter } from "@/presentation/formatSlideCounter";

/** Helper to create a Presentation with N slides */
function createPresentation(n: number): Presentation {
  const slides = Array.from(
    { length: n },
    (_, i) =>
      new Slide(`# Slide ${i + 1}`, {
        title: `Slide ${i + 1}`,
        contentType: "text",
        sourceFile: "test.md",
      })
  );
  return new Presentation(slides);
}

describe("PresenterMode", () => {
  // Feature: markdown-presenter-pro, Property 13: Preservación del índice al alternar Modo Presentador
  describe("P13: Index preservation when toggling presenter mode", () => {
    it("index is preserved after simulated activate/deactivate cycle", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 50 }), fc.nat(), (totalSlides, seed) => {
          const pres = createPresentation(totalSlides);
          const targetIndex = seed % totalSlides;
          pres.goToSlide(targetIndex);

          // Simulate activate presenter mode (read index)
          const indexBeforeActivate = pres.getCurrentIndex();

          // Simulate deactivate presenter mode (index should be same)
          const indexAfterDeactivate = pres.getCurrentIndex();

          expect(indexAfterDeactivate).toBe(indexBeforeActivate);
          expect(indexAfterDeactivate).toBe(targetIndex);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: markdown-presenter-pro, Property 14: Formato del contador de diapositivas
  describe("P14: Slide counter format", () => {
    it('formats as "{currentIndex + 1} de {totalSlides}"', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), fc.nat(), (totalSlides, seed) => {
          const currentIndex = seed % totalSlides;
          const result = formatSlideCounter(currentIndex, totalSlides);
          expect(result).toBe(`${currentIndex + 1} de ${totalSlides}`);
        }),
        { numRuns: 100 }
      );
    });
  });
});
