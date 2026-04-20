/**
 * Módulo centralizado de validación de entradas.
 *
 * Consolida todas las validaciones de seguridad para archivos y datos
 * proporcionados por el usuario: extensión, tamaño, MIME, path traversal,
 * caracteres de control, codificación UTF-8 y URLs de imágenes.
 *
 * Patrón: Value Object para ValidationResult, módulo stateless para validaciones.
 */

// ---------------------------------------------------------------------------
// Constantes de validación
// ---------------------------------------------------------------------------

/** Extensiones de archivo permitidas */
export const ALLOWED_EXTENSIONS = [".md", ".markdown", ".txt"] as const;

/** Tamaño máximo de archivo: 10 MB */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Tipos MIME aceptados */
export const ALLOWED_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "text/x-markdown",
] as const;

/** Máximo de archivos por operación de carga */
export const MAX_FILE_COUNT = 100;

/** Secuencias de traversal de rutas prohibidas */
const TRAVERSAL_PATTERNS = ["../", "..\\", "%2e%2e", "%2E%2E"];

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface IInputValidator {
  validateFileExtension(filename: string): ValidationResult;
  validateFileSize(sizeBytes: number): ValidationResult;
  validateMimeType(mimeType: string, filename: string): ValidationResult;
  validatePath(path: string): ValidationResult;
  validateFilename(filename: string): ValidationResult;
  validateFileCount(count: number): ValidationResult;
  validateUtf8(content: ArrayBuffer): ValidationResult;
  validateImageUrl(url: string): ValidationResult;
}

// ---------------------------------------------------------------------------
// Implementación
// ---------------------------------------------------------------------------

export class InputValidator implements IInputValidator {
  /**
   * Valida que la extensión del archivo sea .md, .markdown o .txt (case-insensitive).
   */
  validateFileExtension(filename: string): ValidationResult {
    const ext = this.extractExtension(filename);
    const allowed = ALLOWED_EXTENSIONS as readonly string[];
    if (allowed.includes(ext)) {
      return { valid: true };
    }
    return {
      valid: false,
      error: `Tipo de archivo no soportado: ${ext || "(sin extensión)"}. Solo se aceptan .md, .markdown y .txt`,
    };
  }

  /**
   * Valida que el tamaño del archivo no exceda 10 MB.
   */
  validateFileSize(sizeBytes: number): ValidationResult {
    if (sizeBytes === 0) {
      return {
        valid: false,
        error: "El archivo no contiene contenido para presentar",
      };
    }
    if (sizeBytes > MAX_FILE_SIZE) {
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `El archivo excede el tamaño máximo de 10 MB (${sizeMB} MB)`,
      };
    }
    return { valid: true };
  }

  /**
   * Valida el tipo MIME en modo web. Acepta MIME compatible O extensión válida.
   */
  validateMimeType(mimeType: string, filename: string): ValidationResult {
    const allowedMimes = ALLOWED_MIME_TYPES as readonly string[];
    if (allowedMimes.includes(mimeType)) {
      return { valid: true };
    }
    // Fallback: si el MIME no coincide, verificar extensión
    const ext = this.extractExtension(filename);
    const allowedExts = ALLOWED_EXTENSIONS as readonly string[];
    if (allowedExts.includes(ext)) {
      return { valid: true };
    }
    return {
      valid: false,
      error: `Tipo de archivo no soportado: ${mimeType || "desconocido"}. Solo se aceptan archivos de texto/markdown`,
    };
  }

  /**
   * Detecta secuencias de traversal de rutas en la ruta del archivo.
   */
  validatePath(path: string): ValidationResult {
    const decodedPath = this.decodePathSafe(path);
    for (const pattern of TRAVERSAL_PATTERNS) {
      if (decodedPath.includes(pattern) || path.includes(pattern)) {
        return {
          valid: false,
          error: "Ruta de archivo no permitida: se detectó una secuencia de traversal",
        };
      }
    }
    return { valid: true };
  }

  /**
   * Rechaza nombres de archivo con caracteres nulos o de control
   * (ASCII 0-31 excepto \t (9), \r (13), \n (10)).
   */
  validateFilename(filename: string): ValidationResult {
    for (let i = 0; i < filename.length; i++) {
      const code = filename.charCodeAt(i);
      if (code >= 0 && code <= 31 && code !== 9 && code !== 10 && code !== 13) {
        return {
          valid: false,
          error: "Nombre de archivo contiene caracteres no permitidos",
        };
      }
    }
    return { valid: true };
  }

  /**
   * Valida que no se excedan 100 archivos por operación de carga.
   */
  validateFileCount(count: number): ValidationResult {
    if (count > MAX_FILE_COUNT) {
      return {
        valid: false,
        error: `Se excedió el límite de 100 archivos por operación (${count} archivos seleccionados)`,
      };
    }
    return { valid: true };
  }

  /**
   * Verifica que el contenido sea UTF-8 válido.
   */
  validateUtf8(content: ArrayBuffer): ValidationResult {
    const bytes = new Uint8Array(content);
    let i = 0;
    while (i < bytes.length) {
      const byte = bytes[i]!;

      if (byte <= 0x7f) {
        // ASCII — 1 byte
        i++;
        continue;
      }

      let expectedContinuation: number;
      if ((byte & 0xe0) === 0xc0) {
        expectedContinuation = 1;
      } else if ((byte & 0xf0) === 0xe0) {
        expectedContinuation = 2;
      } else if ((byte & 0xf8) === 0xf0) {
        expectedContinuation = 3;
      } else {
        return {
          valid: false,
          error: "El archivo contiene codificación no soportada. Solo se acepta UTF-8",
        };
      }

      // Verify continuation bytes
      for (let j = 1; j <= expectedContinuation; j++) {
        if (i + j >= bytes.length || (bytes[i + j]! & 0xc0) !== 0x80) {
          return {
            valid: false,
            error: "El archivo contiene codificación no soportada. Solo se acepta UTF-8",
          };
        }
      }
      i += 1 + expectedContinuation;
    }
    return { valid: true };
  }

  /**
   * Valida que las URLs de imágenes usen solo https: o data:image/*.
   */
  validateImageUrl(url: string): ValidationResult {
    const trimmed = url.trim();
    if (trimmed.startsWith("https://") || trimmed.startsWith("https:")) {
      return { valid: true };
    }
    if (trimmed.startsWith("data:image/")) {
      return { valid: true };
    }
    return {
      valid: false,
      error: `URL de imagen no permitida: solo se aceptan esquemas https: y data:image/*`,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------

  private extractExtension(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    if (lastDot === -1) return "";
    return filename.slice(lastDot).toLowerCase();
  }

  private decodePathSafe(path: string): string {
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  }
}
