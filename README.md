# Markdown Presenter Pro (MPP)

Aplicación de escritorio multiplataforma que transforma archivos Markdown en presentaciones interactivas y profesionales. Construida con Tauri 2.0, React, TypeScript y Clean Architecture.

## Requisitos previos

- [Node.js](https://nodejs.org/) v20+
- [Rust](https://rustup.rs/) v1.70+
- [Docker](https://docs.docker.com/get-docker/) (opcional, para desarrollo containerizado)

### Dependencias del sistema (Linux/Ubuntu)

```bash
sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libssl-dev pkg-config build-essential
```

## Instalación

```bash
# Clonar el repositorio
git clone git@github.com:miguelmapa7/MarkdownPresenterPro-MPP.git
cd MarkdownPresenterPro-MPP

# Instalar dependencias
npm install
```

## Desarrollo

```bash
# Iniciar la app en modo desarrollo (Vite + Tauri)
npx tauri dev
```

La primera compilación de Rust tarda 2-5 minutos. Las siguientes son incrementales y mucho más rápidas.

## Desarrollo con Docker

```bash
# Levantar el entorno de desarrollo containerizado
docker compose up --build app
```

## Scripts disponibles

| Comando                | Descripción                              |
| ---------------------- | ---------------------------------------- |
| `npx tauri dev`        | Inicia la app en modo desarrollo         |
| `npx tauri build`      | Genera el ejecutable de producción       |
| `npm test`             | Ejecuta las pruebas                      |
| `npm run test:watch`   | Ejecuta las pruebas en modo watch        |
| `npm run lint`         | Ejecuta ESLint                           |
| `npm run lint:fix`     | Ejecuta ESLint y corrige automáticamente |
| `npm run format`       | Formatea el código con Prettier          |
| `npm run format:check` | Verifica el formato sin modificar        |
| `npm run typecheck`    | Verifica tipos con TypeScript            |

## Build de producción

```bash
# Generar ejecutable nativo para tu plataforma
npx tauri build
```

Los ejecutables se generan en `src-tauri/target/release/bundle/`:

- **Linux**: `.deb`, `.AppImage`
- **macOS**: `.dmg`, `.app`
- **Windows**: `.msi`, `.exe`

## Arquitectura

El proyecto sigue Clean Architecture con 4 capas:

```
src/
├── domain/          → Entidades y lógica de negocio (Slide, Presentation, MarkdownParser)
├── application/     → Casos de uso (LoadPresentation, Navigate, Render, Configuration)
├── presentation/    → Componentes React (Dock, SlideViewer, PresenterMode)
└── infrastructure/  → Adaptadores (Tauri filesystem, localStorage)
```

## Stack tecnológico

- **Desktop**: Tauri 2.0 (Rust backend)
- **Frontend**: React 18 + TypeScript
- **Estilos**: Tailwind CSS + Framer Motion
- **Markdown**: Unified.js (remark + rehype)
- **Pruebas**: Vitest + fast-check (property-based testing)
- **CI/CD**: GitHub Actions + Docker

## Pre-commit hooks

El proyecto usa Husky + lint-staged. Cada commit ejecuta automáticamente:

- ESLint (análisis estático)
- Prettier (formato de código)

Solo sobre los archivos modificados, para mantener la velocidad.

## Licencia

MIT
