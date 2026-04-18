# Estrategia de Pruebas

## Enfoque Dual

### Pruebas Unitarias (Example-Based)

Verifican comportamientos específicos con ejemplos concretos:

```typescript
test("next() avanza a la siguiente diapositiva", () => {
  const pres = new Presentation([slide1, slide2]);
  pres.next();
  expect(pres.getCurrentIndex()).toBe(1);
});
```

### Pruebas Basadas en Propiedades (Property-Based)

Verifican propiedades universales con cientos de casos aleatorios:

```typescript
// Para CUALQUIER presentación con N slides y CUALQUIER secuencia de acciones,
// el índice siempre está dentro de [0, N-1]
it.prop([presentationArb, actionsArb])("índice siempre válido", (pres, actions) => {
  actions.forEach((action) => action(pres));
  expect(pres.getCurrentIndex()).toBeGreaterThanOrEqual(0);
  expect(pres.getCurrentIndex()).toBeLessThan(pres.getTotalSlides());
});
```

## Herramientas

- **Vitest** — Framework de pruebas nativo de Vite
- **fast-check** — Generación aleatoria de datos para PBT
- **Testing Library** — Tests de componentes React

## Propiedades de Correctitud

14 propiedades formales definidas, incluyendo:

- Round-trip de parseo Markdown
- Correctitud del estado de navegación
- Invariante de notificación del Observer
- Correctitud del algoritmo de magnificación
