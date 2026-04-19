# 7. Capa de Infraestructura — Adaptadores

La capa de infraestructura contiene las implementaciones concretas de las interfaces definidas en las capas internas. Es la única capa que "sabe" sobre tecnologías externas (Tauri, localStorage, File API).

## EnvironmentDetector (`src/infrastructure/EnvironmentDetector.ts`)

Detecta si MPP se ejecuta dentro de Tauri o en un navegador web.

### ¿Cómo funciona?

Verifica la presencia de `window.__TAURI_INTERNALS__`, una propiedad que Tauri inyecta automáticamente en el contexto global del WebView. Si existe → modo escritorio. Si no → modo web.

```typescript
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
```

La detección es síncrona y toma menos de 1ms.

## AdapterFactory (`src/infrastructure/AdapterFactory.ts`)

Crea el conjunto correcto de adaptadores según el entorno detectado.

### ¿Por qué import dinámico para Tauri?

```typescript
if (isTauri()) {
  const { TauriFileSystemAdapter } = await import("./TauriFileSystemAdapter");
  // ...
}
```

El `import()` dinámico permite que Vite haga **tree-shaking**: cuando construyes la versión web (`build:web`), el código de Tauri no se incluye en el bundle porque nunca se importa estáticamente. Esto reduce el tamaño del bundle web.

## TauriFileSystemAdapter (`src/infrastructure/TauriFileSystemAdapter.ts`)

Implementa `IFileSystemAdapter` usando la API de Tauri (`@tauri-apps/plugin-fs`).

### Operaciones:

- `readFile(path)`: Lee un archivo del disco usando `readTextFile()` de Tauri
- `readDirectory(path)`: Lista archivos de un directorio usando `readDir()` de Tauri
- `exists(path)`: Verifica existencia usando `exists()` de Tauri

### Sistema de permisos:

Tauri 2.0 usa un sistema de **capabilities** (permisos). El archivo `src-tauri/capabilities/default.json` define qué operaciones puede hacer la ventana principal. Sin el permiso `fs:allow-read-file`, la app no puede leer archivos.

## WebFileSystemAdapter (`src/infrastructure/WebFileSystemAdapter.ts`)

Implementa `IFileSystemAdapter` usando la API File del navegador.

### ¿Cómo funciona?

A diferencia de Tauri (que accede al disco directamente), el navegador no puede leer archivos arbitrarios. El usuario debe seleccionarlos explícitamente. El flujo es:

1. El usuario selecciona archivos via `<input type="file">` o drag & drop
2. `WebPresentationLoader` llama a `webFs.setFiles(fileList)` para registrar los archivos en memoria
3. Los casos de uso llaman a `readFile(path)` que busca el archivo en el `Map` interno

### Validaciones:

- Tipo MIME: Solo acepta `text/plain`, `text/markdown`, `text/x-markdown` o extensiones `.md`, `.markdown`, `.txt`
- Tamaño: Máximo 10 MB por archivo
- Archivos no registrados: Lanza error "Archivo no encontrado"

## LocalPersistenceAdapter (`src/infrastructure/LocalPersistenceAdapter.ts`)

Implementa `IPersistenceAdapter` usando `localStorage` del navegador.

### Degradación elegante:

- localStorage no disponible → usa `Map` en memoria
- Datos corruptos → resetea a `null`, registra warning
- Cuota excedida → guarda en memoria, registra warning

Funciona igual en modo escritorio (Tauri usa WebView que tiene localStorage) y en modo web.
