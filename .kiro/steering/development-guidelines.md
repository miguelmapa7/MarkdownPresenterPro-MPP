---
inclusion: always
---

# Guías de Desarrollo para Markdown Presenter Pro

## Regla 1: Comandos de consola explícitos

Por cada solución a implementar, SIEMPRE proporciona el comando exacto que se debe ejecutar en la consola. No ejecutes comandos automáticamente a menos que el usuario lo solicite explícitamente. El usuario ejecutará los comandos por su cuenta para aprender.

Formato esperado:

```bash
# Descripción breve de qué hace este comando
comando-a-ejecutar
```

## Regla 2: Explicación de conceptos técnicos

Cada vez que se introduzca un concepto técnico nuevo o se implemente un patrón de diseño, explica brevemente:

- Qué es y para qué sirve
- Por qué se usa en este contexto específico
- Cómo se relaciona con el resto de la arquitectura

Mantén las explicaciones concisas pero claras. El objetivo es que el desarrollador entienda lo que está construyendo, no solo copie código.

## Regla 3: Flujo de trabajo

- El usuario lidera la ejecución de comandos
- Kiro propone, explica y guía
- Solo ejecutar comandos cuando el usuario diga explícitamente "ejecútalo", "hazlo tú", "run it" o similar
