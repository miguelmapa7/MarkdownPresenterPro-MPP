# Patrones de Diseño

## Patrón Observer

Usado para notificar cambios de diapositiva a múltiples componentes.

```typescript
// Cuando cambias de diapositiva, el Dock y el Viewer se actualizan
presentation.addObserver(dock);
presentation.addObserver(viewer);
presentation.next(); // → notifica a ambos
```

**Beneficio**: Los componentes no se conocen entre sí. Solo reaccionan a eventos.

## Patrón Strategy

Cada tipo de contenido Markdown tiene su propia estrategia de renderizado.

- `CodeBlockStrategy` → Bloques de código con syntax highlighting
- `TableStrategy` → Tablas GFM
- `ImageStrategy` → Imágenes locales/remotas
- `VideoStrategy` → Videos embebidos
- `DefaultStrategy` → Fallback para todo lo demás

**Beneficio**: Agregar soporte para un nuevo tipo = registrar una nueva estrategia.

## Patrón Adapter

Los adaptadores traducen APIs externas a interfaces internas.

- `TauriFileSystemAdapter` → Traduce Tauri API a `IFileSystemAdapter`
- `LocalPersistenceAdapter` → Traduce localStorage a `IPersistenceAdapter`

**Beneficio**: Si migramos de Tauri a Electron, solo cambiamos el adaptador.
