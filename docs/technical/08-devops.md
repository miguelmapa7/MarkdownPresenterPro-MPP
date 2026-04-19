# 8. DevOps — Docker, CI/CD y Pre-commit

## Docker

### Dockerfile Multi-Stage (`Dockerfile`)

El Dockerfile tiene 4 etapas. Cada etapa puede copiar artefactos de la anterior, generando una imagen final mínima.

| Etapa         | Base             | Propósito                                |
| ------------- | ---------------- | ---------------------------------------- |
| `deps`        | `node:20-alpine` | Instala dependencias (`npm ci`)          |
| `development` | `node:20-alpine` | Entorno de desarrollo con hot reload     |
| `build`       | `node:20-alpine` | Compila el proyecto (`npm run build`)    |
| `production`  | `node:20-alpine` | Solo artefactos finales, usuario no-root |

### ¿Por qué multi-stage?

La imagen de desarrollo tiene ~500MB (node_modules, TypeScript, herramientas de build). La imagen de producción tiene ~50MB (solo los archivos compilados). Multi-stage permite tener ambas sin duplicar código.

### docker-compose.yml

Orquesta dos servicios:

- `app`: Entorno de desarrollo con hot reload (puerto 1420)
- `docs`: Servidor de documentación (puerto 3001)

### .dockerignore

Excluye archivos innecesarios del contexto de build: `node_modules`, `dist`, `.git`, `src-tauri/target`. Sin esto, Docker enviaría cientos de MB al daemon innecesariamente.

## CI/CD — GitHub Actions (`.github/workflows/ci.yml`)

### Jobs del pipeline:

| Job          | Trigger      | Qué hace                                                        |
| ------------ | ------------ | --------------------------------------------------------------- |
| `quality`    | Push / PR    | Lint + TypeCheck + Tests en Ubuntu, macOS, Windows              |
| `docker`     | Merge a main | Build y push de imagen Docker al GitHub Container Registry      |
| `release`    | Tag `v*`     | Build de Tauri multiplataforma + publicación en GitHub Releases |
| `web-deploy` | Merge a main | Build web + deploy a S3 + invalidación de CloudFront            |

### Flujo de un cambio:

1. Desarrollador crea rama `feature/xxx` y hace commits
2. Pre-commit hook valida lint + formato
3. Push a GitHub → PR a `main`
4. Pipeline `quality` corre en 3 plataformas
5. Si pasa → merge a `main`
6. Pipeline `docker` construye imagen
7. Pipeline `web-deploy` despliega a AWS
8. Para release: crear tag `v1.0.0` → pipeline `release` genera ejecutables

### Secrets requeridos en GitHub:

- `AWS_ACCESS_KEY_ID`: Access key del usuario IAM
- `AWS_SECRET_ACCESS_KEY`: Secret key del usuario IAM
- `S3_BUCKET_NAME`: Nombre del bucket S3
- `CLOUDFRONT_DISTRIBUTION_ID`: ID de la distribución CloudFront

## Pre-commit Hooks — Husky + lint-staged

### ¿Qué pasa cuando haces `git commit`?

1. Husky intercepta el commit
2. lint-staged ejecuta validaciones SOLO sobre archivos staged:
   - **ESLint**: Busca errores, variables no usadas, imports faltantes
   - **Prettier**: Verifica formato consistente (indentación, comillas, punto y coma)
3. Si todo pasa → commit procede
4. Si algo falla → commit se bloquea con mensaje de error

### ¿Por qué solo archivos staged?

Si tienes 1000 archivos pero solo modificaste 3, no tiene sentido validar los 1000. lint-staged ejecuta las validaciones solo sobre los archivos que vas a commitear, manteniendo la velocidad.

### Configuración en `package.json`:

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
  "*.{js,jsx}": ["eslint --fix", "prettier --write"],
  "*.{json,md,css}": ["prettier --write"]
}
```
