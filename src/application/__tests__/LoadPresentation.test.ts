import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { LoadPresentationUseCase } from "@/application";
import { MarkdownParser } from "@/domain";
import type { IFileSystemAdapter, FileEntry } from "@/infrastructure/IFileSystemAdapter";

const parser = new MarkdownParser();

describe("LoadPresentationUseCase", () => {
  // Feature: markdown-presenter-pro, Property 11: Correctitud de la división de diapositivas
  describe("P11: Slide splitting correctness", () => {
    it(
      "N separators produce N+1 slides (or N if starts with separator)",
      { timeout: 30000 },
      () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 1, max: 10 }),
            fc.array(fc.lorem({ maxCount: 8 }), { minLength: 2, maxLength: 11 }),
            (separatorCount, paragraphs) => {
              // Build markdown with exactly separatorCount separators
              const sections = paragraphs.slice(0, separatorCount + 1);
              if (sections.length < separatorCount + 1) return; // skip if not enough

              const markdown = sections.join("\n\n---\n\n");

              const mockFs: IFileSystemAdapter = {
                readFile: async () => markdown,
                readDirectory: async () => [],
                exists: async () => true,
              };

              const useCase = new LoadPresentationUseCase(mockFs, parser);
              const slides = useCase.splitIntoSlides(markdown, "test.md");

              // Each non-empty section becomes a slide
              const nonEmptySections = sections.filter((s) => s.trim().length > 0);
              expect(slides.length).toBe(nonEmptySections.length);
              expect(slides.length).toBeGreaterThan(0);
            }
          ),
          { numRuns: 100 }
        );
      }
    );

    it("each slide contains content from its section", { timeout: 30000 }, () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.lorem({ minCount: 1, maxCount: 5 }).filter((s) => s.trim().length > 0),
            { minLength: 2, maxLength: 5 }
          ),
          (sections) => {
            const markdown = sections.join("\n\n---\n\n");
            const mockFs: IFileSystemAdapter = {
              readFile: async () => markdown,
              readDirectory: async () => [],
              exists: async () => true,
            };

            const useCase = new LoadPresentationUseCase(mockFs, parser);
            const slides = useCase.splitIntoSlides(markdown, "test.md");

            // Each slide should have non-empty rawMarkdown
            for (const slide of slides) {
              expect(slide.getRawMarkdown().trim().length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: markdown-presenter-pro, Property 12: Filtrado y ordenamiento de archivos en directorio
  describe("P12: Directory filtering and ordering", () => {
    it(
      "only includes .md files and orders alphabetically",
      { timeout: 30000 },
      async () => {
        await fc.assert(
          fc.asyncProperty(
            fc.array(
              fc.tuple(
                fc
                  .string({ minLength: 1, maxLength: 10 })
                  .filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
                fc.constantFrom(".md", ".txt", ".js", ".py", ".html", ".css", ".json")
              ),
              { minLength: 1, maxLength: 15 }
            ),
            async (fileSpecs) => {
              const entries: FileEntry[] = fileSpecs.map(([name, ext]) => ({
                name: `${name}${ext}`,
                path: `dir/${name}${ext}`,
                isDirectory: false,
                extension: ext,
              }));

              const mdEntries = entries.filter((e) => e.extension === ".md");

              const mockFs: IFileSystemAdapter = {
                readFile: async () => "# Test\n\nContent",
                readDirectory: async () => entries,
                exists: async () => true,
              };

              const useCase = new LoadPresentationUseCase(mockFs, parser);
              const result = await useCase.execute({
                path: "dir",
                type: "directory",
              });

              if (mdEntries.length === 0) {
                expect(result.success).toBe(false);
              } else {
                expect(result.success).toBe(true);
                expect(result.presentation).toBeDefined();
                // Number of slides should equal number of .md files
                expect(result.presentation!.getTotalSlides()).toBe(mdEntries.length);

                // Slides should be in alphabetical order by source file name
                const slideNames = result
                  .presentation!.getSlides()
                  .map((s) => s.getMetadata().sourceFile);
                const sorted = [...slideNames].sort((a, b) => {
                  const nameA = a.split("/").pop() ?? a;
                  const nameB = b.split("/").pop() ?? b;
                  return nameA.localeCompare(nameB);
                });
                expect(slideNames).toEqual(sorted);
              }
            }
          ),
          { numRuns: 100 }
        );
      }
    );
  });
});
