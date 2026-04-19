# 2. Arquitectura del Proyecto

## Clean Architecture

MPP sigue **Clean Architecture**, un patrón arquitectónico propuesto por Robert C. Martin (Uncle Bob). La idea central es separar el código en capas con dependencias que van de afuera hacia adentro:

```
┌─────────────────────────────────────────┐
│  Presentación (UI)                       │  ← Componentes React
│  ┌─────────────────────────────────┐    │
│  │  Aplicación (Casos de Uso)       │    │  ← Orquesta la lógica
│  │  ┌─────────────────────────┐    │    │
│  │  │  Dominio (Entidades)     │    │    │  ← Lógica de negocio pura
│  │  └─────────────────────────┘    │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
  Infraestructura (Adaptadores)            ← Servicios externos
```

### ¿Por qué Clean Architecture?

1. **Independencia del framework**: La lógica de negocio (parsear Markdown, navegar slides) no depende de React ni de Tauri. Si mañana migramos a Vue o Electron, solo cambiamos las capas externas.

2. **Testeable**: Cada capa se puede probar de forma aislada. Los casos de uso se testean con mocks de los adaptadores.

3. **Mantenible**: Cada archivo tiene una responsabilidad clara. Sabes exactamente dónde buscar cuando algo falla.

## Estructura de Carpetas

```
src/
├── domain/              ← Capa más interna: lógica pura
│   ├── Slide.ts         ← Entidad: una diapositiva
│   ├── Presentation.ts  ← Entidad: colección de slides + Observer
│   ├── MarkdownParser.ts← Servicio: parseo/renderizado de Markdown
│   ├── IconResolver.ts  ← Servicio: resolución de iconos
│   └── index.ts         ← Barrel: re-exporta todo
│
├── application/         ← Casos de uso: orquestan la lógica
│   ├── LoadPresentationUseCase.ts  ← Cargar archivos/carpetas
│   ├── NavigateSlideUseCase.ts     ← Navegar entre slides
│   ├── RenderMarkdownUseCase.ts    ← Renderizar Markdown a HTML
│   ├── ConfigurationUseCase.ts     ← Gestionar preferencias
│   └── index.ts
│
├── presentation/        ← Componentes React (UI)
│   ├── SlideViewer.tsx       ← Visualiza la diapositiva
│   ├── LinearNavigator.tsx   ← Botones Anterior/Siguiente
│   ├── DockIcon.tsx          ← Icono individual con magnificación
│   ├── FloatingDock.tsx      ← Menú flotante tipo macOS Dock
│   ├── PresenterMode.tsx     ← Modo presentador
│   ├── PresentationLoader.tsx← Carga de archivos (Tauri)
│   ├── WebPresentationLoader.tsx ← Carga de archivos (Web)
│   ├── ThemeProvider.tsx     ← Contexto de tema oscuro/claro
│   ├── I18nProvider.tsx      ← Contexto de internacionalización
│   └── ...
│
├── infrastructure/      ← Adaptadores a servicios externos
│   ├── IFileSystemAdapter.ts      ← Interfaz (contrato)
│   ├── TauriFileSystemAdapter.ts  ← Implementación Tauri
│   ├── WebFileSystemAdapter.ts    ← Implementación Web
│   ├── IPersistenceAdapter.ts     ← Interfaz de persistencia
│   ├── LocalPersistenceAdapter.ts ← Implementación localStorage
│   ├── EnvironmentDetector.ts     ← Detecta Tauri vs Web
│   ├── AdapterFactory.ts          ← Crea adaptadores según entorno
│   └── index.ts
│
└── i18n/                ← Archivos de traducción
    └── locales/
        ├── es.json      ← Español (idioma predeterminado)
        └── en.json      ← Inglés
```

## Regla de Dependencias

La regla más importante: **las dependencias apuntan hacia adentro**.

- `domain/` NO importa nada de `application/`, `presentation/` ni `infrastructure/`
- `application/` importa de `domain/` pero NO de `presentation/`
- `presentation/` importa de `application/` y `domain/`
- `infrastructure/` implementa interfaces definidas en `domain/` o `application/`

Esto se logra con **interfaces** (la "D" de SOLID — Inversión de Dependencias). Por ejemplo, `LoadPresentationUseCase` no sabe si lee archivos de Tauri o del navegador — solo conoce la interfaz `IFileSystemAdapter`.
