# Documento de Requerimientos: Pruebas de Seguridad Integrales para Markdown Presenter Pro

## Introducción

Markdown Presenter Pro (MPP) opera en modo dual: como aplicación de escritorio empaquetada con Tauri 2.0 y como aplicación web estática desplegada en AWS (S3 + CloudFront). Este documento especifica los requerimientos de seguridad que cubren todos los vectores de ataque relevantes para ambos modos de ejecución. El objetivo es garantizar que MPP sanitice contenido potencialmente malicioso en archivos Markdown, valide todas las entradas del usuario, proteja los datos almacenados localmente, minimice la superficie de ataque en Tauri, aplique cabeceras de seguridad en la versión web y cumpla con las prácticas recomendadas de OWASP Top 10 para aplicaciones web.

Actualmente, MPP utiliza `dangerouslySetInnerHTML` en el componente `SlideViewer` para renderizar HTML generado por el pipeline Unified.js (Markdown → AST → HTML). El pipeline de renderizado usa `remarkRehype` con la opción `allowDangerousHtml: true`, lo que permite que HTML embebido en archivos Markdown pase directamente al DOM sin sanitización. La configuración de Tauri tiene `"csp": null` en `tauri.conf.json`, deshabilitando la Content Security Policy. Estos son los vectores de riesgo principales que este documento aborda.

## Glosario

- **MPP**: Markdown Presenter Pro, la aplicación principal objeto de esta especificación.
- **Sanitizador_HTML**: Componente responsable de limpiar y neutralizar contenido HTML potencialmente malicioso antes de su inserción en el DOM, eliminando scripts, event handlers y elementos peligrosos mientras preserva el formato visual legítimo.
- **Validador_Entrada**: Componente responsable de verificar que los archivos y datos proporcionados por el usuario cumplan con los criterios de tipo, tamaño, formato y estructura esperados antes de su procesamiento.
- **Politica_CSP**: Conjunto de directivas Content Security Policy configuradas tanto en Tauri (`tauri.conf.json`) como en CloudFront (cabeceras HTTP) que restringen las fuentes de contenido ejecutable permitidas en la aplicación.
- **Auditor_Dependencias**: Proceso automatizado que analiza el árbol de dependencias de npm en busca de vulnerabilidades conocidas registradas en bases de datos públicas de seguridad (CVE, GitHub Advisory Database).
- **Configuracion_Tauri**: Conjunto de archivos de configuración de Tauri (`tauri.conf.json`, `capabilities/default.json`) que definen los permisos y capacidades de la aplicación de escritorio.
- **Cabeceras_Seguridad_Web**: Conjunto de cabeceras HTTP de seguridad (Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) configuradas en CloudFront para la versión web.
- **Almacenamiento_Local**: Mecanismo de persistencia basado en `localStorage` del navegador utilizado por `LocalPersistenceAdapter` para guardar preferencias del usuario (tema, idioma, posición del Dock).
- **Pipeline_Renderizado**: Cadena de procesamiento Unified.js que transforma Markdown en HTML: `remarkParse` → `remarkGfm` → `remarkRehype` → `rehypeHighlight` → `rehypeStringify`.
- **WAF_CloudFront**: AWS Web Application Firewall asociado a la distribución CloudFront que filtra tráfico malicioso mediante reglas predefinidas.
- **Gestor_Secretos**: Conjunto de prácticas y mecanismos que garantizan que credenciales, tokens y claves de API se gestionen exclusivamente mediante variables de entorno y GitHub Secrets, sin presencia en el código fuente.
- **OWASP_Top_10**: Lista de las diez categorías de riesgos de seguridad más críticos para aplicaciones web, publicada por la Open Web Application Security Project.
- **Rehype_Sanitize**: Plugin del ecosistema rehype que sanitiza árboles HTML (hast) eliminando elementos y atributos peligrosos según un esquema configurable.
- **Traversal_Rutas**: Técnica de ataque que manipula rutas de archivos (usando secuencias como `../`) para acceder a archivos fuera del directorio permitido.

## Requerimientos

### Requerimiento 1: Prevención de Cross-Site Scripting (XSS) en Renderizado Markdown

**Historia de Usuario:** Como usuario de MPP, quiero que el contenido Markdown renderizado esté sanitizado contra scripts maliciosos, para poder abrir archivos Markdown de fuentes no confiables sin riesgo de ejecución de código arbitrario en mi navegador o aplicación de escritorio.

#### Criterios de Aceptación

1. WHEN un archivo Markdown contiene etiquetas `<script>` embebidas en el contenido, THE Sanitizador_HTML SHALL eliminar las etiquetas `<script>` y su contenido del HTML renderizado antes de la inserción en el DOM.
2. WHEN un archivo Markdown contiene atributos de event handler en elementos HTML (como `onclick`, `onerror`, `onload`, `onmouseover`), THE Sanitizador_HTML SHALL eliminar los atributos de event handler del HTML renderizado.
3. WHEN un archivo Markdown contiene URLs con esquema `javascript:` en enlaces o imágenes (como `[link](javascript:alert(1))`), THE Sanitizador_HTML SHALL reemplazar la URL maliciosa con una URL vacía o eliminar el atributo `href`/`src`.
4. WHEN un archivo Markdown contiene elementos `<iframe>`, `<object>`, `<embed>` o `<form>` embebidos, THE Sanitizador_HTML SHALL eliminar los elementos peligrosos del HTML renderizado.
5. WHEN un archivo Markdown contiene atributos `style` con expresiones CSS maliciosas (como `expression()`, `url(javascript:)`, `-moz-binding`), THE Sanitizador_HTML SHALL eliminar los atributos `style` que contengan expresiones ejecutables.
6. THE Sanitizador_HTML SHALL preservar los elementos HTML legítimos generados por el Pipeline_Renderizado, incluyendo encabezados, párrafos, listas, tablas, bloques de código con resaltado de sintaxis e imágenes con URLs HTTP/HTTPS.
7. THE Sanitizador_HTML SHALL integrarse en el Pipeline_Renderizado como un plugin rehype (`rehype-sanitize`) ejecutado después de `rehype-highlight` y antes de `rehype-stringify`.

### Requerimiento 2: Validación de Entrada de Archivos

**Historia de Usuario:** Como usuario de MPP, quiero que la aplicación valide los archivos que cargo antes de procesarlos, para evitar que archivos malformados, excesivamente grandes o de tipo incorrecto causen errores o comportamientos inesperados.

#### Criterios de Aceptación

1. WHEN el usuario selecciona un archivo para carga, THE Validador_Entrada SHALL verificar que la extensión del archivo sea `.md`, `.markdown` o `.txt` antes de iniciar el procesamiento.
2. WHEN el usuario selecciona un archivo cuya extensión no es `.md`, `.markdown` ni `.txt`, THE Validador_Entrada SHALL rechazar el archivo y mostrar un mensaje de error indicando las extensiones de archivo soportadas.
3. WHEN el usuario selecciona un archivo cuyo tamaño excede 10 MB, THE Validador_Entrada SHALL rechazar el archivo y mostrar un mensaje de error indicando el tamaño máximo permitido y el tamaño del archivo proporcionado.
4. WHEN el usuario carga un archivo Markdown que contiene secuencias de bytes no válidas en UTF-8, THE Validador_Entrada SHALL rechazar el archivo y mostrar un mensaje de error indicando que el archivo contiene codificación no soportada.
5. WHEN el usuario carga un archivo Markdown vacío (0 bytes), THE Validador_Entrada SHALL mostrar un mensaje informativo indicando que el archivo no contiene contenido para presentar.
6. WHEN el usuario carga un archivo Markdown que contiene contenido válido mezclado con secciones malformadas, THE Validador_Entrada SHALL permitir el procesamiento del archivo y THE Pipeline_Renderizado SHALL renderizar las secciones válidas como HTML y las secciones malformadas como texto plano.

### Requerimiento 3: Content Security Policy (CSP)

**Historia de Usuario:** Como desarrollador de MPP, quiero configurar políticas de seguridad de contenido restrictivas tanto en la versión Tauri como en la versión web, para limitar las fuentes de contenido ejecutable y reducir el impacto de vulnerabilidades XSS residuales.

#### Criterios de Aceptación

1. THE Politica_CSP SHALL configurar la directiva `script-src` para permitir únicamente scripts del mismo origen (`'self'`) en la versión web de MPP.
2. THE Politica_CSP SHALL configurar la directiva `style-src` para permitir estilos del mismo origen (`'self'`) y estilos inline (`'unsafe-inline'`) necesarios para Tailwind CSS y Framer Motion.
3. THE Politica_CSP SHALL configurar la directiva `img-src` para permitir imágenes del mismo origen (`'self'`), data URIs (`data:`) e imágenes remotas via HTTPS (`https:`).
4. THE Politica_CSP SHALL configurar la directiva `default-src` como `'self'` para restringir todas las fuentes de contenido no especificadas explícitamente al mismo origen.
5. THE Politica_CSP SHALL configurar la directiva `object-src` como `'none'` para bloquear la carga de plugins (Flash, Java applets, Silverlight).
6. WHEN MPP se ejecuta en Modo_Escritorio, THE Configuracion_Tauri SHALL definir la CSP en el campo `app.security.csp` de `tauri.conf.json` reemplazando el valor actual `null` con una política restrictiva.
7. WHEN MPP se despliega en la versión web, THE Cabeceras_Seguridad_Web SHALL incluir la cabecera `Content-Security-Policy` en las respuestas de CloudFront con las directivas definidas.

### Requerimiento 4: Auditoría de Dependencias

**Historia de Usuario:** Como desarrollador de MPP, quiero que el pipeline de CI/CD verifique automáticamente las dependencias del proyecto en busca de vulnerabilidades conocidas, para detectar y remediar riesgos de seguridad introducidos por paquetes de terceros.

#### Criterios de Aceptación

1. WHEN el Pipeline_CICD ejecuta la etapa de calidad, THE Auditor_Dependencias SHALL ejecutar `npm audit` sobre el árbol de dependencias del proyecto y reportar las vulnerabilidades encontradas con su nivel de severidad (low, moderate, high, critical).
2. IF el Auditor_Dependencias detecta vulnerabilidades de severidad `high` o `critical`, THEN THE Pipeline_CICD SHALL marcar la etapa como fallida y bloquear el merge hasta que las vulnerabilidades sean resueltas o documentadas como excepciones aceptadas.
3. THE Auditor_Dependencias SHALL ejecutarse en cada pull request y en cada push a la rama principal como parte del job de calidad existente.
4. THE Auditor_Dependencias SHALL generar un reporte legible que incluya el nombre del paquete vulnerable, la versión afectada, la severidad, el identificador CVE o GHSA y la versión que corrige la vulnerabilidad.

### Requerimiento 5: Seguridad de Configuración Tauri

**Historia de Usuario:** Como desarrollador de MPP, quiero que la configuración de permisos de Tauri siga el principio de mínimo privilegio, para que la aplicación de escritorio solo tenga acceso a las capacidades del sistema operativo estrictamente necesarias para su funcionamiento.

#### Criterios de Aceptación

1. THE Configuracion_Tauri SHALL limitar los permisos del sistema de archivos en `capabilities/default.json` exclusivamente a operaciones de lectura (`fs:allow-read-file`, `fs:allow-read-dir`, `fs:allow-exists`), sin incluir permisos de escritura, eliminación ni creación de archivos.
2. THE Configuracion_Tauri SHALL limitar los permisos de diálogo en `capabilities/default.json` exclusivamente a la apertura de archivos (`dialog:allow-open`), sin incluir permisos para diálogos de guardado.
3. THE Configuracion_Tauri SHALL restringir las capacidades a la ventana principal (`"windows": ["main"]`) sin otorgar permisos a ventanas adicionales.
4. THE Configuracion_Tauri SHALL definir una Content Security Policy válida en `tauri.conf.json` reemplazando el valor `null` actual del campo `app.security.csp`.
5. IF un desarrollador agrega un nuevo permiso a `capabilities/default.json`, THEN THE Pipeline_CICD SHALL verificar que el permiso agregado esté documentado con una justificación en el pull request.

### Requerimiento 6: Seguridad de la Versión Web (HTTPS, Cabeceras, CORS)

**Historia de Usuario:** Como usuario de la versión web de MPP, quiero que la aplicación se sirva exclusivamente sobre HTTPS con cabeceras de seguridad apropiadas, para proteger la integridad de la aplicación y prevenir ataques de intermediario, clickjacking y sniffing de contenido.

#### Criterios de Aceptación

1. THE Cabeceras_Seguridad_Web SHALL configurar la cabecera `Strict-Transport-Security` con el valor `max-age=31536000; includeSubDomains` para forzar conexiones HTTPS durante un año.
2. THE Cabeceras_Seguridad_Web SHALL configurar la cabecera `X-Content-Type-Options` con el valor `nosniff` para prevenir que el navegador interprete respuestas con un tipo MIME diferente al declarado.
3. THE Cabeceras_Seguridad_Web SHALL configurar la cabecera `X-Frame-Options` con el valor `DENY` para prevenir que MPP sea embebido en iframes de otros sitios (protección contra clickjacking).
4. THE Cabeceras_Seguridad_Web SHALL configurar la cabecera `Referrer-Policy` con el valor `strict-origin-when-cross-origin` para limitar la información de referencia enviada en solicitudes cross-origin.
5. THE Cabeceras_Seguridad_Web SHALL configurar la cabecera `Permissions-Policy` para deshabilitar APIs del navegador no utilizadas por MPP (camera, microphone, geolocation, payment).
6. THE Hosting_Estatico_AWS SHALL servir todos los recursos de MPP exclusivamente sobre HTTPS, redirigiendo las solicitudes HTTP a HTTPS mediante la configuración de CloudFront.
7. THE Cabeceras_Seguridad_Web SHALL configurar CORS para permitir solicitudes únicamente desde el origen de la distribución CloudFront de MPP, rechazando solicitudes cross-origin de otros dominios.

### Requerimiento 7: Seguridad del Almacenamiento Local (localStorage)

**Historia de Usuario:** Como usuario de MPP, quiero que la aplicación no almacene datos sensibles en localStorage y maneje la corrupción de datos almacenados de forma elegante, para proteger mi privacidad y garantizar la estabilidad de la aplicación.

#### Criterios de Aceptación

1. THE Almacenamiento_Local SHALL almacenar exclusivamente preferencias de configuración no sensibles: tema visual (light/dark), idioma preferido (es/en) y posición del Dock (top/bottom/left/right).
2. THE Almacenamiento_Local SHALL validar el formato y los valores de los datos leídos de localStorage antes de utilizarlos, verificando que los valores correspondan a opciones válidas definidas en la aplicación.
3. IF los datos leídos de localStorage están corruptos (JSON inválido o valores fuera de rango), THEN THE Almacenamiento_Local SHALL descartar los datos corruptos, registrar una advertencia en la consola y utilizar los valores predeterminados de la aplicación.
4. IF localStorage no está disponible en el navegador (modo privado, cuota excedida, deshabilitado), THEN THE Almacenamiento_Local SHALL utilizar un almacenamiento en memoria como respaldo sin interrumpir el funcionamiento de la aplicación.
5. THE Almacenamiento*Local SHALL utilizar un prefijo de namespace (`mpp*`) para todas las claves almacenadas en localStorage, evitando colisiones con datos de otras aplicaciones en el mismo dominio.

### Requerimiento 8: Seguridad en la Carga de Archivos

**Historia de Usuario:** Como usuario de MPP, quiero que la aplicación valide exhaustivamente los archivos que cargo y prevenga ataques de traversal de rutas, para evitar que archivos maliciosos comprometan la seguridad de mi sistema.

#### Criterios de Aceptación

1. WHEN el usuario carga un archivo en Modo_Web, THE Validador_Entrada SHALL verificar que el tipo MIME del archivo sea compatible con texto plano o Markdown (`text/plain`, `text/markdown`, `text/x-markdown`) o que la extensión sea `.md`, `.markdown` o `.txt`.
2. WHEN el usuario carga un archivo en Modo_Escritorio mediante el diálogo de Tauri, THE Validador_Entrada SHALL verificar que la ruta del archivo no contenga secuencias de Traversal_Rutas (`../`, `..\\`, `%2e%2e`) que intenten acceder a directorios fuera del alcance permitido.
3. WHEN el usuario carga una carpeta en Modo_Web mediante `webkitdirectory`, THE Validador_Entrada SHALL verificar que las rutas relativas (`webkitRelativePath`) de los archivos contenidos no incluyan secuencias de Traversal_Rutas.
4. THE Validador_Entrada SHALL rechazar archivos cuyo nombre contenga caracteres nulos (`\0`) o caracteres de control (códigos ASCII 0-31 excepto tabulación, retorno de carro y nueva línea).
5. WHEN el usuario carga múltiples archivos simultáneamente, THE Validador_Entrada SHALL aplicar un límite de 100 archivos por operación de carga y rechazar la operación si se excede el límite, mostrando un mensaje de error descriptivo.

### Requerimiento 9: Prevención de Inyección Markdown/HTML

**Historia de Usuario:** Como usuario de MPP, quiero que el contenido Markdown sea procesado de forma segura sin permitir que construcciones Markdown especiales inyecten HTML o JavaScript arbitrario, para poder visualizar presentaciones de cualquier fuente sin riesgo.

#### Criterios de Aceptación

1. WHEN un archivo Markdown contiene enlaces con URLs que utilizan esquemas peligrosos (`javascript:`, `vbscript:`, `data:text/html`), THE Sanitizador_HTML SHALL neutralizar los enlaces eliminando el atributo `href` o reemplazándolo con una URL vacía.
2. WHEN un archivo Markdown contiene imágenes con atributos `onerror` o `onload` inyectados mediante HTML embebido, THE Sanitizador_HTML SHALL eliminar los atributos de event handler de las etiquetas de imagen.
3. WHEN un archivo Markdown contiene bloques de código con etiquetas HTML que intentan cerrar el bloque `<pre><code>` prematuramente e inyectar HTML arbitrario, THE Pipeline_Renderizado SHALL escapar correctamente el contenido dentro de los bloques de código.
4. WHEN un archivo Markdown contiene directivas frontmatter con valores que incluyen HTML o JavaScript, THE Pipeline_Renderizado SHALL tratar el contenido frontmatter como datos estructurados sin renderizarlo como HTML.
5. FOR ALL archivos Markdown procesados por el Pipeline_Renderizado, el HTML resultante SHALL contener exclusivamente elementos y atributos permitidos por el esquema de sanitización definido en Rehype_Sanitize.

### Requerimiento 10: Protección contra DDoS (CloudFront WAF)

**Historia de Usuario:** Como desarrollador de MPP, quiero proteger la versión web contra ataques de denegación de servicio distribuido, para garantizar la disponibilidad de la aplicación para usuarios legítimos.

#### Criterios de Aceptación

1. THE WAF_CloudFront SHALL configurar una regla de rate limiting que limite las solicitudes por dirección IP a un máximo de 2000 solicitudes en un período de 5 minutos.
2. THE WAF_CloudFront SHALL configurar las reglas administradas de AWS (AWS Managed Rules) para el conjunto de reglas base (AWSManagedRulesCommonRuleSet) que protege contra patrones de ataque comunes.
3. IF una dirección IP excede el límite de rate limiting, THEN THE WAF_CloudFront SHALL bloquear las solicitudes de esa dirección IP durante 5 minutos y retornar un código de estado HTTP 403.
4. THE WAF_CloudFront SHALL registrar las solicitudes bloqueadas en CloudWatch Logs para análisis y monitoreo de incidentes de seguridad.

### Requerimiento 11: Gestión de Secretos

**Historia de Usuario:** Como desarrollador de MPP, quiero garantizar que ninguna credencial, token o clave de API esté presente en el código fuente del repositorio, para prevenir la exposición accidental de secretos y cumplir con las mejores prácticas de seguridad.

#### Criterios de Aceptación

1. THE Gestor_Secretos SHALL garantizar que las credenciales de AWS (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) se gestionen exclusivamente mediante GitHub Secrets y se referencien en los workflows de GitHub Actions mediante la sintaxis `${{ secrets.NOMBRE }}`.
2. THE Gestor_Secretos SHALL garantizar que los identificadores de infraestructura (`S3_BUCKET_NAME`, `CLOUDFRONT_DISTRIBUTION_ID`) se gestionen mediante GitHub Secrets sin presencia en el código fuente del repositorio.
3. THE Pipeline_CICD SHALL incluir un paso de escaneo de secretos que analice el código fuente y los archivos de configuración en busca de patrones que coincidan con credenciales, tokens o claves de API hardcodeadas.
4. IF el escaneo de secretos detecta un patrón que coincida con una credencial potencial en el código fuente, THEN THE Pipeline_CICD SHALL marcar la etapa como fallida y bloquear el merge.
5. THE Gestor_Secretos SHALL garantizar que los archivos `.env` que contengan variables de entorno sensibles estén incluidos en `.gitignore` para prevenir su inclusión accidental en el repositorio.

### Requerimiento 12: Cobertura OWASP Top 10

**Historia de Usuario:** Como desarrollador de MPP, quiero que la aplicación aborde las categorías relevantes del OWASP Top 10 para aplicaciones web, para cumplir con los estándares de seguridad de la industria y proteger a los usuarios contra las vulnerabilidades más comunes.

#### Criterios de Aceptación

1. WHEN MPP procesa contenido Markdown proporcionado por el usuario (A03:2021 — Inyección), THE Sanitizador_HTML SHALL sanitizar todo el HTML generado para prevenir inyección de scripts, y THE Validador_Entrada SHALL validar todas las entradas de archivo antes del procesamiento.
2. THE Politica_CSP SHALL estar configurada y activa tanto en Modo_Escritorio como en Modo_Web (A05:2021 — Configuración de Seguridad Incorrecta), reemplazando la configuración actual de `"csp": null` en Tauri.
3. THE Pipeline_CICD SHALL ejecutar auditoría de dependencias en cada build (A06:2021 — Componentes Vulnerables y Desactualizados) para detectar y reportar paquetes con vulnerabilidades conocidas.
4. THE Cabeceras_Seguridad_Web SHALL incluir cabeceras de integridad y protección de transporte (A07:2021 — Fallos de Identificación y Autenticación) incluyendo HSTS, X-Content-Type-Options y X-Frame-Options.
5. THE Pipeline_Renderizado SHALL registrar en la consola del navegador los intentos de inyección detectados y neutralizados por el Sanitizador_HTML (A09:2021 — Fallos en el Registro y Monitoreo de Seguridad), incluyendo el tipo de contenido malicioso detectado.
6. WHEN MPP realiza solicitudes a recursos externos (imágenes remotas en Markdown), THE MPP SHALL validar que las URLs utilicen exclusivamente el esquema HTTPS (A10:2021 — Falsificación de Solicitudes del Lado del Servidor), rechazando URLs con esquemas HTTP, FTP u otros protocolos no seguros para recursos embebidos.
