import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { Presentation, Slide } from "@/domain";
import type { ISlideObserver, SlideChangedEvent } from "@/domain";

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

describe("Presentation", () => {
  // Feature: markdown-presenter-pro, Property 5: Correctitud del estado de navegación
  describe("P5: Navigation correctness", () => {
    it("next() advances index by 1 when not at last slide", () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 50 }), fc.nat(), (totalSlides, seed) => {
          const pres = createPresentation(totalSlides);
          const startIndex = seed % (totalSlides - 1); // ensure not last
          pres.goToSlide(startIndex);

          const event = pres.next();
          expect(event).not.toBeNull();
          expect(event!.currentIndex).toBe(startIndex + 1);
        }),
        { numRuns: 100 }
      );
    });

    it("previous() decreases index by 1 when not at first slide", () => {
      fc.assert(
        fc.property(fc.integer({ min: 2, max: 50 }), fc.nat(), (totalSlides, seed) => {
          const pres = createPresentation(totalSlides);
          const startIndex = (seed % (totalSlides - 1)) + 1; // ensure not first
          pres.goToSlide(startIndex);

          const event = pres.previous();
          expect(event).not.toBeNull();
          expect(event!.currentIndex).toBe(startIndex - 1);
        }),
        { numRuns: 100 }
      );
    });

    it("goToSlide(j) sets index to j for any valid j", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 50 }), fc.nat(), (totalSlides, seed) => {
          const pres = createPresentation(totalSlides);
          const targetIndex = seed % totalSlides;

          const event = pres.goToSlide(targetIndex);
          expect(event.currentIndex).toBe(targetIndex);
          expect(pres.getCurrentIndex()).toBe(targetIndex);
        }),
        { numRuns: 100 }
      );
    });

    it("next() returns null at last slide without changing index", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 50 }), (totalSlides) => {
          const pres = createPresentation(totalSlides);
          pres.goToSlide(totalSlides - 1);

          const result = pres.next();
          expect(result).toBeNull();
          expect(pres.getCurrentIndex()).toBe(totalSlides - 1);
        }),
        { numRuns: 100 }
      );
    });

    it("previous() returns null at first slide without changing index", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 50 }), (totalSlides) => {
          const pres = createPresentation(totalSlides);
          // already at index 0

          const result = pres.previous();
          expect(result).toBeNull();
          expect(pres.getCurrentIndex()).toBe(0);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: markdown-presenter-pro, Property 6: Invariante de notificación del Observer
  describe("P6: Observer notification invariant", () => {
    it("observers receive correct SlideChangedEvent on every navigation", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2, max: 30 }),
          fc.array(fc.constantFrom("next", "previous", "goTo"), {
            minLength: 1,
            maxLength: 20,
          }),
          fc.array(fc.nat(), { minLength: 1, maxLength: 20 }),
          (totalSlides, actions, seeds) => {
            const pres = createPresentation(totalSlides);
            const events: SlideChangedEvent[] = [];
            const observer: ISlideObserver = {
              onSlideChanged: (e) => events.push(e),
            };
            pres.addObserver(observer);

            for (let i = 0; i < actions.length; i++) {
              const action = actions[i]!;
              if (action === "next") {
                pres.next();
              } else if (action === "previous") {
                pres.previous();
              } else {
                const target = seeds[i % seeds.length]! % totalSlides;
                pres.goToSlide(target);
              }
            }

            // Every event should have correct currentIndex matching presentation state at that point
            for (const event of events) {
              expect(event.currentIndex).toBeGreaterThanOrEqual(0);
              expect(event.currentIndex).toBeLessThan(totalSlides);
              expect(event.totalSlides).toBe(totalSlides);
            }

            // The last event's currentIndex should match current state
            if (events.length > 0) {
              const lastEvent = events[events.length - 1]!;
              expect(lastEvent.currentIndex).toBe(pres.getCurrentIndex());
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: markdown-presenter-pro, Property 7: Invariante de cantidad de iconos del Dock
  describe("P7: Dock icon count invariant", () => {
    it("presentation has exactly N slides for any N >= 1", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 100 }), (n) => {
          const pres = createPresentation(n);
          expect(pres.getTotalSlides()).toBe(n);
          expect(pres.getSlides()).toHaveLength(n);
        }),
        { numRuns: 100 }
      );
    });
  });
});
