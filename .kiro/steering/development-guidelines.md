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

## Regla 4: Cero costos en AWS

- NUNCA crear recursos en AWS sin antes verificar el estado del Free Tier de la cuenta del usuario
- SIEMPRE informar al usuario si un servicio o acción puede generar costos, por mínimos que sean
- Antes de crear cualquier recurso AWS, verificar: antigüedad de la cuenta, uso actual del Free Tier, y si el servicio tiene Free Tier permanente o de 12 meses
- Si existe riesgo de costo, DETENER y consultar al usuario antes de proceder
- Preferir siempre servicios con Free Tier permanente sobre los de 12 meses
- Documentar el costo estimado de cada recurso AWS que se proponga crear
