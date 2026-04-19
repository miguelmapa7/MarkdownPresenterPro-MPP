# 3. Patrones de Diseño Implementados

## Patrón Observer

### ¿Qué es?

Un objeto (el "sujeto") mantiene una lista de dependientes (los "observadores") y les notifica automáticamente cuando cambia su estado.

### ¿Dónde se usa en MPP?

En la entidad `Presentation` (`src/domain/Presentation.ts`). Cuando cambias de diapositiva, la presentación notifica a todos los observadores registrados.

### ¿Por qué?

El FloatingDock necesita saber cuándo cambia la diapositiva para resaltar el icono activo. El SlideViewer necesita saber para renderizar el nuevo contenido. Sin Observer, estos componentes tendrían que "preguntar" constantemente si algo cambió (polling), lo cual es ineficiente.

### Código clave:

```typescript
// Presentation.ts
class Presentation {
  private observers: Set<ISlideObserver> = new Set();

  addObserver(observer: ISlideObserver): void {
    this.observers.add(observer);
  }

  private notifyObservers(event: SlideChangedEvent): void {
    for (const observer of this.observers) {
      observer.onSlideChanged(event);
    }
  }

  next(): SlideChangedEvent | null {
    // ... cambiar índice ...
    this.notifyObservers(event); // Notifica a TODOS los observadores
    return event;
  }
}
```

## Patrón Strategy

### ¿Qué es?

Define una familia de algoritmos intercambiables. El cliente elige cuál usar en tiempo de ejecución.

### ¿Dónde se usa en MPP?

En `RenderMarkdownUseCase` (`src/application/RenderMarkdownUseCase.ts`). Cada tipo de contenido Markdown tiene su propia estrategia de renderizado.

### ¿Por qué?

Diferentes tipos de contenido necesitan renderizado diferente: un bloque de código necesita syntax highlighting, una tabla necesita estilos de tabla, una imagen necesita un contenedor responsive. Sin Strategy, tendríamos un `if/else` gigante que crece con cada tipo nuevo.

### Código clave:

```typescript
// Interfaz que todas las estrategias implementan
interface RenderStrategy {
  canHandle(nodeType: string): boolean;
  render(content: string): string;
}

// Estrategias concretas
class CodeBlockStrategy implements RenderStrategy { ... }
class TableStrategy implements RenderStrategy { ... }
class ImageStrategy implements RenderStrategy { ... }

// Registro: la primera que pueda manejar el nodo, gana
class StrategyRegistry {
  resolve(nodeType: string): RenderStrategy | undefined {
    return this.strategies.find(s => s.canHandle(nodeType));
  }
}
```

### Beneficio:

Agregar soporte para un nuevo tipo de contenido = crear una nueva clase Strategy y registrarla. No se toca código existente (principio Open/Closed de SOLID).

## Patrón Adapter

### ¿Qué es?

Traduce la interfaz de una clase a otra interfaz que el cliente espera. Permite que clases con interfaces incompatibles trabajen juntas.

### ¿Dónde se usa en MPP?

En la capa de infraestructura. Tenemos dos adaptadores para el sistema de archivos:

- `TauriFileSystemAdapter`: Traduce la API de Tauri (`@tauri-apps/plugin-fs`) a `IFileSystemAdapter`
- `WebFileSystemAdapter`: Traduce la API File del navegador a `IFileSystemAdapter`

### ¿Por qué?

Los casos de uso (`LoadPresentationUseCase`) no deben saber si están leyendo archivos del disco nativo o de la memoria del navegador. Solo conocen la interfaz `IFileSystemAdapter`. Si mañana migramos a Electron, solo creamos un `ElectronFileSystemAdapter` sin tocar nada más.

### Código clave:

```typescript
// Interfaz (contrato)
interface IFileSystemAdapter {
  readFile(path: string): Promise<string>;
  readDirectory(path: string): Promise<FileEntry[]>;
  exists(path: string): Promise<boolean>;
}

// Adaptador Tauri (usa API nativa)
class TauriFileSystemAdapter implements IFileSystemAdapter {
  async readFile(path: string): Promise<string> {
    return await readTextFile(path); // API de Tauri
  }
}

// Adaptador Web (usa File API del navegador)
class WebFileSystemAdapter implements IFileSystemAdapter {
  async readFile(path: string): Promise<string> {
    const file = this.files.get(path);
    return file.text(); // API del navegador
  }
}
```

## Patrón Abstract Factory

### ¿Qué es?

Provee una interfaz para crear familias de objetos relacionados sin especificar sus clases concretas.

### ¿Dónde se usa en MPP?

En `AdapterFactory` (`src/infrastructure/AdapterFactory.ts`). Detecta el entorno (Tauri o Web) y crea el conjunto correcto de adaptadores.

### ¿Por qué?

`App.tsx` no debería tener lógica de `if (isTauri()) { ... } else { ... }` dispersa por todo el código. La factory centraliza esa decisión en un solo lugar.

### Código clave:

```typescript
async function createAdapters(): Promise<AdapterSet> {
  if (isTauri()) {
    const { TauriFileSystemAdapter } = await import("./TauriFileSystemAdapter");
    return { fileSystem: new TauriFileSystemAdapter(), isWeb: false };
  }
  const webFs = new WebFileSystemAdapter();
  return { fileSystem: webFs, isWeb: true, webFileSystem: webFs };
}
```
