# Plan de Implementación: Despliegue Web de Markdown Presenter Pro

## Visión General

Implementación incremental del modo dual (Tauri + Web) para MPP. Se comienza con la infraestructura de detección de entorno y adaptadores, luego los componentes de UI web, configuración de build, y finalmente despliegue en AWS. Cada tarea construye sobre la anterior para evitar código huérfano.

## Tareas

- [ ] 1. Crear EnvironmentDetector y AdapterFactory
  - [ ] 1.1 Crear `src/infrastructure/EnvironmentDetector.ts` con las funciones `isTauri()` y `getEnvironment()`
    - Implementar detección síncrona verificando `window.__TAURI_INTERNALS__`
    - Exportar el tipo `RuntimeEnvironment = "tauri" | "web"`
    - _Requerimientos: 1.1, 1.4, 1.5_

  - [ ]\* 1.2 Escribir prueba basada en propiedades para EnvironmentDetector
    - **Propiedad 1: Correctitud de la detección de entorno**
    - **Valida: Requerimiento 1.1**
    - Generar objetos window-like con y sin `__TAURI_INTERNALS__` usando fast-check
    - Verificar que `isTauri()` retorna `true` si y solo si la propiedad está presente

  - [ ] 1.3 Crear `src/infrastructure/AdapterFactory.ts` con la función `createAdapters()`
    - Definir la interfaz `AdapterSet` con `fileSystem`, `isWeb` y `webFileSystem` opcional
    - En modo Tauri: usar import dinámico de `TauriFileSystemAdapter`
    - En modo Web: instanciar `WebFileSystemAdapter` directamente
    - _Requerimientos: 1.2, 1.3_

  - [ ]\* 1.4 Escribir pruebas unitarias para AdapterFactory
    - Mock de `isTauri()` para ambos modos
    - Verificar que retorna `TauriFileSystemAdapter` en modo escritorio
    - Verificar que retorna `WebFileSystemAdapter` en modo web
    - _Requerimientos: 1.2, 1.3_

  - [ ] 1.5 Exportar los nuevos módulos desde `src/infrastructure/index.ts`
    - Agregar exports de `EnvironmentDetector` y `AdapterFactory`
    - _Requerimientos: 1.1, 1.2, 1.3_

- [ ] 2. Implementar WebFileSystemAdapter
  - [ ] 2.1 Crear `src/infrastructure/WebFileSystemAdapter.ts` implementando `IFileSystemAdapter`
    - Implementar `Map<string, File>` interno para almacenar archivos
    - Implementar `setFiles(fileList)` para registrar archivos del usuario
    - Implementar `readFile(path)` con validación de tipo MIME y tamaño (máx 10 MB)
    - Implementar `readDirectory(path)` con retorno de `FileEntry[]` ordenado alfabéticamente
    - Implementar `exists(path)` verificando presencia en el Map interno
    - Implementar métodos auxiliares `getLoadedFiles()`, `clear()`, `isTextFile()`, `isInDirectory()`
    - _Requerimientos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]\* 2.2 Escribir prueba basada en propiedades: round-trip de lectura
    - **Propiedad 2: Round-trip de lectura de archivos web**
    - **Valida: Requerimientos 2.2, 7.4**
    - Generar contenido de texto arbitrario y nombres de archivo `.md` con fast-check
    - Verificar que `setFiles()` + `readFile()` retorna exactamente el contenido original

  - [ ]\* 2.3 Escribir prueba basada en propiedades: metadatos y ordenamiento de readDirectory
    - **Propiedad 3: Correctitud de metadatos y ordenamiento en readDirectory**
    - **Valida: Requerimientos 2.3, 3.6**
    - Generar conjuntos de `File` con nombres y extensiones variados
    - Verificar que las entradas retornadas tienen nombre, ruta, extensión correctos y están ordenadas alfabéticamente

  - [ ]\* 2.4 Escribir prueba basada en propiedades: verificación de existencia
    - **Propiedad 4: Correctitud de verificación de existencia**
    - **Valida: Requerimiento 2.4**
    - Generar conjuntos de archivos registrados y rutas de consulta (registradas y no registradas)
    - Verificar que `exists()` retorna `true` solo para rutas registradas

  - [ ]\* 2.5 Escribir prueba basada en propiedades: rechazo de archivos no soportados
    - **Propiedad 5: Rechazo de archivos no soportados**
    - **Valida: Requerimiento 2.5**
    - Generar `File` con tipos MIME no-texto y extensiones no-markdown
    - Verificar que `readFile()` lanza error con mensaje descriptivo

- [ ] 3. Checkpoint — Verificar adaptadores e infraestructura base
  - Asegurar que todas las pruebas pasan con `npm test`, consultar al usuario si surgen dudas.

- [ ] 4. Crear componentes de presentación web
  - [ ] 4.1 Crear `src/presentation/WebPresentationLoader.tsx`
    - Implementar inputs ocultos: uno para archivo `.md` (`accept=".md,.markdown"`) y otro para carpeta (`webkitdirectory`)
    - Implementar zona de drag & drop que lea contenido via File API
    - Detectar soporte de `webkitdirectory` y ocultar botón de carpeta si no está soportado, mostrando mensaje informativo
    - Soportar selección múltiple de archivos `.md` con atributo `multiple`
    - Reutilizar estilos visuales del `PresentationLoader` existente
    - _Requerimientos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 7.3_

  - [ ]\* 4.2 Escribir pruebas unitarias para WebPresentationLoader
    - Verificar atributo `accept=".md,.markdown"` en input de archivo
    - Verificar atributo `webkitdirectory` en input de carpeta
    - Simular drag & drop de archivo `.md` y verificar callback `onLoad`
    - Simular navegador sin soporte `webkitdirectory` y verificar botón oculto con mensaje
    - _Requerimientos: 3.1, 3.2, 3.3, 3.5_

  - [ ] 4.3 Crear `src/presentation/WebModeBadge.tsx`
    - Implementar badge sutil que muestre "Web" en la esquina inferior izquierda
    - Aceptar prop `className` opcional para personalización
    - _Requerimiento: 7.1_

  - [ ]\* 4.4 Escribir pruebas unitarias para WebModeBadge
    - Verificar que el badge se renderiza con el texto "Web"
    - Verificar que acepta className personalizado
    - _Requerimiento: 7.1_

- [ ] 5. Agregar claves i18n para mensajes web
  - Agregar claves en `src/i18n/locales/es.json` y `src/i18n/locales/en.json` para:
    - `web.badge`: "Web" / "Web"
    - `web.openFile`: "Seleccionar archivo .md" / "Select .md file"
    - `web.openFolder`: "Seleccionar carpeta" / "Select folder"
    - `web.dragHint`: "Arrastra archivos .md aquí o usa los botones" / "Drag .md files here or use the buttons"
    - `web.folderNotSupported`: "La selección de carpetas requiere Chrome, Edge o Firefox" / "Folder selection requires Chrome, Edge or Firefox"
    - `web.desktopOnly`: "Esta funcionalidad requiere la versión de escritorio" / "This feature requires the desktop version"
    - `web.localImagePlaceholder`: "Imagen local no disponible en modo web" / "Local image not available in web mode"
    - `web.unsupportedFileType`: "Tipo de archivo no soportado. Solo se aceptan archivos .md, .markdown y .txt" / "Unsupported file type. Only .md, .markdown and .txt files are accepted"
  - _Requerimientos: 7.1, 7.2, 7.3, 7.5_

- [ ] 6. Integrar componentes web en App.tsx
  - [ ] 6.1 Modificar `src/App.tsx` para usar AdapterFactory
    - Agregar estado `adapters: AdapterSet | null` con `useState`
    - Inicializar adaptadores con `createAdapters()` en `useEffect`
    - Refactorizar `handleLoad` para usar `adapters.fileSystem` en lugar del import dinámico de Tauri
    - Mostrar pantalla de carga mientras `adapters` es `null`
    - _Requerimientos: 1.2, 1.3, 2.1_

  - [ ] 6.2 Agregar renderizado condicional de loaders y badge en App.tsx
    - Renderizar `WebPresentationLoader` cuando `adapters.isWeb === true`
    - Renderizar `PresentationLoader` existente cuando `adapters.isWeb === false`
    - Mostrar `WebModeBadge` solo en modo web
    - _Requerimientos: 3.1, 7.1_

  - [ ] 6.3 Implementar degradación elegante para imágenes locales
    - Detectar rutas absolutas de imágenes (`/home/...`, `C:\...`) en el HTML renderizado
    - Reemplazar con placeholder informativo usando la clave i18n `web.localImagePlaceholder`
    - Permitir imágenes con URLs remotas (HTTP/HTTPS) sin modificación
    - _Requerimientos: 7.5, 7.6_

  - [ ]\* 6.4 Escribir pruebas unitarias para la integración en App.tsx
    - Verificar que en modo web se renderiza `WebPresentationLoader`
    - Verificar que en modo escritorio se renderiza `PresentationLoader`
    - Verificar que `WebModeBadge` solo aparece en modo web
    - Verificar placeholder para imágenes locales en modo web
    - _Requerimientos: 7.1, 7.5, 7.6_

- [ ] 7. Checkpoint — Verificar integración de componentes web
  - Asegurar que todas las pruebas pasan con `npm test`, consultar al usuario si surgen dudas.

- [ ] 8. Configurar build web con Vite
  - [ ] 8.1 Modificar `vite.config.ts` para soportar build web
    - Leer variable de entorno `VITE_BUILD_TARGET`
    - Cuando `VITE_BUILD_TARGET=web`: output en `dist-web`, excluir `@tauri-apps/api`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog` como externals
    - Mantener configuración existente intacta para build Tauri
    - _Requerimientos: 5.1, 5.3, 5.4_

  - [ ] 8.2 Agregar script `build:web` en `package.json`
    - Agregar `"build:web": "VITE_BUILD_TARGET=web tsc && VITE_BUILD_TARGET=web vite build"`
    - _Requerimiento: 5.2_

  - [ ]\* 8.3 Escribir prueba de integración para el build web
    - Verificar que `dist-web/index.html` se genera correctamente
    - Verificar que el bundle no contiene referencias a `@tauri-apps`
    - _Requerimientos: 5.1, 5.4, 5.5_

- [ ] 9. Configurar infraestructura AWS (S3 + CloudFront)
  - [ ] 9.1 Crear bucket S3 para hosting estático
    - Proporcionar comandos AWS CLI paso a paso para:
      - Crear bucket S3 con nombre único
      - Bloquear acceso público al bucket
      - Configurar política de bucket para acceso solo via CloudFront OAC
    - _Requerimientos: 6.1, 6.5_

  - [ ] 9.2 Crear distribución CloudFront con OAC
    - Proporcionar comandos AWS CLI paso a paso para:
      - Crear Origin Access Control (OAC)
      - Crear distribución CloudFront con origen S3
      - Configurar página de error personalizada: 403 y 404 → `/index.html` (soporte SPA)
      - Habilitar compresión (gzip, brotli)
    - _Requerimientos: 6.2, 6.3, 6.5_

  - [ ] 9.3 Configurar políticas de caché en CloudFront
    - Proporcionar comandos para configurar:
      - `index.html`: `Cache-Control: max-age=0, must-revalidate`
      - `assets/*` (JS, CSS con hash): `Cache-Control: max-age=31536000, immutable`
    - _Requerimientos: 6.4, 8.5_

  - [ ] 9.4 Realizar primer despliegue manual a S3
    - Proporcionar comandos AWS CLI para:
      - Ejecutar `build:web`
      - Sincronizar `dist-web/` con el bucket S3
      - Invalidar caché de CloudFront para `index.html`
    - _Requerimiento: 6.6_

- [ ] 10. Actualizar pipeline CI/CD con job de despliegue web
  - [ ] 10.1 Agregar job `web-deploy` en `.github/workflows/ci.yml`
    - Agregar job que dependa de `quality` y se ejecute solo en push a `main`
    - Steps: checkout, setup Node.js, `npm ci`, `npm run build:web`
    - Configurar credenciales AWS con `aws-actions/configure-aws-credentials@v4`
    - Sincronizar `dist-web/` con S3 usando `aws s3 sync --delete`
    - Invalidar caché de CloudFront para `/index.html`
    - _Requerimientos: 6.1, 6.6_

  - [ ] 10.2 Documentar secrets requeridos en GitHub
    - Crear comentario en el workflow indicando los secrets necesarios:
      - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET_NAME`, `CLOUDFRONT_DISTRIBUTION_ID`
    - _Requerimiento: 6.1_

- [ ] 11. Checkpoint final — Verificar build y despliegue completo
  - Asegurar que todas las pruebas pasan con `npm test`, consultar al usuario si surgen dudas.
  - Verificar que `npm run build:web` genera artefactos en `dist-web/` sin errores.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- Cada tarea referencia requerimientos específicos para trazabilidad.
- Los checkpoints aseguran validación incremental.
- Las pruebas basadas en propiedades validan propiedades universales de correctitud definidas en el diseño.
- Las pruebas unitarias validan ejemplos específicos y casos borde.
- La infraestructura AWS (tarea 9) proporciona comandos CLI paso a paso — el usuario los ejecuta manualmente.
- Todo el despliegue AWS se mantiene dentro de los límites del Free Tier.
