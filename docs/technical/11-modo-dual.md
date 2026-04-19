# 11. Modo Dual — Escritorio y Web

## ¿Cómo funciona?

MPP se ejecuta en dos modos desde el mismo código fuente:

| Aspecto               | Modo Escritorio (Tauri)                 | Modo Web (Navegador)                      |
| --------------------- | --------------------------------------- | ----------------------------------------- |
| Empaquetado           | Tauri 2.0 (binario nativo)              | Vite (archivos estáticos)                 |
| Filesystem            | `TauriFileSystemAdapter` (disco nativo) | `WebFileSystemAdapter` (File API)         |
| Diálogos              | Tauri Dialog API (nativos del SO)       | `<input type="file">` (del navegador)     |
| Persistencia          | localStorage (WebView de Tauri)         | localStorage (navegador)                  |
| Selección de carpetas | Diálogo nativo                          | `webkitdirectory` (Chrome, Edge, Firefox) |
| Hosting               | Instalado localmente                    | AWS S3 + CloudFront                       |

## Detección de Entorno

Al iniciar, `EnvironmentDetector.isTauri()` verifica si `window.__TAURI_INTERNALS__` existe. Tauri inyecta esta propiedad automáticamente en su WebView.

## AdapterFactory

Según el entorno detectado, `createAdapters()` crea el conjunto correcto:

```
isTauri() === true  → TauriFileSystemAdapter + Tauri Dialog
isTauri() === false → WebFileSystemAdapter + <input type="file">
```

## Build Separados

| Comando             | Output                           | Incluye Tauri? |
| ------------------- | -------------------------------- | -------------- |
| `npx tauri dev`     | Dev server + ventana nativa      | Sí             |
| `npx tauri build`   | Ejecutable nativo                | Sí             |
| `npm run build:web` | `dist-web/` (archivos estáticos) | No             |

El build web usa `VITE_BUILD_TARGET=web` que configura Vite para:

- Output en `dist-web/` (separado de `dist/`)
- Excluir `@tauri-apps/*` como externals (no se incluyen en el bundle)

## Limitaciones del Modo Web

| Limitación                           | Cómo se maneja                            |
| ------------------------------------ | ----------------------------------------- |
| Sin acceso al filesystem nativo      | File API + drag & drop                    |
| `webkitdirectory` no universal       | Detectar soporte, ocultar botón si no hay |
| Imágenes con rutas absolutas locales | Placeholder informativo                   |
| Sin acceso a carpetas profundas      | Solo primer nivel de archivos             |

## Degradación Elegante

En modo web, si una funcionalidad no está disponible:

1. Se detecta la limitación
2. Se muestra un mensaje informativo al usuario
3. Se ofrece una alternativa cuando es posible
4. La app sigue funcionando sin crashear
