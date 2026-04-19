# Manual Técnico — Markdown Presenter Pro (MPP)

## 1. Visión General del Proyecto

### ¿Qué es MPP?

Markdown Presenter Pro es una aplicación que transforma archivos Markdown (`.md`) en presentaciones interactivas y profesionales. Funciona en dos modos:

- **Modo Escritorio**: Aplicación nativa para Windows, macOS y Linux usando Tauri 2.0
- **Modo Web**: Aplicación web estática desplegada en AWS (S3 + CloudFront)

### ¿Por qué Markdown?

Markdown es un lenguaje de marcado ligero que usan desarrolladores y personas técnicas para escribir documentación. En vez de crear slides en PowerPoint, escribes tu contenido en `.md` y MPP lo convierte en una presentación con navegación, animaciones y modo presentador.

### Stack Tecnológico

| Tecnología              | Rol                     | ¿Por qué se eligió?                                                                     |
| ----------------------- | ----------------------- | --------------------------------------------------------------------------------------- |
| **React 18**            | Biblioteca de UI        | Ecosistema maduro, componentes declarativos, gestión de estado compleja                 |
| **TypeScript**          | Lenguaje                | Tipado estático para contratos entre capas (SOLID), detección de errores en compilación |
| **Tauri 2.0**           | Framework de escritorio | 90-97% más ligero que Electron, backend en Rust, sistema de permisos por seguridad      |
| **Vite**                | Bundler/Dev server      | Arranque instantáneo en desarrollo, build optimizado para producción                    |
| **Tailwind CSS**        | Estilos                 | Utility-first para diseño rápido, purge automático en producción                        |
| **Framer Motion**       | Animaciones             | API declarativa, 60fps, efecto de magnificación del Dock                                |
| **Unified.js**          | Procesamiento Markdown  | Estándar de la industria para Markdown→AST→HTML, extensible con plugins                 |
| **Vitest**              | Framework de pruebas    | Nativo de Vite, rápido, compatible con fast-check                                       |
| **fast-check**          | Property-Based Testing  | Genera cientos de casos aleatorios para validar propiedades formales                    |
| **Docker**              | Contenedorización       | Reproducibilidad del entorno, CI/CD automatizado                                        |
| **GitHub Actions**      | CI/CD                   | Pipeline automatizado: lint, test, build, deploy                                        |
| **AWS S3 + CloudFront** | Hosting web             | Hosting estático gratuito (Free Tier), CDN global con HTTPS                             |
| **Husky + lint-staged** | Pre-commit hooks        | Validación automática antes de cada commit                                              |
