# 4. Capa de Dominio — Lógica de Negocio

La capa de dominio contiene la lógica pura del negocio. No depende de React, Tauri, ni ningún framework. Es código TypeScript puro que se puede ejecutar en cualquier entorno.

## Entidad: Slide (`src/domain/Slide.ts`)

Representa una diapositiva individual dentro de una presentación.

### Propiedades:

- `id`: UUID único generado automáticamente
- `rawMarkdown`: El texto Markdown original de la diapositiva
- `metadata`: Información sobre la diapositiva (título, tipo de contenido, icono, archivo de origen)
- `cachedHtml`: HTML renderizado en caché (evita re-procesamiento)

### Tipos asociados:

- `SlideContentType`: `'code' | 'image' | 'text' | 'table' | 'mixed'` — clasifica el contenido predominante
- `SlideMetadata`: Interfaz con título, icono opcional, tipo de contenido y archivo de origen

### ¿Por qué el caché?

Renderizar Markdown a HTML es costoso (parseo → AST → transformación → HTML). Si el usuario navega adelante y atrás, no queremos re-renderizar cada vez. El caché guarda el HTML la primera vez y lo reutiliza.

## Entidad: Presentation (`src/domain/Presentation.ts`)

Colección ordenada de diapositivas con estado de navegación y patrón Observer.

### Navegación:

- `next()`: Avanza a la siguiente diapositiva. Retorna `null` si ya está en la última.
- `previous()`: Retrocede. Retorna `null` si ya está en la primera.
- `goToSlide(index)`: Salta a un índice específico. Lanza `RangeError` si está fuera de rango.

### Observer:

- `addObserver(observer)`: Registra un componente para recibir notificaciones
- `removeObserver(observer)`: Desregistra un componente
- Cada cambio de diapositiva emite un `SlideChangedEvent` con: índice anterior, índice nuevo, diapositiva actual, total de diapositivas

### Invariantes (reglas que siempre se cumplen):

- Una presentación siempre tiene al menos 1 diapositiva
- El índice siempre está en el rango `[0, totalSlides - 1]`
- `next()` en la última diapositiva no modifica el estado
- `previous()` en la primera diapositiva no modifica el estado

## Servicio: MarkdownParser (`src/domain/MarkdownParser.ts`)

Procesa Markdown usando el ecosistema Unified.js. Tiene 3 pipelines:

### Pipeline de Parseo (Markdown → AST)

```
Texto Markdown → remarkParse → remarkGfm → remarkFrontmatter → AST (mdast)
```

- `remarkParse`: Convierte texto Markdown en un Árbol de Sintaxis Abstracta (AST)
- `remarkGfm`: Agrega soporte para tablas, listas de tareas y tachado de GitHub
- `remarkFrontmatter`: Permite metadatos YAML al inicio del archivo

### Pipeline de Renderizado (Markdown → HTML)

```
Texto Markdown → parseo → remarkRehype → rehypeHighlight → rehypeStringify → HTML
```

- `remarkRehype`: Transforma AST de Markdown (mdast) a AST de HTML (hast)
- `rehypeHighlight`: Aplica syntax highlighting a bloques de código
- `rehypeStringify`: Convierte AST de HTML a string HTML final

### Pipeline de Formateo (AST → Markdown)

```
AST (mdast) → remarkStringify → remarkGfm → Texto Markdown
```

Usado para la propiedad round-trip: `parse(format(parse(md))) ≡ parse(md)`

## Servicio: IconResolver (`src/domain/IconResolver.ts`)

Resuelve qué icono mostrar para cada diapositiva en el Dock.

### Dos modos:

- **"varied"** (predeterminado): Cada diapositiva recibe un icono diferente cíclicamente (estrella, bombilla, cohete, engranaje, corazón, rayo, globo, bandera)
- **"content"**: Icono basado en el tipo de contenido (código → `</>`, imagen → paisaje, tabla → grilla, texto → líneas)

### Cadena de prioridad:

1. Icono personalizado en metadatos del Markdown → usa ese
2. Modo "varied" → icono cíclico por índice
3. Modo "content" → icono por tipo de contenido
4. Fallback → icono genérico de documento
