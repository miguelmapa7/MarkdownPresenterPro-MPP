# Arquitectura del Proyecto

## Clean Architecture

MPP sigue Clean Architecture con 4 capas independientes:

| Capa               | Responsabilidad        | Ejemplo                                  |
| ------------------ | ---------------------- | ---------------------------------------- |
| **Domain**         | Lógica de negocio pura | Slide, Presentation, MarkdownParser      |
| **Application**    | Casos de uso           | LoadPresentation, Navigate, Render       |
| **Presentation**   | Componentes UI         | FloatingDock, SlideViewer, PresenterMode |
| **Infrastructure** | Adaptadores externos   | TauriFileSystem, LocalPersistence        |

## Principio clave

Las dependencias van de afuera hacia adentro. La capa de dominio **no depende de nada externo**.

```
UI → Casos de Uso → Dominio ← Infraestructura
```
