# DevOps y CI/CD

## Docker

### Dockerfile Multi-Stage

4 etapas optimizadas:

1. **deps** — Instala dependencias (`npm ci`)
2. **development** — Entorno de desarrollo con hot reload
3. **build** — Compila para producción
4. **production** — Solo artefactos finales, imagen mínima

### Docker Compose

```bash
# Levantar entorno de desarrollo
docker compose up --build app

# Levantar servidor de documentación
docker compose up --build docs
```

## Pipeline CI/CD (GitHub Actions)

| Etapa       | Trigger      | Acción                                              |
| ----------- | ------------ | --------------------------------------------------- |
| **Quality** | Push / PR    | Lint + TypeCheck + Tests (Ubuntu, macOS, Windows)   |
| **Docker**  | Merge a main | Build y push de imagen al GitHub Container Registry |
| **Release** | Tag `v*`     | Build Tauri multiplataforma + publicación de assets |

## Pre-commit Hooks

Cada `git commit` ejecuta automáticamente:

- **ESLint** → Análisis estático del código
- **Prettier** → Formato consistente

Solo sobre archivos staged, para mantener la velocidad.
