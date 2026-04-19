# Markdown Presenter Pro (MPP)

Aplicación multiplataforma que transforma archivos Markdown en presentaciones interactivas y profesionales. Funciona como app de escritorio (Windows, macOS, Linux) y como aplicación web desplegada en AWS.

🌐 **Demo Web**: [https://YOUR_CLOUDFRONT_URL](https://YOUR_CLOUDFRONT_URL)

## Características

- Renderizado completo de Markdown (CommonMark + GitHub Flavored Markdown)
- Syntax highlighting para bloques de código
- Navegación dual: botones + menú flotante tipo Dock de macOS
- Efecto de magnificación animado en el Dock (60fps con Framer Motion)
- Modo Presentador con cronómetro, preview de siguiente slide y contador
- Tema oscuro/claro con persistencia
- Internacionalización (Español e Inglés)
- Iconos dinámicos: modo variado o por tipo de contenido
- Carga de archivos individuales o carpetas completas
- Atajos de teclado (flechas, Space, P, F11, Escape)
- Pantalla completa

## Arquitectura

El proyecto sigue **Clean Architecture** con 4 capas independientes:

```
src/
├── domain/          → Lógica de negocio pura (Slide, Presentation, MarkdownParser, IconResolver)
├── application/     → Casos de uso (LoadPresentation, Navigate, Render, Configuration)
├── presentation/    → Componentes React (Dock, SlideViewer, PresenterMode, ThemeProvider, I18nProvider)
└── infrastructure/  → Adaptadores (Tauri filesystem, Web File API, localStorage)
```

### Patrones de diseño implementados

| Patrón               | Uso                                                                         |
| -------------------- | --------------------------------------------------------------------------- |
| **Observer**         | Notificación de cambio de diapositiva al Dock y SlideViewer                 |
| **Strategy**         | Renderizado extensible por tipo de contenido (código, tabla, imagen, video) |
| **Adapter**          | Abstracción del filesystem (Tauri vs Web File API)                          |
| **Abstract Factory** | Creación de adaptadores según el entorno de ejecución                       |

### Principios SOLID

- **S**: Cada clase tiene una sola responsabilidad
- **O**: Nuevos tipos de renderizado = nueva Strategy, sin tocar código existente
- **L**: TauriFileSystemAdapter y WebFileSystemAdapter son intercambiables
- **I**: Interfaces pequeñas y enfocadas (3 métodos cada una)
- **D**: Casos de uso dependen de interfaces, no de implementaciones concretas

## Stack Tecnológico

| Tecnología                   | Rol                                          |
| ---------------------------- | -------------------------------------------- |
| React 18 + TypeScript        | Frontend con tipado estático                 |
| Tauri 2.0                    | Framework de escritorio (Rust backend)       |
| Vite                         | Bundler y dev server                         |
| Tailwind CSS                 | Estilos utility-first con dark mode          |
| Framer Motion                | Animaciones fluidas (magnificación del Dock) |
| Unified.js (remark + rehype) | Procesamiento Markdown → AST → HTML          |
| Vitest + fast-check          | Testing unitario + Property-Based Testing    |
| Docker                       | Contenedorización multi-stage                |
| GitHub Actions               | CI/CD automatizado                           |
| AWS S3 + CloudFront          | Hosting web estático (Free Tier)             |
| Husky + lint-staged          | Pre-commit hooks                             |

## Modo Dual: Escritorio + Web

MPP detecta automáticamente si se ejecuta dentro de Tauri o en un navegador:

| Aspecto               | Escritorio (Tauri)   | Web (Navegador)       |
| --------------------- | -------------------- | --------------------- |
| Filesystem            | API nativa del SO    | Browser File API      |
| Diálogos              | Nativos del SO       | `<input type="file">` |
| Selección de carpetas | Diálogo nativo       | `webkitdirectory`     |
| Hosting               | Instalado localmente | AWS S3 + CloudFront   |

## Requisitos previos

### Para desarrollo

- [Node.js](https://nodejs.org/) v20+
- [Rust](https://rustup.rs/) v1.70+
- [Docker](https://docs.docker.com/get-docker/) (opcional)

### Dependencias del sistema (Linux/Ubuntu)

```bash
sudo apt install -y libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libssl-dev pkg-config build-essential
```

## Instalación

```bash
git clone git@github.com:miguelmapa7/MarkdownPresenterPro-MPP.git
cd MarkdownPresenterPro-MPP
npm install
```

## Desarrollo

### App de escritorio (Tauri)

```bash
npx tauri dev
```

### Servidor web local (sin Tauri)

```bash
npm run dev
```

### Con Docker

```bash
docker compose up --build app
```

## Build

### Escritorio (ejecutable nativo)

```bash
npx tauri build
```

Genera ejecutables en `src-tauri/target/release/bundle/`:

- Linux: `.deb`, `.AppImage`
- macOS: `.dmg`, `.app`
- Windows: `.msi`, `.exe`

### Web (archivos estáticos)

```bash
npm run build:web
```

Genera archivos en `dist-web/` listos para desplegar en cualquier hosting estático.

## Despliegue en AWS

La versión web se despliega en AWS S3 + CloudFront (Free Tier):

```bash
# Build + deploy
npm run build:web
aws s3 sync dist-web/ s3://YOUR_S3_BUCKET --delete
aws cloudfront create-invalidation --distribution-id YOUR_CLOUDFRONT_ID --paths "/index.html"
```

El CI/CD despliega automáticamente en cada push a `main`.

## Scripts disponibles

| Comando              | Descripción                          |
| -------------------- | ------------------------------------ |
| `npx tauri dev`      | App de escritorio en modo desarrollo |
| `npx tauri build`    | Genera ejecutable nativo             |
| `npm run dev`        | Servidor web local (Vite)            |
| `npm run build:web`  | Build web para producción            |
| `npm test`           | Ejecuta pruebas                      |
| `npm run test:watch` | Pruebas en modo watch                |
| `npm run lint`       | Análisis estático (ESLint)           |
| `npm run lint:fix`   | Lint + corrección automática         |
| `npm run format`     | Formateo (Prettier)                  |
| `npm run typecheck`  | Verificación de tipos (TypeScript)   |

## Documentación

- `docs/technical/` — Manual técnico completo (arquitectura, patrones, capas, AWS, SOLID)
- `docs/presentation/` — Archivos de ejemplo para probar la app
- `.kiro/specs/` — Especificaciones formales (requerimientos, diseño, tareas)

## CI/CD Pipeline

| Job        | Trigger      | Acción                                                |
| ---------- | ------------ | ----------------------------------------------------- |
| Quality    | Push / PR    | Lint + TypeCheck + Tests (Ubuntu, macOS, Windows)     |
| Docker     | Merge a main | Build y push de imagen al GitHub Container Registry   |
| Web Deploy | Merge a main | Build web + deploy a AWS S3 + invalidación CloudFront |
| Release    | Tag `v*`     | Build Tauri multiplataforma + GitHub Releases         |

## Pre-commit Hooks

Cada `git commit` ejecuta automáticamente ESLint + Prettier sobre los archivos modificados. Si hay errores, el commit se bloquea.

## Licencia

MIT
