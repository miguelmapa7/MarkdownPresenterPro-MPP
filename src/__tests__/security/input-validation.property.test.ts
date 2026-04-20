import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  InputValidator,
  MAX_FILE_SIZE,
  MAX_FILE_COUNT,
} from "@/infrastructure/InputValidator";

const validator = new InputValidator();

describe("Security: Input Validation", () => {
  // Feature: security-testing, Property 3: Validación de extensión de archivo
  describe("File extension validation", () => {
    it("accepts files with .md, .markdown, .txt extensions", () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.constantFrom(".md", ".markdown", ".txt", ".MD", ".Markdown", ".TXT"),
          (name, ext) => {
            const result = validator.validateFileExtension(`${name}${ext}`);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects files with unsupported extensions", () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 20 })
            .filter((s) => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.constantFrom(".js", ".py", ".html", ".exe", ".pdf", ".doc", ".zip"),
          (name, ext) => {
            const result = validator.validateFileExtension(`${name}${ext}`);
            expect(result.valid).toBe(false);
            expect(result.error).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: security-testing, Property 4: Validación de tamaño de archivo
  describe("File size validation", () => {
    it("accepts files within 10 MB limit", () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: MAX_FILE_SIZE }), (size) => {
          const result = validator.validateFileSize(size);
          expect(result.valid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects files exceeding 10 MB", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MAX_FILE_SIZE + 1, max: MAX_FILE_SIZE * 10 }),
          (size) => {
            const result = validator.validateFileSize(size);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("10 MB");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: security-testing, Property 6: Prevención de traversal de rutas
  describe("Path traversal prevention", () => {
    it("rejects paths containing traversal sequences", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("../", "..\\", "%2e%2e", "%2E%2E"),
          fc
            .string({ minLength: 0, maxLength: 10 })
            .filter((s) => /^[a-zA-Z0-9/]*$/.test(s)),
          (traversal, suffix) => {
            const path = `some/path/${traversal}${suffix}`;
            const result = validator.validatePath(path);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("traversal");
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: security-testing, Property 7: Rechazo de caracteres de control
  describe("Filename control character rejection", () => {
    it("rejects filenames with null bytes and control characters", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 8 }), // control chars excluding \t(9), \n(10), \r(13)
          (charCode) => {
            const filename = `file${String.fromCharCode(charCode)}name.md`;
            const result = validator.validateFilename(filename);
            expect(result.valid).toBe(false);
            expect(result.error).toContain("caracteres no permitidos");
          }
        ),
        { numRuns: 100 }
      );
    });

    it("accepts filenames with normal characters", () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 30 })
            .filter((s) => /^[a-zA-Z0-9._-]+$/.test(s)),
          (filename) => {
            const result = validator.validateFilename(filename);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: security-testing, Property 8: Límite de archivos por carga
  describe("File count limit", () => {
    it("accepts counts up to 100", () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: MAX_FILE_COUNT }), (count) => {
          const result = validator.validateFileCount(count);
          expect(result.valid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it("rejects counts over 100", () => {
      fc.assert(
        fc.property(fc.integer({ min: MAX_FILE_COUNT + 1, max: 10000 }), (count) => {
          const result = validator.validateFileCount(count);
          expect(result.valid).toBe(false);
          expect(result.error).toContain("100");
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: security-testing, Property 9: Validación de tipo MIME
  describe("MIME type validation", () => {
    it("accepts valid MIME types", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("text/plain", "text/markdown", "text/x-markdown"),
          (mime) => {
            const result = validator.validateMimeType(mime, "file.md");
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("accepts files with valid extension even if MIME is wrong", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("application/octet-stream", "application/pdf"),
          fc.constantFrom("file.md", "file.markdown", "file.txt"),
          (mime, filename) => {
            const result = validator.validateMimeType(mime, filename);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects files with invalid MIME and invalid extension", () => {
      fc.assert(
        fc.property(
          fc.constantFrom("application/pdf", "image/png", "application/zip"),
          fc.constantFrom("file.exe", "file.pdf", "file.zip"),
          (mime, filename) => {
            const result = validator.validateMimeType(mime, filename);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  // Feature: security-testing, Property 14: Validación HTTPS para recursos externos
  describe("Image URL validation", () => {
    it("accepts HTTPS URLs", () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 30 })
            .filter((s) => /^[a-zA-Z0-9./-]+$/.test(s)),
          (path) => {
            const url = `https://example.com/${path}`;
            const result = validator.validateImageUrl(url);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("accepts data:image/* URLs", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "data:image/png;base64,iVBOR",
            "data:image/jpeg;base64,/9j/4",
            "data:image/gif;base64,R0lGOD",
            "data:image/svg+xml;base64,PHN2"
          ),
          (url) => {
            const result = validator.validateImageUrl(url);
            expect(result.valid).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("rejects non-HTTPS and non-data:image URLs", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            "http://example.com/img.png",
            "ftp://files.com/img.png",
            "file:///etc/passwd",
            "javascript:alert(1)",
            "data:text/html,<script>alert(1)</script>"
          ),
          (url) => {
            const result = validator.validateImageUrl(url);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
