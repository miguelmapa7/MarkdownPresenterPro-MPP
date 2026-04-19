# Documento de Requerimientos: Despliegue Web de Markdown Presenter Pro

## Introducción

Markdown Presenter Pro (MPP) es actualmente una aplicación de escritorio empaquetada con Tauri 2.0. Este documento especifica los requerimientos para habilitar un modo de operación dual: la aplicación debe funcionar tanto como aplicación de escritorio (Tauri) como aplicación web independiente desplegable en un navegador, sin necesidad de instalación. La versión web se desplegará en AWS utilizando S3 y CloudFront para hosting estático. La arquitectura existente basada en Clean Architecture con interfaces de adaptadores (`IFileSystemAdapter`, `IPersistenceAdapter`) facilita esta transición mediante la implementación de adaptadores específicos para el entorno del navegador.

## Glosario

- **MPP**: Markdown Presenter Pro, la aplicación principal objeto de esta especificación.
- **Modo_Escritorio**: Modo de ejecución de MPP dentro del contenedor Tauri, con acceso completo al sistema de archivos nativo del sistema operativo.
- **Modo_Web**: Modo de ejecución de MPP como aplicación web estática en un navegador, sin dependencias de Tauri ni acceso al sistema de archivos nativo.
- **Detector_Entorno**: Componente responsable de identificar en tiempo de ejecución si MPP se ejecuta en Modo_Escritorio o Modo_Web, y de proveer los adaptadores correspondientes.
- **WebFileSystemAdapter**: Implementación de `IFileSystemAdapter` que utiliza la API File del navegador y elementos `<input type="file">` para la lectura de archivos Markdown en Modo_Web.
- **API_File**: API estándar del navegador (`File`, `FileReader`, `FileList`) que permite leer archivos seleccionados por el usuario mediante elementos de formulario o drag & drop.
- **Selector_Archivos_Web**: Componente de interfaz que reemplaza los diálogos nativos de Tauri en Modo_Web, utilizando un elemento `<input type="file">` oculto para la selección de archivos y carpetas.
- **Hosting_Estatico_AWS**: Infraestructura de despliegue compuesta por un bucket S3 para almacenamiento de artefactos estáticos y una distribución CloudFront como CDN para entrega global con HTTPS.
- **Build_Web**: Proceso de construcción que genera los artefactos estáticos (HTML, CSS, JavaScript) de MPP sin dependencias de Tauri, listos para despliegue en Hosting_Estatico_AWS.
- **Artefactos_Estaticos**: Conjunto de archivos (HTML, CSS, JavaScript, assets) generados por el Build_Web que constituyen la aplicación web completa.
- **SPA**: Single Page Application, patrón de aplicación web donde toda la navegación ocurre en el cliente sin recargas de página.
- **CloudFront**: Servicio de CDN (Content Delivery Network) de AWS que distribuye los Artefactos_Estaticos globalmente con baja latencia y soporte HTTPS.
- **S3**: Amazon Simple Storage Service, servicio de almacenamiento de objetos de AWS utilizado para alojar los Artefactos_Estaticos.
- **webkitdirectory**: Atributo no estándar del elemento `<input type="file">` soportado por navegadores basados en Chromium y Firefox que permite la selección de carpetas completas.

## Requerimientos

### Requerimiento 1: Detección de Entorno de Ejecución

**Historia de Usuario:** Como desarrollador, quiero que MPP detecte automáticamente si se ejecuta dentro de Tauri o en un navegador web, para que la aplicación utilice los adaptadores y componentes apropiados sin intervención manual.

#### Criterios de Aceptación

1. WHEN MPP se inicia, THE Detector_Entorno SHALL determinar si la aplicación se ejecuta en Modo_Escritorio o Modo_Web verificando la disponibilidad de las APIs de Tauri (`window.__TAURI_INTERNALS__`).
2. WHEN el Detector_Entorno identifica Modo_Escritorio, THE Detector_Entorno SHALL proveer instancias de `TauriFileSystemAdapter` y los diálogos nativos de Tauri para la selección de archivos.
3. WHEN el Detector_Entorno identifica Modo_Web, THE Detector_Entorno SHALL proveer instancias de `WebFileSystemAdapter` y el Selector_Archivos_Web para la selección de archivos.
4. THE Detector_Entorno SHALL exponer una función pública `isTauri(): boolean` que retorne el resultado de la detección de entorno de forma síncrona.
5. THE Detector_Entorno SHALL completar la detección de entorno en menos de 10 milisegundos para no impactar el tiempo de inicio de la aplicación.

### Requerimiento 2: Adaptador de Sistema de Archivos para Navegador Web

**Historia de Usuario:** Como usuario web, quiero poder cargar archivos Markdown desde mi computadora a través del navegador, para usar MPP sin instalar ninguna aplicación de escritorio.

#### Criterios de Aceptación

1. THE WebFileSystemAdapter SHALL implementar la interfaz `IFileSystemAdapter` existente (`readFile`, `readDirectory`, `exists`).
2. WHEN el método `readFile` es invocado con un objeto `File` del navegador, THE WebFileSystemAdapter SHALL leer el contenido del archivo utilizando `FileReader` y retornar el texto como `string`.
3. WHEN el método `readDirectory` es invocado con un `FileList` proveniente de un input con atributo `webkitdirectory`, THE WebFileSystemAdapter SHALL enumerar los archivos contenidos y retornar un arreglo de `FileEntry` con nombre, ruta relativa, indicador de directorio y extensión.
4. WHEN el método `exists` es invocado en Modo_Web, THE WebFileSystemAdapter SHALL verificar la existencia del archivo dentro del `FileList` cargado en memoria y retornar `true` o `false`.
5. IF el usuario intenta cargar un archivo que no es de tipo texto o Markdown, THEN THE WebFileSystemAdapter SHALL rechazar la operación con un mensaje de error descriptivo indicando los tipos de archivo soportados.
6. THE WebFileSystemAdapter SHALL manejar archivos de hasta 10 MB sin degradación perceptible del rendimiento de lectura.

### Requerimiento 3: Selección de Archivos y Carpetas en Modo Web

**Historia de Usuario:** Como usuario web, quiero poder seleccionar archivos Markdown individuales o carpetas completas desde la interfaz del navegador, para cargar presentaciones de la misma forma que en la versión de escritorio.

#### Criterios de Aceptación

1. WHEN MPP se ejecuta en Modo_Web y el usuario hace clic en "Abrir archivo", THE Selector_Archivos_Web SHALL abrir un diálogo de selección de archivos del navegador filtrado para archivos `.md`.
2. WHEN MPP se ejecuta en Modo_Web y el usuario hace clic en "Abrir carpeta", THE Selector_Archivos_Web SHALL abrir un diálogo de selección de carpetas del navegador utilizando el atributo `webkitdirectory`.
3. WHEN el usuario arrastra y suelta un archivo `.md` sobre la zona de drop de MPP en Modo_Web, THE Selector_Archivos_Web SHALL leer el contenido del archivo utilizando la API_File y cargar la presentación.
4. WHEN el usuario arrastra y suelta una carpeta sobre la zona de drop de MPP en Modo_Web, THE Selector_Archivos_Web SHALL leer los archivos `.md` contenidos en la carpeta utilizando la API_File y cargar la presentación.
5. IF el navegador del usuario no soporta el atributo `webkitdirectory`, THEN THE Selector_Archivos_Web SHALL ocultar el botón "Abrir carpeta" y mostrar un mensaje informativo indicando que la selección de carpetas requiere un navegador compatible (Chrome, Edge o Firefox).
6. WHEN el usuario selecciona múltiples archivos `.md` mediante el diálogo de selección (atributo `multiple`), THE Selector_Archivos_Web SHALL crear una Presentacion donde cada archivo seleccionado represente una Diapositiva, ordenados alfabéticamente por nombre de archivo.

### Requerimiento 4: Compatibilidad de Funcionalidades Existentes en Modo Web

**Historia de Usuario:** Como usuario web, quiero que todas las funcionalidades existentes de MPP (renderizado Markdown, navegación, Dock, modo presentador, temas, i18n) funcionen correctamente en el navegador, para tener la misma experiencia que en la versión de escritorio.

#### Criterios de Aceptación

1. WHEN una Presentacion es cargada en Modo_Web, THE Renderizador_Markdown SHALL renderizar el contenido Markdown (CommonMark y GFM) con la misma fidelidad que en Modo_Escritorio.
2. WHEN una Presentacion está activa en Modo_Web, THE Navegador_Lineal SHALL permitir la navegación secuencial entre Diapositivas mediante botones y atajos de teclado.
3. WHEN una Presentacion está activa en Modo_Web, THE Menu_Flotante SHALL mostrar los iconos de navegación con el efecto de magnificación y permitir la navegación directa a cualquier Diapositiva.
4. WHEN el usuario activa el Modo_Presentador en Modo_Web, THE Gestor_Presentaciones SHALL mostrar la vista dividida con diapositiva actual, vista previa de la siguiente y cronómetro.
5. WHEN el usuario cambia el tema en Modo_Web, THE Gestor_Tema SHALL aplicar el tema seleccionado (oscuro o claro) y persistir la preferencia en localStorage.
6. WHEN el usuario cambia el idioma en Modo_Web, THE Gestor_Idioma SHALL actualizar todas las cadenas de texto de la interfaz al idioma seleccionado y persistir la preferencia en localStorage.
7. WHEN el usuario presiona la tecla F11 o el botón de pantalla completa en Modo_Web, THE MPP SHALL solicitar el modo de pantalla completa del navegador mediante la Fullscreen API.

### Requerimiento 5: Configuración de Build para Modo Web

**Historia de Usuario:** Como desarrollador, quiero un proceso de build dedicado que genere artefactos estáticos de MPP sin dependencias de Tauri, para poder desplegar la versión web de forma independiente.

#### Criterios de Aceptación

1. THE Build_Web SHALL generar Artefactos_Estaticos (HTML, CSS, JavaScript) que funcionen como una SPA sin dependencias de las APIs de Tauri (`@tauri-apps/api`, `@tauri-apps/plugin-fs`, `@tauri-apps/plugin-dialog`).
2. THE Build_Web SHALL estar disponible mediante un script `build:web` en el archivo `package.json` que ejecute Vite en modo de producción con la configuración web específica.
3. WHEN el Build_Web se ejecuta, THE Build_Web SHALL excluir del bundle final todo código específico de Tauri mediante tree-shaking y las importaciones dinámicas condicionales existentes.
4. THE Build_Web SHALL generar los Artefactos_Estaticos en un directorio `dist-web` separado del directorio `dist` utilizado por el build de Tauri.
5. WHEN el Build_Web se completa, THE Build_Web SHALL generar un archivo `index.html` configurado para enrutamiento SPA (todas las rutas redirigen al `index.html`).
6. THE Build_Web SHALL completar el proceso de construcción en menos de 60 segundos en una máquina con Node.js 20 y las dependencias previamente instaladas.
7. THE Build_Web SHALL generar Artefactos_Estaticos con un tamaño total del bundle JavaScript (comprimido con gzip) inferior a 500 KB.

### Requerimiento 6: Despliegue en AWS (S3 + CloudFront)

**Historia de Usuario:** Como desarrollador, quiero desplegar la versión web de MPP en AWS utilizando S3 y CloudFront, para que los usuarios puedan acceder a la aplicación desde cualquier navegador con baja latencia y conexión HTTPS.

#### Criterios de Aceptación

1. THE Hosting_Estatico_AWS SHALL utilizar un bucket S3 configurado para hosting de sitio web estático que almacene los Artefactos_Estaticos generados por el Build_Web.
2. THE Hosting_Estatico_AWS SHALL utilizar una distribución CloudFront como CDN que sirva los Artefactos_Estaticos desde el bucket S3 con soporte HTTPS.
3. THE Hosting_Estatico_AWS SHALL configurar CloudFront para redirigir todas las rutas al archivo `index.html` para soportar el enrutamiento SPA.
4. THE Hosting_Estatico_AWS SHALL configurar headers de caché en CloudFront: archivos con hash en el nombre (JS, CSS) con `max-age=31536000` (1 año) y `index.html` con `max-age=0, must-revalidate`.
5. THE Hosting_Estatico_AWS SHALL configurar el bucket S3 con acceso público bloqueado, utilizando una Origin Access Identity (OAI) o Origin Access Control (OAC) de CloudFront como único método de acceso.
6. WHEN se despliegan nuevos Artefactos_Estaticos, THE Hosting_Estatico_AWS SHALL invalidar la caché de CloudFront para el archivo `index.html` para que los usuarios reciban la versión actualizada.
7. THE Hosting_Estatico_AWS SHALL servir los Artefactos_Estaticos con un Time to First Byte (TTFB) inferior a 200 milisegundos para usuarios en la región principal de despliegue.

### Requerimiento 7: Limitaciones y Degradación Elegante en Modo Web

**Historia de Usuario:** Como usuario web, quiero que la aplicación me informe claramente sobre las limitaciones del modo web respecto al modo escritorio, para entender qué funcionalidades están disponibles y cuáles no.

#### Criterios de Aceptación

1. WHEN MPP se ejecuta en Modo_Web, THE MPP SHALL mostrar un indicador visual sutil que identifique el modo de ejecución como "Web" en la interfaz de usuario.
2. WHEN el usuario intenta acceder a una funcionalidad exclusiva del Modo_Escritorio desde el Modo_Web, THE MPP SHALL mostrar un mensaje informativo indicando que la funcionalidad requiere la versión de escritorio.
3. WHILE MPP se ejecuta en Modo_Web, THE MPP SHALL deshabilitar la funcionalidad de lectura de carpetas en navegadores que no soporten el atributo `webkitdirectory`, mostrando una alternativa de selección múltiple de archivos.
4. WHILE MPP se ejecuta en Modo_Web, THE MPP SHALL utilizar rutas relativas basadas en los nombres de archivo proporcionados por la API_File, en lugar de rutas absolutas del sistema de archivos.
5. IF el usuario carga un archivo Markdown que referencia imágenes locales con rutas absolutas en Modo_Web, THEN THE MPP SHALL mostrar un placeholder informativo en lugar de la imagen, indicando que las imágenes locales con rutas absolutas no están disponibles en el modo web.
6. WHEN el usuario carga un archivo Markdown que referencia imágenes con URLs remotas (HTTP/HTTPS) en Modo_Web, THE MPP SHALL mostrar las imágenes remotas correctamente.

### Requerimiento 8: Rendimiento de la Versión Web

**Historia de Usuario:** Como usuario web, quiero que la aplicación web cargue rápidamente y responda de forma fluida, para tener una experiencia comparable a la versión de escritorio.

#### Criterios de Aceptación

1. WHEN un usuario accede a MPP en Modo_Web por primera vez, THE MPP SHALL mostrar la interfaz interactiva (Time to Interactive) en menos de 3 segundos con una conexión de 4G (1.6 Mbps de descarga).
2. WHEN un archivo `.md` de hasta 1000 líneas es cargado en Modo_Web mediante la API_File, THE Renderizador_Markdown SHALL completar la lectura del archivo y el renderizado en menos de 300 milisegundos.
3. WHEN el usuario navega entre Diapositivas en Modo_Web, THE Navegador_Lineal SHALL completar la transición visual en menos de 100 milisegundos.
4. THE Build_Web SHALL aplicar code splitting para cargar únicamente el código necesario para la vista inicial, difiriendo la carga de módulos secundarios (modo presentador, configuración avanzada).
5. THE Build_Web SHALL generar Artefactos_Estaticos con assets estáticos (imágenes, fuentes) optimizados y servidos con headers de caché de larga duración.
