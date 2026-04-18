# Funcionalidades Principales

## 1. Renderizado de Markdown

Soporte completo para:

- **CommonMark**: Headings, párrafos, listas, enlaces, imágenes
- **GFM**: Tablas, listas de tareas, tachado
- **Código con syntax highlighting**:

```javascript
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
```

## 2. Navegación Dual

- **Lineal**: Flechas ← → o botones Anterior/Siguiente
- **Dock flotante**: Clic directo en cualquier diapositiva

## 3. Menú Flotante (Dock)

- Posicionable en 4 bordes (top, bottom, left, right)
- Efecto de magnificación tipo macOS al hover
- Iconos dinámicos según tipo de contenido

## 4. Modo Presentador

- Vista dividida: diapositiva actual + preview siguiente
- Cronómetro MM:SS
- Contador "N de M"
- Indicador de fin de presentación
