# =============================================================================
# Markdown Presenter Pro — Dockerfile Multi-Stage
# =============================================================================
# Etapa 1: deps — Instala dependencias de Node.js
# Etapa 2: development — Entorno de desarrollo con hot reload
# Etapa 3: build — Compila el proyecto para producción
# Etapa 4: production — Solo artefactos finales, imagen mínima
# =============================================================================

# --- Etapa 1: Dependencias ---
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# --- Etapa 2: Desarrollo ---
FROM node:20-alpine AS development
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 1420
CMD ["npm", "run", "dev"]

# --- Etapa 3: Build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Etapa 4: Producción ---
# Solo contiene los artefactos compilados y dependencias de producción
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Copiar solo artefactos de build y package files
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/package-lock.json* ./

# Instalar solo dependencias de producción
RUN npm ci --omit=dev && npm cache clean --force

# Usuario no-root por seguridad
RUN addgroup -g 1001 -S mpp && \
    adduser -S mpp -u 1001
USER mpp

EXPOSE 3000
CMD ["npm", "start"]
