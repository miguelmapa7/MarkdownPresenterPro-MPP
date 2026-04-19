# 10. Principios SOLID Aplicados

SOLID es un conjunto de 5 principios de diseño orientado a objetos que hacen el código más mantenible, extensible y testeable.

## S — Single Responsibility Principle (Responsabilidad Única)

**Cada clase/módulo tiene una sola razón para cambiar.**

### En MPP:

- `Slide` solo se encarga de almacenar datos de una diapositiva
- `MarkdownParser` solo se encarga de parsear/renderizar Markdown
- `IconResolver` solo se encarga de resolver iconos
- `LoadPresentationUseCase` solo se encarga de cargar presentaciones

Si necesitas cambiar cómo se parsea Markdown, solo tocas `MarkdownParser`. Si necesitas cambiar cómo se resuelven iconos, solo tocas `IconResolver`.

## O — Open/Closed Principle (Abierto/Cerrado)

**Las entidades deben estar abiertas para extensión pero cerradas para modificación.**

### En MPP:

El `StrategyRegistry` permite agregar nuevos tipos de renderizado sin modificar código existente:

```typescript
// Agregar soporte para diagramas Mermaid:
class MermaidStrategy implements RenderStrategy {
  canHandle(nodeType: string) {
    return nodeType === "mermaid";
  }
  render(content: string) {
    /* renderizar diagrama */
  }
}
registry.register(new MermaidStrategy()); // Sin tocar código existente
```

## L — Liskov Substitution Principle (Sustitución de Liskov)

**Los objetos de una clase derivada deben poder sustituir a los de la clase base sin alterar el comportamiento.**

### En MPP:

`TauriFileSystemAdapter` y `WebFileSystemAdapter` implementan la misma interfaz `IFileSystemAdapter`. `LoadPresentationUseCase` funciona igual con cualquiera de los dos — no necesita saber cuál está usando.

## I — Interface Segregation Principle (Segregación de Interfaces)

**Los clientes no deben depender de interfaces que no usan.**

### En MPP:

- `IFileSystemAdapter` tiene solo 3 métodos: `readFile`, `readDirectory`, `exists`
- `IPersistenceAdapter` tiene solo 3 métodos: `get`, `set`, `remove`
- `IMarkdownParser` tiene solo 3 métodos: `parse`, `format`, `toHtml`

Interfaces pequeñas y enfocadas. Ningún adaptador implementa métodos que no necesita.

## D — Dependency Inversion Principle (Inversión de Dependencias)

**Los módulos de alto nivel no deben depender de módulos de bajo nivel. Ambos deben depender de abstracciones.**

### En MPP:

`LoadPresentationUseCase` (alto nivel) no depende de `TauriFileSystemAdapter` (bajo nivel). Ambos dependen de la interfaz `IFileSystemAdapter` (abstracción).

```typescript
// El caso de uso recibe la interfaz, no la implementación
class LoadPresentationUseCase {
  constructor(
    private fileSystem: IFileSystemAdapter, // ← Interfaz
    private parser: IMarkdownParser, // ← Interfaz
    private iconResolver: IIconResolver // ← Interfaz
  ) {}
}
```

Esto permite:

- Testear con mocks (inyectar un adapter falso)
- Cambiar de Tauri a Web sin tocar el caso de uso
- Agregar nuevas implementaciones sin modificar código existente
