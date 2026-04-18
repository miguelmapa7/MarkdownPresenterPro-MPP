# Documento de Requerimientos: Markdown Presenter Pro (MPP)

## Introducción

Markdown Presenter Pro (MPP) es una aplicación de escritorio/web diseñada para transformar archivos `.md` en presentaciones interactivas y profesionales. La aplicación ofrece una interfaz inspirada en IDEs modernos (como VSCode o Cursor), con un sistema de navegación dual (lineal y menú flotante tipo Dock), gestión avanzada de presentaciones y una experiencia de usuario fluida y minimalista. El stack tecnológico se basa en React/Next.js, Tauri/Electron, Tailwind CSS, Framer Motion, Unified.js y TypeScript, siguiendo principios de Clean Architecture, SOLID y patrones Observer/Strategy.

## Glosario

- **MPP**: Markdown Presenter Pro, la aplicación principal objeto de esta especificación.
- **Renderizador_Markdown**: Componente responsable de transformar contenido Markdown en HTML renderizable, utilizando Unified.js (remark/rehype).
- **Navegador_Lineal**: Componente de navegación secuencial que permite avanzar y retroceder entre diapositivas.
- **Menu_Flotante**: Componente de navegación dinámica tipo Dock (similar a macOS) que permite acceso directo a cualquier sección o archivo de la presentación.
- **Gestor_Presentaciones**: Componente responsable de la carga, organización y gestión del ciclo de vida de las presentaciones.
- **Modo_Presentador**: Vista especial que muestra la diapositiva actual, una vista previa de la siguiente y un cronómetro.
- **Sistema_Iconos**: Componente encargado de asignar y gestionar los iconos asociados a cada sección o archivo de la presentación.
- **Motor_Magnificacion**: Componente que implementa el efecto de zoom/magnificación al interactuar con los elementos del Menu_Flotante.
- **Diapositiva**: Unidad de contenido dentro de una presentación, derivada de un archivo Markdown o una sección delimitada dentro de un archivo.
- **Presentacion**: Colección ordenada de Diapositivas que conforman una sesión de presentación completa.
- **CommonMark**: Especificación estándar para la sintaxis Markdown.
- **GFM**: GitHub Flavored Markdown, extensión de CommonMark con soporte para tablas, listas de tareas y otros elementos adicionales.
- **Entorno_Docker**: Infraestructura de contenedores Docker que encapsula el entorno de desarrollo, construcción y ejecución de MPP, garantizando reproducibilidad y portabilidad.
- **Pipeline_CICD**: Pipeline de Integración Continua y Despliegue Continuo que automatiza las etapas de construcción, pruebas, versionamiento y despliegue de MPP.
- **Registro_Contenedores**: Repositorio de imágenes Docker (como Docker Hub, GitHub Container Registry o Amazon ECR) donde se almacenan y versionan las imágenes de MPP.
- **Imagen_Docker**: Artefacto inmutable generado por el proceso de construcción que contiene la aplicación MPP y todas sus dependencias listas para ejecución.
- **Hook_PreCommit**: Gancho de pre-commit configurado mediante Husky que intercepta el comando `git commit` y ejecuta validaciones de calidad de código antes de permitir el registro del cambio.
- **Validador_Lint**: Componente de análisis estático basado en ESLint que verifica reglas de estilo, variables no utilizadas e importaciones faltantes en el código fuente.
- **Formateador_Codigo**: Componente basado en Prettier que aplica formato consistente al código fuente según las reglas de estilo definidas en el proyecto.
- **Verificador_Tipos**: Componente que ejecuta el compilador de TypeScript en modo de verificación (`tsc --noEmit`) para detectar errores de tipado sin generar archivos de salida.
- **Ejecutor_Pruebas_Staged**: Componente que ejecuta las pruebas unitarias y las pruebas basadas en propiedades (property-based tests) relacionadas con los archivos modificados en el área de staging.
- **Lint_Staged**: Herramienta que permite ejecutar comandos de validación exclusivamente sobre los archivos que se encuentran en el área de staging de Git, optimizando el tiempo de ejecución del Hook_PreCommit.

## Requerimientos

### Requerimiento 1: Renderizado de Archivos Markdown

**Historia de Usuario:** Como presentador, quiero que la aplicación renderice archivos `.md` de forma fiel y completa, para poder crear presentaciones profesionales a partir de contenido Markdown.

#### Criterios de Aceptación

1. WHEN un archivo `.md` válido es cargado, THE Renderizador_Markdown SHALL transformar el contenido en HTML siguiendo la especificación CommonMark.
2. WHEN un archivo `.md` contiene sintaxis GFM (tablas, listas de tareas, tachado), THE Renderizador_Markdown SHALL renderizar los elementos GFM correctamente.
3. WHEN un archivo `.md` contiene referencias a imágenes locales o remotas, THE Renderizador_Markdown SHALL mostrar las imágenes en la Diapositiva correspondiente.
4. WHEN un archivo `.md` contiene referencias a videos locales o remotos, THE Renderizador_Markdown SHALL incrustar un reproductor de video funcional en la Diapositiva correspondiente.
5. WHEN un archivo `.md` contiene bloques de código con indicador de lenguaje, THE Renderizador_Markdown SHALL aplicar resaltado de sintaxis específico para el lenguaje indicado.
6. WHEN un archivo `.md` contiene bloques de código sin indicador de lenguaje, THE Renderizador_Markdown SHALL renderizar el bloque como texto monoespaciado sin resaltado de sintaxis.
7. IF un archivo `.md` contiene sintaxis Markdown inválida o malformada, THEN THE Renderizador_Markdown SHALL renderizar el contenido en modo texto plano para las secciones inválidas y continuar procesando el resto del archivo.

### Requerimiento 2: Navegación Lineal entre Diapositivas

**Historia de Usuario:** Como presentador, quiero navegar secuencialmente entre diapositivas usando botones o atajos de teclado, para mantener un flujo de presentación ordenado.

#### Criterios de Aceptación

1. WHEN el presentador presiona el botón "Siguiente" o la tecla de flecha derecha, THE Navegador_Lineal SHALL avanzar a la siguiente Diapositiva de la Presentacion.
2. WHEN el presentador presiona el botón "Anterior" o la tecla de flecha izquierda, THE Navegador_Lineal SHALL retroceder a la Diapositiva anterior de la Presentacion.
3. WHILE la Presentacion se encuentra en la primera Diapositiva, THE Navegador_Lineal SHALL deshabilitar visualmente el botón "Anterior" e ignorar la tecla de flecha izquierda.
4. WHILE la Presentacion se encuentra en la última Diapositiva, THE Navegador_Lineal SHALL deshabilitar visualmente el botón "Siguiente" e ignorar la tecla de flecha derecha.
5. THE Navegador_Lineal SHALL mostrar los botones "Anterior" y "Siguiente" de forma visible en la interfaz de presentación.
6. WHEN se produce un cambio de Diapositiva, THE Navegador_Lineal SHALL notificar al Menu_Flotante para que actualice el indicador de posición activa.

### Requerimiento 3: Menú Flotante de Navegación Dinámica (Dock)

**Historia de Usuario:** Como presentador, quiero un menú flotante tipo Dock que me permita saltar directamente a cualquier sección de la presentación, para tener acceso rápido y no lineal al contenido.

#### Criterios de Aceptación

1. THE Menu_Flotante SHALL mostrar un icono representativo por cada Diapositiva o sección de la Presentacion activa.
2. WHEN el presentador hace clic en un icono del Menu_Flotante, THE Menu_Flotante SHALL navegar directamente a la Diapositiva o sección correspondiente.
3. WHEN se produce un cambio de Diapositiva por cualquier medio de navegación, THE Menu_Flotante SHALL resaltar visualmente el icono correspondiente a la Diapositiva activa.
4. THE Menu_Flotante SHALL permanecer visible y accesible durante toda la sesión de presentación sin obstruir el contenido principal de la Diapositiva.

### Requerimiento 4: Configuración de Posición del Menú Flotante

**Historia de Usuario:** Como presentador, quiero poder posicionar el menú flotante en cualquier borde de la pantalla, para adaptar la interfaz a mis preferencias y al tipo de contenido que presento.

#### Criterios de Aceptación

1. THE Menu_Flotante SHALL soportar posicionamiento en los cuatro bordes de la pantalla: superior, inferior, izquierdo y derecho.
2. WHEN el presentador selecciona una nueva posición para el Menu_Flotante, THE Menu_Flotante SHALL reubicarse en el borde seleccionado con una transición animada.
3. THE Menu_Flotante SHALL conservar la posición seleccionada por el presentador entre sesiones de la aplicación.
4. WHEN la aplicación se inicia por primera vez sin configuración previa, THE Menu_Flotante SHALL posicionarse en el borde inferior de la pantalla como valor predeterminado.

### Requerimiento 5: Efecto de Magnificación en el Menú Flotante

**Historia de Usuario:** Como presentador, quiero que los iconos del menú flotante se amplíen al pasar el mouse sobre ellos, para tener una experiencia visual atractiva y facilitar la selección precisa de secciones.

#### Criterios de Aceptación

1. WHEN el presentador posiciona el cursor sobre un icono del Menu_Flotante, THE Motor_Magnificacion SHALL ampliar progresivamente el icono objetivo y los iconos adyacentes con un efecto de magnificación gradual.
2. WHEN el cursor abandona la zona del Menu_Flotante, THE Motor_Magnificacion SHALL restaurar todos los iconos a su tamaño original con una transición suave.
3. THE Motor_Magnificacion SHALL ejecutar las animaciones de magnificación a un mínimo de 60 cuadros por segundo para garantizar fluidez visual.
4. WHILE el efecto de magnificación está activo, THE Motor_Magnificacion SHALL mantener la alineación y el espaciado proporcional entre los iconos del Menu_Flotante.

### Requerimiento 6: Iconografía Dinámica por Sección

**Historia de Usuario:** Como presentador, quiero que cada sección de mi presentación tenga un icono representativo, para identificar visualmente el contenido de cada diapositiva desde el menú flotante.

#### Criterios de Aceptación

1. WHEN una Diapositiva tiene un icono personalizado especificado en los metadatos del archivo Markdown, THE Sistema_Iconos SHALL mostrar el icono personalizado en el Menu_Flotante.
2. WHEN una Diapositiva no tiene un icono personalizado especificado, THE Sistema_Iconos SHALL asignar un icono predeterminado basado en el tipo de contenido predominante de la Diapositiva (código, imagen, texto, tabla).
3. THE Sistema_Iconos SHALL soportar la carga de archivos SVG personalizados proporcionados por el presentador.
4. IF un archivo SVG personalizado no puede ser cargado o es inválido, THEN THE Sistema_Iconos SHALL mostrar un icono genérico de respaldo y registrar un mensaje de advertencia en la consola de la aplicación.

### Requerimiento 7: Carga y Gestión de Presentaciones

**Historia de Usuario:** Como presentador, quiero cargar archivos Markdown individuales o carpetas completas como presentaciones, para organizar mi contenido de forma flexible.

#### Criterios de Aceptación

1. WHEN el presentador selecciona un archivo `.md` individual, THE Gestor_Presentaciones SHALL crear una Presentacion donde cada sección delimitada del archivo represente una Diapositiva.
2. WHEN el presentador selecciona una carpeta, THE Gestor_Presentaciones SHALL crear una Presentacion donde cada archivo `.md` dentro de la carpeta represente una Diapositiva, ordenados alfabéticamente por nombre de archivo.
3. WHEN el presentador selecciona una carpeta que contiene archivos no-Markdown, THE Gestor_Presentaciones SHALL ignorar los archivos que no tengan extensión `.md` y procesar únicamente los archivos Markdown.
4. IF la carpeta seleccionada no contiene archivos `.md`, THEN THE Gestor_Presentaciones SHALL mostrar un mensaje informativo indicando que no se encontraron archivos Markdown válidos.
5. IF el archivo `.md` seleccionado está vacío, THEN THE Gestor_Presentaciones SHALL mostrar un mensaje informativo indicando que el archivo no contiene contenido para presentar.

### Requerimiento 8: Modo Presentador

**Historia de Usuario:** Como presentador, quiero un modo especial que me muestre la diapositiva actual, una vista previa de la siguiente y un cronómetro, para gestionar mejor el tiempo y el flujo de mi presentación.

#### Criterios de Aceptación

1. WHEN el presentador activa el Modo_Presentador, THE Gestor_Presentaciones SHALL mostrar una vista dividida con la Diapositiva actual en el panel principal y una vista previa de la siguiente Diapositiva en un panel secundario.
2. WHILE el Modo_Presentador está activo, THE Gestor_Presentaciones SHALL mostrar un cronómetro que indique el tiempo transcurrido desde la activación del modo.
3. WHILE el Modo_Presentador está activo, THE Gestor_Presentaciones SHALL mostrar el número de la Diapositiva actual y el total de Diapositivas en formato "N de M".
4. WHILE la Presentacion se encuentra en la última Diapositiva y el Modo_Presentador está activo, THE Gestor_Presentaciones SHALL mostrar un indicador de "Fin de Presentación" en el panel de vista previa.
5. WHEN el presentador desactiva el Modo_Presentador, THE Gestor_Presentaciones SHALL restaurar la vista estándar de presentación manteniendo la Diapositiva actual.

### Requerimiento 9: Parseo y Formateo de Markdown (Round-Trip)

**Historia de Usuario:** Como desarrollador, quiero que el sistema de parseo de Markdown sea robusto y reversible, para garantizar la integridad del contenido durante las transformaciones.

#### Criterios de Aceptación

1. WHEN un archivo `.md` válido es proporcionado, THE Renderizador_Markdown SHALL parsear el contenido en un Árbol de Sintaxis Abstracta (AST) conforme a la especificación CommonMark.
2. THE Renderizador_Markdown SHALL formatear un AST de vuelta a texto Markdown válido.
3. FOR ALL archivos Markdown válidos, parsear el contenido a AST, formatear el AST a texto Markdown y volver a parsear a AST SHALL producir un AST equivalente al original (propiedad round-trip).
4. IF el contenido Markdown contiene extensiones GFM, THEN THE Renderizador_Markdown SHALL preservar las extensiones GFM durante el ciclo de parseo y formateo.

### Requerimiento 10: Rendimiento de Carga y Renderizado

**Historia de Usuario:** Como presentador, quiero que la aplicación cargue y renderice el contenido rápidamente, para no interrumpir el flujo de mi presentación.

#### Criterios de Aceptación

1. WHEN un archivo `.md` de hasta 1000 líneas es cargado, THE Renderizador_Markdown SHALL completar el parseo y renderizado en menos de 200 milisegundos.
2. WHEN el presentador navega entre Diapositivas, THE Navegador_Lineal SHALL completar la transición visual en menos de 100 milisegundos.
3. WHEN la Presentacion es cargada, THE Gestor_Presentaciones SHALL mostrar la primera Diapositiva lista para interacción en menos de 500 milisegundos.

### Requerimiento 11: Interfaz Minimalista y Libre de Distracciones

**Historia de Usuario:** Como presentador, quiero una interfaz limpia y minimalista, para que la audiencia se concentre en el contenido de la presentación.

#### Criterios de Aceptación

1. WHILE una Presentacion está activa, THE MPP SHALL maximizar el área de contenido de la Diapositiva, reservando el espacio mínimo necesario para los controles de navegación.
2. THE MPP SHALL utilizar una paleta de colores neutra y consistente que no compita visualmente con el contenido de la Presentacion.
3. WHEN el presentador entra en modo de pantalla completa, THE MPP SHALL ocultar todos los elementos de la interfaz del sistema operativo y mostrar únicamente el contenido de la Diapositiva y los controles de navegación.

### Requerimiento 12: Compatibilidad Multiplataforma

**Historia de Usuario:** Como presentador, quiero usar la aplicación en cualquier sistema operativo de escritorio, para no estar limitado a una plataforma específica.

#### Criterios de Aceptación

1. THE MPP SHALL ejecutarse de forma nativa en los sistemas operativos Windows 10 o superior, macOS 12 o superior y distribuciones Linux basadas en Ubuntu 20.04 o superior.
2. THE MPP SHALL mantener la misma funcionalidad y apariencia visual en todas las plataformas soportadas.
3. THE MPP SHALL utilizar atajos de teclado adaptados a las convenciones de cada sistema operativo (Cmd en macOS, Ctrl en Windows/Linux).

### Requerimiento 13: Contenedorización Docker y Prácticas DevOps

**Historia de Usuario:** Como desarrollador, quiero que todo el entorno de desarrollo, construcción y despliegue de MPP esté contenedorizado con Docker, para garantizar reproducibilidad, facilitar la integración continua y simplificar el despliegue en cualquier entorno.

#### Criterios de Aceptación

1. THE Entorno_Docker SHALL proporcionar un archivo `Dockerfile` que construya una Imagen_Docker funcional de MPP con todas las dependencias necesarias para desarrollo y ejecución.
2. THE Entorno_Docker SHALL proporcionar un archivo `docker-compose.yml` que orqueste todos los servicios necesarios para el entorno de desarrollo local (aplicación, servidor de desarrollo, documentación).
3. WHEN un desarrollador ejecuta el comando de inicio del Entorno_Docker, THE Entorno_Docker SHALL levantar el entorno de desarrollo completo en menos de 120 segundos en una máquina con las dependencias de Docker previamente instaladas.
4. THE Entorno_Docker SHALL utilizar construcciones multi-etapa (multi-stage builds) para separar las dependencias de desarrollo de las de producción, generando una Imagen_Docker de producción optimizada en tamaño.
5. THE Pipeline_CICD SHALL ejecutar automáticamente las etapas de construcción, análisis estático de código, ejecución de pruebas unitarias y generación de artefactos ante cada push o pull request al repositorio.
6. THE Pipeline_CICD SHALL generar y publicar una Imagen_Docker versionada en el Registro_Contenedores tras cada merge exitoso a la rama principal.
7. THE Pipeline_CICD SHALL etiquetar cada Imagen_Docker con el número de versión semántica (SemVer) correspondiente y con el hash del commit de origen.
8. WHEN se crea un tag de release en el repositorio, THE Pipeline_CICD SHALL generar automáticamente los artefactos de distribución para todas las plataformas soportadas (Windows, macOS, Linux) y publicarlos como assets del release.
9. THE Entorno_Docker SHALL incluir un contenedor dedicado para la generación y servicio de la documentación técnica del proyecto.
10. IF la construcción de la Imagen_Docker falla, THEN THE Pipeline_CICD SHALL notificar al equipo de desarrollo con un reporte detallado del error y detener las etapas subsiguientes del pipeline.
11. THE Entorno_Docker SHALL incluir un archivo `.dockerignore` que excluya archivos innecesarios (node_modules, archivos temporales, configuraciones locales) para optimizar el contexto de construcción.
12. WHEN se realiza un despliegue a un entorno de staging o producción, THE Pipeline_CICD SHALL ejecutar las pruebas de integración contra la Imagen_Docker generada antes de promover el despliegue.

### Requerimiento 14: Validaciones de Calidad de Código en Pre-Commit

**Historia de Usuario:** Como desarrollador, quiero que se ejecuten validaciones automáticas de calidad de código antes de cada commit, para garantizar que solo se registre código que cumple con los estándares del proyecto y evitar que errores de estilo, tipado o lógica lleguen al repositorio.

#### Criterios de Aceptación

1. WHEN un desarrollador ejecuta `git commit`, THE Hook_PreCommit SHALL interceptar el commit y ejecutar las validaciones de calidad de código antes de permitir el registro del cambio.
2. THE Hook_PreCommit SHALL estar configurado mediante Husky y Lint_Staged para ejecutar las validaciones exclusivamente sobre los archivos que se encuentran en el área de staging de Git.
3. WHEN el Hook_PreCommit se activa, THE Validador_Lint SHALL ejecutar ESLint sobre los archivos staged con extensión `.ts`, `.tsx`, `.js` y `.jsx`, verificando reglas de estilo, variables no utilizadas e importaciones faltantes.
4. WHEN el Hook_PreCommit se activa, THE Formateador_Codigo SHALL ejecutar Prettier sobre los archivos staged para verificar que el formato del código sea consistente con las reglas definidas en la configuración del proyecto.
5. WHEN el Hook_PreCommit se activa, THE Verificador_Tipos SHALL ejecutar el compilador de TypeScript en modo de verificación (`tsc --noEmit`) para detectar errores de tipado en el proyecto.
6. WHEN el Hook_PreCommit se activa, THE Ejecutor_Pruebas_Staged SHALL ejecutar las pruebas unitarias relacionadas con los archivos modificados en el área de staging.
7. WHEN el Hook_PreCommit se activa, THE Ejecutor_Pruebas_Staged SHALL ejecutar las pruebas basadas en propiedades (property-based tests) relacionadas con los archivos modificados en el área de staging.
8. IF el Validador_Lint detecta errores en los archivos staged, THEN THE Hook_PreCommit SHALL bloquear el commit y mostrar al desarrollador los errores encontrados con la ubicación exacta (archivo y línea).
9. IF el Formateador_Codigo detecta archivos staged con formato inconsistente, THEN THE Hook_PreCommit SHALL bloquear el commit y mostrar al desarrollador los archivos que requieren formateo.
10. IF el Verificador_Tipos detecta errores de tipado, THEN THE Hook_PreCommit SHALL bloquear el commit y mostrar al desarrollador los errores de tipado encontrados.
11. IF el Ejecutor_Pruebas_Staged detecta pruebas unitarias o pruebas basadas en propiedades fallidas, THEN THE Hook_PreCommit SHALL bloquear el commit y mostrar al desarrollador el resultado de las pruebas fallidas.
12. WHEN todas las validaciones del Hook_PreCommit se completan exitosamente, THE Hook_PreCommit SHALL permitir que el commit proceda normalmente.
