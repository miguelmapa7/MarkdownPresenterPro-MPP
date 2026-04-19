# 6. Capa de Presentación — Componentes React

## SlideViewer (`src/presentation/SlideViewer.tsx`)

Renderiza el HTML de la diapositiva actual. Usa `dangerouslySetInnerHTML` porque el HTML viene de nuestro pipeline controlado (Markdown → AST → HTML). Las clases `prose` de Tailwind Typography dan estilos automáticos al contenido.

## LinearNavigator (`src/presentation/LinearNavigator.tsx`)

Botones "Anterior" y "Siguiente" con atajos de teclado (flechas, Space). Los botones se deshabilitan visual y funcionalmente en los límites (primera/última diapositiva). Usa `useEffect` para registrar/limpiar el listener de teclado global.

## DockIcon (`src/presentation/DockIcon.tsx`)

Icono individual del Dock con efecto de magnificación tipo macOS.

### ¿Cómo funciona la magnificación?

1. El componente padre (`FloatingDock`) crea un `MotionValue` con la posición X del mouse
2. Cada `DockIcon` calcula su distancia al cursor usando `useTransform`
3. La distancia se mapea a una escala: cursor encima → 64px, cursor lejos → 40px
4. `useSpring` suaviza la transición para que sea fluida

### Conceptos de Framer Motion:

- `MotionValue`: Valor reactivo que se actualiza sin causar re-renders de React
- `useTransform`: Transforma un MotionValue en otro (distancia → escala)
- `useSpring`: Agrega animación tipo "resorte" a un valor

## FloatingDock (`src/presentation/FloatingDock.tsx`)

Menú flotante que muestra un icono por cada diapositiva. Posicionable en 4 bordes (top, bottom, left, right). Usa `backdrop-blur` para efecto glassmorphism.

El `MotionValue` del mouse se comparte entre todos los `DockIcon` hijos — así cada icono calcula su magnificación independientemente sin causar re-renders.

## PresenterMode (`src/presentation/PresenterMode.tsx`)

Vista dividida: 70% diapositiva actual + 30% preview siguiente + cronómetro + contador "N de M".

### Cronómetro:

Usa `useSyncExternalStore` — un hook de React para suscribirse a stores externos. El timer es un módulo externo que mantiene los segundos fuera de React y notifica a los listeners cuando cambia. Esto cumple con las reglas estrictas de React 19 (no setState en effects, no refs en render).

## ThemeProvider (`src/presentation/ThemeProvider.tsx`)

React Context que gestiona el tema oscuro/claro. Agrega/remueve la clase `dark` en `document.documentElement`. Tailwind CSS v4 usa `@custom-variant dark` para habilitar el prefijo `dark:` basado en esa clase.

### Flujo:

1. Lee preferencia almacenada via `ConfigurationUseCase.getTheme()`
2. Aplica clase `dark` en `<html>` si el tema es oscuro
3. Al cambiar tema, persiste via `ConfigurationUseCase.setTheme()`

## I18nProvider (`src/presentation/I18nProvider.tsx`)

Sistema ligero de internacionalización. Carga traducciones desde archivos JSON estáticos (`es.json`, `en.json`).

### Función `t(key, params)`:

- Busca la clave en el idioma activo
- Si no existe, busca en español (fallback)
- Si tampoco existe en español, retorna la clave misma
- Soporta interpolación: `t("counter", { current: "3", total: "8" })` → "3 de 8"

### ¿Por qué no react-i18next?

MPP tiene un conjunto acotado de cadenas de UI (~30 claves). Una librería i18n completa agregaría complejidad innecesaria. El patrón Context + JSON es suficiente y extensible.

## WebPresentationLoader (`src/presentation/WebPresentationLoader.tsx`)

Reemplaza los diálogos nativos de Tauri con `<input type="file">` del navegador. Soporta:

- Selección de archivo `.md` individual
- Selección de carpeta (`webkitdirectory`)
- Selección múltiple de archivos
- Drag & drop
- Detección de soporte `webkitdirectory`

## WebModeBadge (`src/presentation/WebModeBadge.tsx`)

Badge sutil "Web" en la esquina inferior izquierda. Solo visible en modo web.
