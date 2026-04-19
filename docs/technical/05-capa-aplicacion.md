# 5. Capa de Aplicación — Casos de Uso

Los casos de uso orquestan la lógica de dominio para cumplir objetivos del usuario. No contienen lógica de UI ni acceso directo a servicios externos.

## LoadPresentationUseCase (`src/application/LoadPresentationUseCase.ts`)

### ¿Qué hace?

Carga archivos Markdown y los transforma en una Presentación navegable.

### Dos modos de carga:

1. **Archivo individual**: Divide el contenido por separadores `---` (horizontal rules). Cada sección es una diapositiva.
2. **Carpeta**: Cada archivo `.md` dentro de la carpeta es una diapositiva, ordenados alfabéticamente. Archivos no-`.md` se ignoran.

### Detección de tipo de contenido:

Analiza el AST del Markdown y cuenta nodos por tipo:

- Si >50% son bloques de código → `'code'`
- Si >50% son imágenes → `'image'`
- Si >50% son tablas → `'table'`
- Si >50% son texto → `'text'`
- Si no hay tipo predominante → `'mixed'`

### Manejo de errores:

- Archivo vacío → mensaje informativo
- Carpeta sin `.md` → mensaje informativo
- Ruta no encontrada → error descriptivo

## NavigateSlideUseCase (`src/application/NavigateSlideUseCase.ts`)

### ¿Qué hace?

Fachada sobre la entidad `Presentation` que simplifica la interacción para la UI.

### Métodos:

- `next()`, `previous()`, `goTo(index)`: Delegados a `Presentation`
- `getNavigationState()`: Retorna un objeto limpio con todo lo que la UI necesita:
  - `currentIndex`, `totalSlides`, `canGoNext`, `canGoPrevious`, `currentSlide`

### ¿Por qué una fachada?

Los componentes React no deberían manipular directamente la entidad `Presentation`. El caso de uso provee una interfaz más limpia y controlada.

## RenderMarkdownUseCase (`src/application/RenderMarkdownUseCase.ts`)

### ¿Qué hace?

Transforma una diapositiva de Markdown crudo a HTML renderizado.

### Características:

- Usa el `MarkdownParser` para la transformación
- Usa el `StrategyRegistry` para extensibilidad (patrón Strategy)
- Mide el tiempo de renderizado en milisegundos (para validar rendimiento <200ms)
- Usa caché: si la diapositiva ya fue renderizada, retorna el HTML cacheado con `renderTimeMs: 0`

## ConfigurationUseCase (`src/application/ConfigurationUseCase.ts`)

### ¿Qué hace?

Gestiona las preferencias del usuario: posición del Dock, tema, idioma, archivos recientes, atajos de teclado.

### Persistencia:

Delega a `IPersistenceAdapter` (localStorage en la práctica). Si localStorage no está disponible, usa valores en memoria.

### Valores predeterminados:

- Dock: `bottom`
- Tema: `light`
- Idioma: `es`
- Archivos recientes: máximo 10, sin duplicados

### Tipos exportados:

- `DockPosition`: `'top' | 'bottom' | 'left' | 'right'`
- `SupportedLocale`: `'es' | 'en'`
- `UserConfiguration`: Interfaz completa de configuración
