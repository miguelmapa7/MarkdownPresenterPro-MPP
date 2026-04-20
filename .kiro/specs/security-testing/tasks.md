# Plan de Implementación: Pruebas de Seguridad Integrales para Markdown Presenter Pro

## Visión General

Implementación incremental de las medidas de seguridad en MPP: sanitización XSS en el pipeline de renderizado, validación de entradas, endurecimiento de almacenamiento local, configuración CSP en Tauri, automatización de auditoría en CI/CD, y suite de tests de seguridad (property-based + unitarios).

## Tareas

- [ ] 1. Instalar rehype-sanitize e integrar en el pipeline de MarkdownParser
  - [ ] 1.1 Instalar la dependencia `rehype-sanitize` y sus tipos
    - Ejecutar `npm install rehype-sanitize`
    - _Requerimientos: 1.7_
  - [ ] 1.2 Crear el esquema de sanitización personalizado e integrar `rehype-sanitize` en el pipeline `htmlProcessor` de `src/domain/MarkdownParser.ts`
    - Definir `sanitizeSchema` extendiendo `defaultSchema` para preservar clases de `rehype-highlight` (`hljs-*`, `language-*`)
    - Insertar `.use(rehypeSanitize, sanitizeSchema)` después de `rehypeHighlight` y antes de `rehypeStringify`
    - Mantener `allowDangerousHtml: true` en `remarkRehype` para que el HTML embebido pase al sanitizador
    - _Requerimientos: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 9.5_

- [ ] 2. Crear el módulo InputValidator
  - [ ] 2.1 Crear `src/infrastructure/InputValidator.ts` con la interfaz `IInputValidator` y la clase `InputValidator`
    - Implementar `validateFileExtension()`: aceptar `.md`, `.markdown`, `.txt` (case-insensitive)
    - Implementar `validateFileSize()`: rechazar archivos > 10 MB con mensaje descriptivo
    - Implementar `validateMimeType()`: aceptar `text/plain`, `text/markdown`, `text/x-markdown` o extensión válida
    - Implementar `validatePath()`: detectar secuencias de traversal (`../`, `..\\`, `%2e%2e`, `%2E%2E`)
    - Implementar `validateFilename()`: rechazar caracteres nulos y de control (ASCII 0-31 excepto `\t`, `\r`, `\n`)
    - Implementar `validateFileCount()`: rechazar operaciones con más de 100 archivos
    - Implementar `validateUtf8()`: verificar secuencias UTF-8 válidas en `ArrayBuffer`
    - Implementar `validateImageUrl()`: permitir solo esquemas `https:` y `data:image/*`
    - Exportar constantes de validación (extensiones, tamaño máximo, MIME types, límite de archivos)
    - _Requerimientos: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2, 8.3, 8.4, 8.5, 12.1, 12.6_
  - [ ] 2.2 Exportar `InputValidator` desde `src/infrastructure/index.ts`
    - _Requerimientos: 2.1_

- [ ] 3. Crear el módulo SecurityLogger
  - [ ] 3.1 Crear `src/domain/SecurityLogger.ts` con la interfaz `ISecurityLogger` y la clase `SecurityLogger`
    - Definir el tipo `SecurityEvent` con campos `type`, `detail` y `timestamp`
    - Implementar `log()` para registrar eventos en consola con `console.warn`
    - Implementar `getEvents()` para retornar el historial de eventos registrados
    - _Requerimientos: 12.5_
  - [ ] 3.2 Crear un plugin rehype personalizado que compare el árbol antes y después de la sanitización para detectar contenido eliminado y registrarlo via `SecurityLogger`
    - Integrar el plugin en el pipeline de `MarkdownParser` entre `rehypeHighlight` y `rehypeSanitize`
    - _Requerimientos: 12.5_
  - [ ] 3.3 Exportar `SecurityLogger` desde `src/domain/index.ts`
    - _Requerimientos: 12.5_

- [ ] 4. Checkpoint — Verificar integración del pipeline
  - Asegurar que todos los tests existentes pasan, preguntar al usuario si surgen dudas.

- [ ] 5. Actualizar `tauri.conf.json` con la política CSP
  - [ ] 5.1 Reemplazar `"csp": null` en `src-tauri/tauri.conf.json` con la política CSP restrictiva definida en el diseño
    - `default-src: 'self'`, `script-src: 'self'`, `style-src: 'self' 'unsafe-inline'`
    - `img-src: 'self' data: https: asset: http://asset.localhost`
    - `font-src: 'self' data:`, `connect-src: ipc: http://ipc.localhost`
    - `object-src: 'none'`, `base-uri: 'self'`
    - _Requerimientos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.4, 12.2_

- [ ] 6. Añadir `npm audit` y `gitleaks` al pipeline CI/CD
  - [ ] 6.1 Añadir el paso `npm audit --audit-level=high` al job `quality` en `.github/workflows/ci.yml`
    - Insertar después del paso de tests existente
    - Falla el build si se detectan vulnerabilidades high o critical
    - _Requerimientos: 4.1, 4.2, 4.3, 12.3_
  - [ ] 6.2 Añadir el paso de `gitleaks/gitleaks-action@v2` al job `quality` en `.github/workflows/ci.yml`
    - Configurar con `GITHUB_TOKEN` para escaneo de secretos
    - Falla el build si se detectan credenciales en el código fuente
    - _Requerimientos: 11.3, 11.4_

- [ ] 7. Actualizar `LocalPersistenceAdapter` con prefijo de namespace y validación
  - [ ] 7.1 Modificar `src/infrastructure/LocalPersistenceAdapter.ts` para usar el prefijo `mpp_` en todas las claves
    - Definir constante `NAMESPACE_PREFIX = "mpp_"`
    - Definir `ALLOWED_KEYS` y `VALID_VALUES` para restringir claves y valores almacenables
    - Modificar `get()` para validar valores contra opciones permitidas, retornando valor predeterminado si es inválido
    - Modificar `set()` para anteponer el prefijo automáticamente
    - Modificar `remove()` para usar el prefijo
    - _Requerimientos: 7.1, 7.2, 7.3, 7.5_

- [ ] 8. Checkpoint — Verificar cambios de infraestructura y configuración
  - Asegurar que todos los tests existentes pasan, preguntar al usuario si surgen dudas.

- [ ] 9. Crear suite de tests de seguridad: sanitización y renderizado
  - [ ] 9.1 Crear `src/__tests__/security/sanitization.property.test.ts` con tests basados en propiedades para sanitización XSS
    - [ ]\* 9.1.1 Escribir test de propiedad para sanitización completa del HTML
      - **Propiedad 1: Sanitización completa del HTML**
      - Generar strings Markdown arbitrarios con HTML embebido malicioso (scripts, event handlers, iframes, javascript: URLs)
      - Verificar que el HTML resultante no contenga elementos/atributos prohibidos
      - **Valida: Requerimientos 1.1, 1.2, 1.3, 1.4, 1.5, 9.1, 9.2, 9.5, 12.1**
    - [ ]\* 9.1.2 Escribir test de propiedad para preservación de contenido legítimo
      - **Propiedad 2: Preservación de contenido legítimo**
      - Generar Markdown con elementos legítimos (encabezados, listas, tablas, código, imágenes HTTPS)
      - Verificar que la estructura semántica y contenido textual se preserven
      - **Valida: Requerimientos 1.6**
    - [ ]\* 9.1.3 Escribir test de propiedad para escapado correcto de bloques de código
      - **Propiedad 10: Escapado correcto de bloques de código**
      - Generar bloques de código con HTML que intente cerrar `<pre><code>` prematuramente
      - Verificar que el contenido permanezca escapado dentro del bloque
      - **Valida: Requerimientos 9.3**
    - [ ]\* 9.1.4 Escribir test de propiedad para seguridad de frontmatter
      - **Propiedad 11: Seguridad de frontmatter**
      - Generar frontmatter YAML con valores que contengan HTML/JavaScript
      - Verificar que el frontmatter no se renderice como HTML en el DOM
      - **Valida: Requerimientos 9.4**
    - [ ]\* 9.1.5 Escribir test de propiedad para registro de intentos de inyección
      - **Propiedad 13: Registro de intentos de inyección**
      - Generar Markdown con contenido malicioso
      - Verificar que `SecurityLogger` registre al menos un evento de seguridad
      - **Valida: Requerimientos 12.5**

- [ ] 10. Crear suite de tests de seguridad: validación de entradas
  - [ ] 10.1 Crear `src/__tests__/security/input-validation.property.test.ts` con tests basados en propiedades para InputValidator
    - [ ]\* 10.1.1 Escribir test de propiedad para validación de extensión de archivo
      - **Propiedad 3: Validación de extensión de archivo**
      - Generar nombres de archivo arbitrarios, verificar aceptación solo de `.md`, `.markdown`, `.txt`
      - **Valida: Requerimientos 2.1, 2.2**
    - [ ]\* 10.1.2 Escribir test de propiedad para validación de tamaño de archivo
      - **Propiedad 4: Validación de tamaño de archivo**
      - Generar tamaños arbitrarios, verificar rechazo > 10 MB con mensaje descriptivo
      - **Valida: Requerimientos 2.3**
    - [ ]\* 10.1.3 Escribir test de propiedad para rechazo de codificación no UTF-8
      - **Propiedad 5: Rechazo de codificación no UTF-8**
      - Generar secuencias de bytes con secuencias UTF-8 inválidas
      - **Valida: Requerimientos 2.4**
    - [ ]\* 10.1.4 Escribir test de propiedad para prevención de traversal de rutas
      - **Propiedad 6: Prevención de traversal de rutas**
      - Generar rutas con secuencias de traversal (`../`, `..\\`, `%2e%2e`)
      - **Valida: Requerimientos 8.2, 8.3**
    - [ ]\* 10.1.5 Escribir test de propiedad para rechazo de caracteres de control
      - **Propiedad 7: Rechazo de caracteres de control en nombres de archivo**
      - Generar nombres con caracteres nulos y de control (ASCII 0-31 excepto `\t`, `\r`, `\n`)
      - **Valida: Requerimientos 8.4**
    - [ ]\* 10.1.6 Escribir test de propiedad para límite de archivos por carga
      - **Propiedad 8: Límite de archivos por operación de carga**
      - Generar conteos arbitrarios, verificar rechazo > 100
      - **Valida: Requerimientos 8.5**
    - [ ]\* 10.1.7 Escribir test de propiedad para validación de tipo MIME
      - **Propiedad 9: Validación de tipo MIME en modo web**
      - Generar combinaciones de MIME type y extensión, verificar lógica de aceptación/rechazo
      - **Valida: Requerimientos 8.1**
    - [ ]\* 10.1.8 Escribir test de propiedad para validación HTTPS de recursos externos
      - **Propiedad 14: Validación HTTPS para recursos externos**
      - Generar URLs con esquemas variados, verificar que solo `https:` y `data:image/*` se acepten
      - **Valida: Requerimientos 12.6**

- [ ] 11. Crear suite de tests de seguridad: almacenamiento local
  - [ ]\* 11.1 Crear `src/__tests__/security/local-storage.property.test.ts` con tests basados en propiedades para LocalPersistenceAdapter
    - **Propiedad 12: Round-trip de almacenamiento local con validación**
    - Generar valores válidos de preferencias, verificar round-trip correcto
    - Generar valores inválidos (JSON corrupto, fuera de rango), verificar retorno de valor predeterminado
    - Verificar que todas las claves usen el prefijo `mpp_`
    - **Valida: Requerimientos 7.1, 7.2, 7.3, 7.5**

- [ ] 12. Checkpoint — Verificar suite de tests de seguridad
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

- [ ] 13. Crear tests unitarios de configuración (smoke tests)
  - [ ]\* 13.1 Crear `src/__tests__/security/csp-config.test.ts`
    - Verificar que `tauri.conf.json` tenga CSP definida (no `null`)
    - Verificar directivas: `default-src`, `script-src`, `style-src`, `img-src`, `object-src`
    - Verificar que `capabilities/default.json` solo tenga permisos de lectura y diálogo de apertura
    - _Requerimientos: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.1, 5.2, 5.3, 5.4_
  - [ ]\* 13.2 Crear `src/__tests__/security/ci-security.test.ts`
    - Verificar que `ci.yml` contenga el paso `npm audit`
    - Verificar que `ci.yml` contenga el paso `gitleaks`
    - Verificar que secretos de AWS se referencien via `${{ secrets.* }}`
    - Verificar que `.gitignore` incluya `.env`
    - _Requerimientos: 4.1, 4.2, 4.3, 11.1, 11.2, 11.3, 11.4, 11.5_
  - [ ]\* 13.3 Crear `src/__tests__/security/security-headers.test.ts`
    - Verificar definición de cabeceras de seguridad esperadas para CloudFront
    - Verificar valores de `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
    - _Requerimientos: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 14. Documentar configuración de cabeceras de seguridad en CloudFront (pasos manuales para el usuario)
  - [ ] 14.1 Crear `docs/technical/12-seguridad-cloudfront.md` con la guía de configuración manual
    - Documentar la Response Headers Policy de CloudFront con todas las cabeceras de seguridad
    - Documentar la configuración de WAF con rate limiting (2000 req/5 min) y AWS Managed Rules
    - Documentar la configuración de CORS para permitir solo el origen de la distribución CloudFront
    - Documentar la redirección HTTP → HTTPS en CloudFront
    - Incluir advertencia sobre posibles costos de WAF (no incluido en Free Tier)
    - _Requerimientos: 3.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 10.1, 10.2, 10.3, 10.4_

- [ ] 15. Checkpoint final — Verificar implementación completa
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

## Notas

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requerimientos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedades validan propiedades universales de corrección definidas en el diseño
- Los tests unitarios (smoke) validan configuraciones estáticas y archivos de infraestructura
- `fast-check` v4.7.0 ya está instalada en `devDependencies`
- La documentación de CloudFront (tarea 14) es para configuración manual del usuario en AWS Console — incluye advertencia de costos de WAF
