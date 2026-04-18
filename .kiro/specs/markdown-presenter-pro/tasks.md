# Plan de Implementación: Markdown Presenter Pro (MPP)

## Visión General

Este plan convierte el diseño de Clean Architecture en tareas incrementales de codificación. Se sigue el orden: scaffolding del proyecto → capa de dominio → capa de aplicación → capa de presentación → capa de infraestructura → Docker/CI/CD → pre-commit hooks. Cada tarea construye sobre las anteriores y finaliza con la integración completa.

## Tareas

- [x] 1. Scaffolding del proyecto Tauri + React + TypeScript
  - [x] 1.1 Inicializar proyecto con Tauri 2.0 y React + TypeScript + Vite
    - Crear el proyecto base con `npm create tauri-app`
    - Configurar `tsconfig.json` con strict mode habilitado
    - Instalar dependencias core: `@tauri-apps/api`, `@tauri-apps/plugin-fs`
    - _Requerimientos: 12.1, 12.2_

  - [x] 1.2 Configurar Tailwind CSS, Framer Motion y dependencias de Unified.js
    - Instalar y configurar Tailwind CSS con purge para producción
    - Instalar Framer Motion para animaciones
    - Instalar ecosistema Unified.js: `unified`, `remark-parse`, `remark-gfm`, `remark-frontmatter`, `remark-stringify`, `remark-rehype`, `rehype-highlight`, `rehype-stringify`
    - Instalar tipos: `@types/mdast`
    - _Requerimientos: 1.1, 1.2, 1.5_

  - [x] 1.3 Configurar Vitest y fast-check para pruebas
    - Instalar `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `fast-check`
    - Configurar `vitest.config.ts` con soporte para React y TypeScript
    - Crear estructura de carpetas de pruebas según el diseño: `src/domain/__tests__/`, `src/application/__tests__/`, `src/presentation/__tests__/`, `src/__tests__/generators/`, `src/__tests__/integration/`
    - _Requerimientos: 9.3, 14.6, 14.7_

  - [x] 1.4 Definir estructura de carpetas del proyecto según Clean Architecture
    - Crear directorios: `src/domain/`, `src/application/`, `src/presentation/`, `src/infrastructure/`
    - Crear archivos barrel (`index.ts`) para cada capa
    - _Requerimientos: Arquitectura Clean Architecture_

- [x] 2. Implementar capa de dominio — Entidades y servicios core
  - [x] 2.1 Implementar entidad `Slide` con tipos y metadatos
    - Crear `src/domain/Slide.ts` con la clase `Slide`, tipo `SlideContentType` e interfaz `SlideMetadata`
    - Implementar métodos: `getRawMarkdown()`, `getMetadata()`, `getCachedHtml()`, `setCachedHtml()`
    - _Requerimientos: 1.1, 7.1, 7.2_

  - [x] 2.2 Implementar entidad `Presentation` con patrón Observer
    - Crear `src/domain/Presentation.ts` con la clase `Presentation`, interfaces `ISlideObserver` y `SlideChangedEvent`
    - Implementar navegación: `goToSlide()`, `next()`, `previous()`
    - Implementar consultas: `getCurrentSlide()`, `getSlideAt()`, `getCurrentIndex()`, `getTotalSlides()`, `isFirstSlide()`, `isLastSlide()`
    - Implementar Observer: `addObserver()`, `removeObserver()`, `notifyObservers()`
    - _Requerimientos: 2.1, 2.2, 2.3, 2.4, 2.6, 3.3_

  - [ ]\* 2.3 Escribir prueba de propiedad para navegación (P5)
    - **Propiedad 5: Correctitud del estado de navegación**
    - Generar presentaciones con N diapositivas y secuencias de acciones `next()`, `previous()`, `goTo(j)`
    - Verificar que los índices resultantes cumplen las reglas de límites
    - **Valida: Requerimientos 2.1, 2.2, 2.3, 2.4, 3.2**

  - [ ]\* 2.4 Escribir prueba de propiedad para Observer (P6)
    - **Propiedad 6: Invariante de notificación del Observer**
    - Generar secuencias de navegación con mock observers registrados
    - Verificar que cada observer recibe `SlideChangedEvent` con índice correcto
    - **Valida: Requerimientos 2.6, 3.3**

  - [ ]\* 2.5 Escribir prueba de propiedad para cantidad de iconos (P7)
    - **Propiedad 7: Invariante de cantidad de iconos del Dock**
    - Generar presentaciones con N diapositivas variable
    - Verificar que el Dock muestra exactamente N iconos
    - **Valida: Requerimiento 3.1**

  - [x] 2.6 Implementar servicio `MarkdownParser` con pipelines Unified.js
    - Crear `src/domain/MarkdownParser.ts` implementando `IMarkdownParser`
    - Configurar pipeline de parseo: `remarkParse` + `remarkGfm` + `remarkFrontmatter`
    - Configurar pipeline de renderizado: `remarkParse` → `remarkRehype` → `rehypeHighlight` → `rehypeStringify`
    - Configurar pipeline de formateo: `remarkStringify` + `remarkGfm`
    - Implementar métodos: `parse()`, `format()`, `toHtml()`
    - _Requerimientos: 1.1, 1.2, 1.5, 1.6, 9.1, 9.2_

  - [ ]\* 2.7 Escribir prueba de propiedad para round-trip Markdown (P1)
    - **Propiedad 1: Round-trip de parseo Markdown (incluyendo GFM)**
    - Crear generador de documentos Markdown válidos (CommonMark + GFM) en `src/__tests__/generators/markdown.gen.ts`
    - Verificar que `parse(format(parse(md))) ≡ parse(md)`
    - **Valida: Requerimientos 9.1, 9.2, 9.3, 9.4**

  - [ ]\* 2.8 Escribir prueba de propiedad para correspondencia HTML (P2)
    - **Propiedad 2: Correspondencia estructural HTML del renderizado Markdown**
    - Verificar que headings producen `<h1>`-`<h6>`, párrafos producen `<p>`, tablas GFM producen `<table>`
    - **Valida: Requerimientos 1.1, 1.2**

  - [ ]\* 2.9 Escribir prueba de propiedad para resaltado de sintaxis (P3)
    - **Propiedad 3: Determinación de resaltado de sintaxis en bloques de código**
    - Generar bloques de código con y sin indicador de lenguaje
    - Verificar presencia/ausencia de clases CSS de resaltado
    - **Valida: Requerimientos 1.5, 1.6**

  - [ ]\* 2.10 Escribir prueba de propiedad para resiliencia del parser (P4)
    - **Propiedad 4: Resiliencia del parser ante entrada malformada**
    - Usar `fc.string()` y `fc.unicodeString()` como entrada
    - Verificar que el parser no lanza excepciones
    - **Valida: Requerimiento 1.7**

  - [x] 2.11 Implementar servicio `IconResolver`
    - Crear `src/domain/IconResolver.ts` implementando `IIconResolver`
    - Implementar mapa de iconos predeterminados por `SlideContentType`
    - Implementar `resolve()`: retornar icono personalizado o predeterminado según metadatos
    - Implementar `loadCustomSvg()`: cargar SVG con fallback a icono genérico
    - _Requerimientos: 6.1, 6.2, 6.3, 6.4_

  - [ ]\* 2.12 Escribir prueba de propiedad para resolución de iconos (P10)
    - **Propiedad 10: Correctitud de la resolución de iconos**
    - Crear generador de `SlideMetadata` en `src/__tests__/generators/slideMetadata.gen.ts`
    - Verificar lógica de resolución: custom-svg válido, predeterminado por tipo, fallback con warning
    - **Valida: Requerimientos 6.1, 6.2, 6.4**

- [x] 3. Checkpoint — Verificar capa de dominio
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas.

- [x] 4. Implementar capa de aplicación — Casos de uso
  - [x] 4.1 Implementar `LoadPresentationUseCase`
    - Crear `src/application/LoadPresentationUseCase.ts`
    - Implementar carga de archivo individual: dividir por separadores (`---`, headings h1/h2) en diapositivas
    - Implementar carga de directorio: cada `.md` es una diapositiva, orden alfabético, ignorar no-`.md`
    - Implementar `detectContentType()` basado en análisis del AST
    - Manejar errores: archivo vacío, carpeta sin `.md`, permisos, carga parcial
    - _Requerimientos: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]\* 4.2 Escribir prueba de propiedad para división de diapositivas (P11)
    - **Propiedad 11: Correctitud de la división de diapositivas desde archivo**
    - Generar Markdown con N separadores variables
    - Verificar que se producen exactamente N+1 diapositivas (o N si comienza con separador)
    - **Valida: Requerimiento 7.1**

  - [ ]\* 4.3 Escribir prueba de propiedad para filtrado de directorio (P12)
    - **Propiedad 12: Filtrado y ordenamiento de archivos en directorio**
    - Generar listas de archivos con extensiones mixtas
    - Verificar que solo se incluyen `.md` y están ordenados alfabéticamente
    - **Valida: Requerimientos 7.2, 7.3**

  - [x] 4.4 Implementar `NavigateSlideUseCase`
    - Crear `src/application/NavigateSlideUseCase.ts`
    - Implementar `next()`, `previous()`, `goTo()` delegando a `Presentation`
    - Implementar `getNavigationState()` retornando `NavigationState`
    - _Requerimientos: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.5 Implementar `RenderMarkdownUseCase` con patrón Strategy
    - Crear `src/application/RenderMarkdownUseCase.ts`
    - Implementar `StrategyRegistry` con registro de estrategias: `CodeBlockStrategy`, `TableStrategy`, `ImageStrategy`, `VideoStrategy`, `DefaultStrategy`
    - Implementar `render()` y `renderToHtml()` con medición de tiempo de renderizado
    - _Requerimientos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 4.6 Implementar `ConfigurationUseCase`
    - Crear `src/application/ConfigurationUseCase.ts`
    - Implementar gestión de `UserConfiguration`: posición del Dock, tema, archivos recientes, atajos de teclado
    - Delegar persistencia a `IPersistenceAdapter`
    - _Requerimientos: 4.3, 4.4_

  - [ ]\* 4.7 Escribir prueba de propiedad para persistencia del Dock (P8)
    - **Propiedad 8: Round-trip de persistencia de posición del Dock**
    - Usar `fc.constantFrom('top', 'bottom', 'left', 'right')`
    - Verificar que guardar y cargar retorna la misma posición
    - **Valida: Requerimiento 4.3**

  - [ ]\* 4.8 Escribir pruebas unitarias para casos de error de carga
    - Verificar mensaje de error para carpeta sin archivos `.md` (Req 7.4)
    - Verificar mensaje de error para archivo `.md` vacío (Req 7.5)
    - Verificar carga parcial cuando algunos archivos no son accesibles
    - _Requerimientos: 7.4, 7.5_

- [x] 5. Checkpoint — Verificar capas de dominio y aplicación
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas.

- [x] 6. Implementar capa de presentación — Componentes React
  - [x] 6.1 Implementar componente `SlideViewer`
    - Crear `src/presentation/SlideViewer.tsx`
    - Renderizar HTML de la diapositiva actual con estilos Tailwind
    - Implementar `SlideErrorBoundary` para capturar errores de renderizado
    - Maximizar área de contenido según diseño minimalista
    - _Requerimientos: 1.1, 11.1, 11.2_

  - [x] 6.2 Implementar componente `LinearNavigator` con atajos de teclado
    - Crear `src/presentation/LinearNavigator.tsx`
    - Implementar botones "Anterior" y "Siguiente" con estados habilitado/deshabilitado
    - Implementar listeners de teclado: flechas izquierda/derecha, Space
    - Conectar con `NavigateSlideUseCase`
    - _Requerimientos: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 6.3 Implementar componente `DockIcon` con efecto de magnificación
    - Crear `src/presentation/DockIcon.tsx`
    - Implementar cálculo de escala usando `useTransform` de Framer Motion basado en distancia al cursor
    - Escala máxima en icono más cercano, decreciente con la distancia, dentro de límites [base, máximo]
    - _Requerimientos: 5.1, 5.2, 5.4_

  - [ ]\* 6.4 Escribir prueba de propiedad para magnificación (P9)
    - **Propiedad 9: Correctitud del algoritmo de magnificación**
    - Generar arreglos de posiciones de iconos y posiciones de cursor
    - Verificar: escala máxima en icono más cercano, decrecimiento monótono, orden preservado, límites respetados
    - **Valida: Requerimientos 5.1, 5.2, 5.4**

  - [x] 6.5 Implementar componente `FloatingDock` con posicionamiento configurable
    - Crear `src/presentation/FloatingDock.tsx`
    - Renderizar un `DockIcon` por cada diapositiva con icono resuelto
    - Implementar posicionamiento en 4 bordes: top, bottom, left, right
    - Implementar transición animada al cambiar posición
    - Resaltar icono activo correspondiente a la diapositiva actual
    - Posición predeterminada: bottom
    - _Requerimientos: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.4_

  - [x] 6.6 Implementar componente `PresenterMode`
    - Crear `src/presentation/PresenterMode.tsx`
    - Implementar vista dividida: diapositiva actual (panel principal) + preview siguiente (panel secundario)
    - Implementar cronómetro con tiempo transcurrido desde activación
    - Implementar contador de diapositivas en formato "N de M"
    - Implementar indicador "Fin de Presentación" en última diapositiva
    - Preservar índice de diapositiva al activar/desactivar
    - _Requerimientos: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]\* 6.7 Escribir prueba de propiedad para preservación de índice (P13)
    - **Propiedad 13: Preservación del índice al alternar Modo Presentador**
    - Generar presentaciones con índices aleatorios
    - Verificar que activar y desactivar preserva el índice
    - **Valida: Requerimiento 8.5**

  - [ ]\* 6.8 Escribir prueba de propiedad para formato del contador (P14)
    - **Propiedad 14: Formato del contador de diapositivas**
    - Usar `fc.nat()` para generar `currentIndex` y `totalSlides`
    - Verificar que el texto es exactamente `"{currentIndex + 1} de {totalSlides}"`
    - **Valida: Requerimiento 8.3**

  - [x] 6.9 Implementar componente `PresentationLoader` y pantalla de carga
    - Crear `src/presentation/PresentationLoader.tsx`
    - Implementar diálogo de selección de archivo/carpeta usando Tauri dialog API
    - Conectar con `LoadPresentationUseCase`
    - Mostrar mensajes de error informativos según tipo de error
    - _Requerimientos: 7.1, 7.2, 7.4, 7.5_

  - [x] 6.10 Implementar componente `App` principal y gestión de estado global
    - Crear `src/presentation/App.tsx` como orquestador principal
    - Implementar estado global `AppState` con React Context o useReducer
    - Conectar todos los componentes: `PresentationLoader`, `SlideViewer`, `LinearNavigator`, `FloatingDock`, `PresenterMode`
    - Implementar modo pantalla completa con Fullscreen API
    - Aplicar paleta de colores neutra y diseño minimalista
    - _Requerimientos: 11.1, 11.2, 11.3_

- [x] 7. Checkpoint — Verificar capa de presentación
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas.

- [x] 8. Implementar capa de infraestructura — Adaptadores
  - [x] 8.1 Implementar `TauriFileSystemAdapter`
    - Crear `src/infrastructure/TauriFileSystemAdapter.ts` implementando `IFileSystemAdapter`
    - Implementar `readFile()`, `readDirectory()`, `exists()` usando `@tauri-apps/plugin-fs`
    - Manejar errores de permisos y archivos no encontrados
    - _Requerimientos: 7.1, 7.2, 12.1_

  - [x] 8.2 Implementar `LocalPersistenceAdapter`
    - Crear `src/infrastructure/LocalPersistenceAdapter.ts` implementando `IPersistenceAdapter`
    - Implementar `get()`, `set()`, `remove()` con localStorage
    - Manejar degradación elegante: localStorage no disponible → valores en memoria; datos corruptos → reset a defaults; cuota excedida → continuar sin persistir
    - _Requerimientos: 4.3_

  - [ ]\* 8.3 Escribir pruebas unitarias para adaptadores de infraestructura
    - Verificar lectura de archivos y directorios con mocks de Tauri API
    - Verificar persistencia con mock de localStorage
    - Verificar manejo de errores: permisos, archivos no encontrados, storage no disponible
    - _Requerimientos: 7.1, 7.2, 4.3_

- [x] 9. Integración completa y cableado de componentes
  - [x] 9.1 Conectar adaptadores de infraestructura con casos de uso
    - Inyectar `TauriFileSystemAdapter` en `LoadPresentationUseCase`
    - Inyectar `LocalPersistenceAdapter` en `ConfigurationUseCase`
    - Verificar que el flujo completo funciona: cargar archivo → parsear → renderizar → navegar
    - _Requerimientos: 7.1, 7.2, 1.1, 2.1_

  - [x] 9.2 Configurar atajos de teclado adaptados por plataforma
    - Implementar `KeyboardShortcutMap` con detección de plataforma (Cmd en macOS, Ctrl en Windows/Linux)
    - Registrar atajos: flechas para navegación, `p` para Modo Presentador, `f`/`F11` para pantalla completa, `Escape` para salir
    - _Requerimientos: 2.1, 2.2, 12.3_

  - [ ]\* 9.3 Escribir pruebas de integración de rendimiento
    - Benchmark de parseo y renderizado con archivos de 100, 500 y 1000 líneas (< 200ms)
    - Benchmark de transición entre diapositivas (< 100ms)
    - Benchmark de carga inicial de presentación (< 500ms)
    - _Requerimientos: 10.1, 10.2, 10.3_

- [x] 10. Checkpoint — Verificar integración completa
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas.

- [x] 11. Configurar Docker y CI/CD
  - [x] 11.1 Crear Dockerfile multi-stage
    - Crear `Dockerfile` con 4 etapas: deps, development, build, production
    - Etapa deps: `node:20-alpine`, instalar dependencias con `npm ci`
    - Etapa development: copiar código fuente, comando `npm run dev`
    - Etapa build: ejecutar `npm run build`
    - Etapa production: solo artefactos, `npm ci --production`
    - _Requerimientos: 13.1, 13.4_

  - [x] 11.2 Crear docker-compose.yml y .dockerignore
    - Crear `docker-compose.yml` con servicios: app (desarrollo) y docs (documentación)
    - Crear `.dockerignore` excluyendo: `node_modules`, `.git`, archivos temporales, configuraciones locales
    - Verificar que el entorno levanta en menos de 120 segundos
    - _Requerimientos: 13.2, 13.3, 13.9, 13.11_

  - [x] 11.3 Configurar pipeline CI/CD con GitHub Actions
    - Crear `.github/workflows/ci.yml` con etapas: build, lint, test, generar artefactos
    - Configurar matriz de plataformas: Windows, macOS, Ubuntu
    - Configurar publicación de imagen Docker versionada (SemVer + hash de commit) al Registro de Contenedores tras merge a main
    - Configurar generación de artefactos de distribución multiplataforma en tags de release
    - Configurar notificación de errores y detención de pipeline ante fallos
    - Configurar ejecución de pruebas de integración contra imagen Docker antes de promover despliegue
    - _Requerimientos: 13.5, 13.6, 13.7, 13.8, 13.10, 13.12_

- [x] 12. Configurar pre-commit hooks con Husky y lint-staged
  - [x] 12.1 Instalar y configurar Husky + lint-staged
    - Instalar `husky` y `lint-staged` como dependencias de desarrollo
    - Inicializar Husky con `npx husky init`
    - Configurar hook `pre-commit` que ejecute `lint-staged`
    - _Requerimientos: 14.1, 14.2, 14.12_

  - [x] 12.2 Configurar validaciones de lint-staged
    - Configurar ESLint sobre archivos staged `.ts`, `.tsx`, `.js`, `.jsx`
    - Configurar Prettier para verificar formato consistente
    - Configurar `tsc --noEmit` para verificación de tipos
    - Configurar ejecución de pruebas unitarias y property-based tests relacionadas con archivos staged
    - Configurar bloqueo de commit y mensajes de error descriptivos ante fallos
    - _Requerimientos: 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10, 14.11_

- [x] 13. Checkpoint final — Verificar todo el sistema
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas.

- [ ] 14. Implementar Tema Oscuro y Claro
  - [ ] 14.1 Configurar modo oscuro de Tailwind CSS con `@custom-variant` en `src/index.css`
    - Agregar la directiva `@custom-variant dark (&:where(.dark, .dark *));` al archivo `src/index.css`
    - Esto habilita el prefijo `dark:` de Tailwind basado en la clase `dark` en el elemento `<html>`
    - _Requerimientos: 15.1, 15.2, 15.3_

  - [ ] 14.2 Crear contexto `ThemeProvider` con hook `useTheme`
    - Crear `src/presentation/ThemeProvider.tsx`
    - Implementar `ThemeProvider` que lea la preferencia almacenada via `ConfigurationUseCase.getTheme()`
    - Implementar `toggleTheme()` y `setTheme()` que persistan via `ConfigurationUseCase.setTheme()`
    - Aplicar/remover la clase `dark` en `document.documentElement` al cambiar tema
    - Implementar hook `useTheme()` que exponga `theme`, `toggleTheme` y `setTheme`
    - Aplicar tema claro (`light`) como predeterminado si no hay preferencia almacenada
    - _Requerimientos: 15.5, 15.6, 15.7, 15.8_

  - [ ] 14.3 Crear componente `ThemeToggle`
    - Crear `src/presentation/ThemeToggle.tsx`
    - Implementar botón de alternancia que muestre icono de sol (tema claro activo) o luna (tema oscuro activo)
    - Consumir `useTheme()` para leer y cambiar el tema
    - _Requerimientos: 15.4_

  - [ ] 14.4 Extender `ConfigurationUseCase` con soporte de idioma (`getLocale`/`setLocale`)
    - Agregar tipo `SupportedLocale = 'es' | 'en'` en `src/application/ConfigurationUseCase.ts`
    - Agregar campo `locale: SupportedLocale` a la interfaz `UserConfiguration`
    - Agregar `locale: 'es'` al `DEFAULT_CONFIG`
    - Implementar métodos `getLocale(): SupportedLocale` y `setLocale(locale: SupportedLocale): void`
    - _Requerimientos: 16.5, 16.6, 16.7_

  - [ ] 14.5 Actualizar `App.tsx` para envolver con `ThemeProvider`
    - Importar `ThemeProvider` en `src/App.tsx`
    - Envolver el árbol de componentes con `<ThemeProvider configUseCase={configUseCase}>`
    - Instanciar `ConfigurationUseCase` con `LocalPersistenceAdapter` a nivel de App
    - Actualizar clases CSS del contenedor raíz para usar `dark:bg-gray-900 dark:text-gray-100`
    - _Requerimientos: 15.5, 15.9_

  - [ ] 14.6 Actualizar componentes existentes con clases `dark:` de Tailwind
    - Actualizar `SlideViewer` con estilos `dark:` para fondo, texto y contenido renderizado
    - Actualizar `FloatingDock` con estilos `dark:` para fondo del dock e iconos
    - Actualizar `LinearNavigator` con estilos `dark:` para botones y estados
    - Actualizar `PresenterMode` con estilos `dark:` para paneles, cronómetro y contador
    - Actualizar `PresentationLoader` con estilos `dark:` para pantalla de carga y mensajes
    - Integrar `ThemeToggle` en la interfaz principal (FloatingDock o barra superior)
    - _Requerimientos: 15.2, 15.3, 15.9_

  - [ ]\* 14.7 Escribir prueba de propiedad para persistencia de tema (P15)
    - **Propiedad 15: Round-trip de persistencia de tema**
    - Usar `fc.constantFrom('light', 'dark')` como generador
    - Verificar que `setTheme(t)` seguido de `getTheme()` retorna `t`
    - **Valida: Requerimiento 15.6**

- [ ] 15. Implementar Internacionalización (i18n)
  - [ ] 15.1 Crear archivos de traducción para español e inglés
    - Crear directorio `src/i18n/locales/`
    - Crear `src/i18n/locales/es.json` con todas las cadenas de la interfaz en español
    - Crear `src/i18n/locales/en.json` con todas las cadenas de la interfaz en inglés
    - Incluir claves para: navegación, modo presentador, cargador, tema, idioma, errores
    - _Requerimientos: 16.1, 16.2, 16.8_

  - [ ] 15.2 Crear contexto `I18nProvider` con hook `useTranslation`
    - Crear `src/presentation/I18nProvider.tsx`
    - Implementar `I18nProvider` que cargue archivos de traducción desde `src/i18n/locales/{locale}.json`
    - Implementar función `t(key)` que resuelva claves con fallback a español si falta una clave
    - Implementar `setLocale()` que persista la preferencia via `ConfigurationUseCase.setLocale()`
    - Leer preferencia almacenada al iniciar via `ConfigurationUseCase.getLocale()`
    - Aplicar español (`es`) como idioma predeterminado si no hay preferencia almacenada
    - _Requerimientos: 16.2, 16.4, 16.5, 16.6, 16.7, 16.10_

  - [ ] 15.3 Crear componente `LanguageSelector`
    - Crear `src/presentation/LanguageSelector.tsx`
    - Implementar selector que muestre los idiomas disponibles (Español, English)
    - Consumir `useTranslation()` para leer y cambiar el idioma activo
    - _Requerimientos: 16.3_

  - [ ] 15.4 Extender `ConfigurationUseCase` con soporte de idioma (si no se completó en 14.4)
    - Verificar que los métodos `getLocale()` y `setLocale()` están implementados
    - Verificar que `DEFAULT_CONFIG` incluye `locale: 'es'`
    - _Requerimientos: 16.5, 16.6, 16.7_

  - [ ] 15.5 Actualizar `App.tsx` para envolver con `I18nProvider`
    - Importar `I18nProvider` en `src/App.tsx`
    - Envolver el árbol de componentes con `<I18nProvider configUseCase={configUseCase}>` (dentro de `ThemeProvider`)
    - _Requerimientos: 16.4_

  - [ ] 15.6 Reemplazar cadenas hardcodeadas en componentes con llamadas a `t()`
    - Actualizar `LinearNavigator`: botones "Anterior"/"Siguiente"
    - Actualizar `PresenterMode`: contador "N de M", indicador "Fin de Presentación", cronómetro
    - Actualizar `PresentationLoader`: botones de selección, mensajes de error
    - Actualizar `FloatingDock`: tooltips y etiquetas
    - Actualizar `ThemeToggle`: etiquetas "Tema claro"/"Tema oscuro"
    - Actualizar `LanguageSelector`: nombres de idiomas
    - _Requerimientos: 16.4, 16.8, 16.9_

  - [ ]\* 15.7 Escribir prueba de propiedad para cobertura de claves i18n (P17)
    - **Propiedad 17: Cobertura de claves de traducción entre idiomas**
    - Cargar `es.json` y `en.json`, verificar que todas las claves de `es.json` existen en `en.json`
    - **Valida: Requerimiento 16.8**

  - [ ]\* 15.8 Escribir prueba de propiedad para fallback de traducción (P18)
    - **Propiedad 18: Fallback de traducción al idioma predeterminado**
    - Generar claves de traducción y simular claves faltantes en un idioma
    - Verificar que `t(key)` retorna el valor en español cuando la clave falta en el idioma activo
    - **Valida: Requerimiento 16.10**

- [ ] 16. Checkpoint — Verificar tema e i18n
  - Asegurar que todas las pruebas pasan, preguntar al usuario si surgen dudas.
  - Verificar que el tema oscuro/claro se aplica correctamente en todos los componentes.
  - Verificar que el cambio de idioma actualiza todas las cadenas de la interfaz sin recarga.
  - Verificar que las preferencias de tema e idioma persisten entre sesiones.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido.
- Cada tarea referencia requerimientos específicos para trazabilidad.
- Los checkpoints aseguran validación incremental entre capas.
- Las pruebas de propiedades validan propiedades universales de correctitud definidas en el diseño.
- Las pruebas unitarias validan ejemplos específicos y casos borde.
- El lenguaje de implementación es TypeScript, según lo definido en el documento de diseño.
