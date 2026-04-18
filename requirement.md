# Especificación de Requerimientos: Markdown Presenter Pro (MPP)

## 1. Visión General

Markdown Presenter Pro es una aplicación de escritorio/web diseñada para transformar archivos `.md` en presentaciones interactivas y profesionales. A diferencia de las herramientas de diapositivas tradicionales, MPP ofrece una interfaz inspirada en IDEs modernos (como VSCode o Cursor), con navegación dinámica y una experiencia de usuario fluida.

---

## 2. Requerimientos Funcionales (RF)

### RF-01: Visualización de Archivos Markdown

- La aplicación debe renderizar archivos `.md` siguiendo el estándar CommonMark o GitHub Flavored Markdown (GFM).
- Debe soportar elementos multimedia (imágenes, videos locales/remotos) y bloques de código con resaltado de sintaxis.

### RF-02: Sistema de Navegación Dual

- **Navegación Lineal:** Botones de "Anterior" y "Siguiente" visibles o mediante atajos de teclado (flechas).
- **Navegación Dinámica (Menú Flotante):** Un menú tipo "Dock" (similar al de macOS) que permite el acceso directo a cualquier sección o archivo de la presentación.

### RF-03: Menú Flotante Configurable

- **Ubicación:** El usuario podrá posicionar el menú en los cuatro bordes de la pantalla (Top, Bottom, Left, Right).
- **Efecto de Interacción:** Implementación de un efecto de "Zoom" o "Magnificación" al pasar el mouse (hover) sobre los iconos.
- **Iconografía Dinámica:** Cada archivo o sección de la presentación tendrá un icono asociado. Si no se especifica uno, se asignará uno por defecto basado en el tipo de contenido.

### RF-04: Gestión de Presentaciones

- Carga de archivos individuales o carpetas completas (donde cada archivo representa una diapositiva o capítulo).
- Modo de "Presentador" con vista previa de la siguiente diapositiva y cronómetro.

---

## 3. Arquitectura y Buenas Prácticas (Propuesta)

Para garantizar la escalabilidad y el mantenimiento, se propone seguir estos lineamientos:

### Arquitectura de Software

- **Clean Architecture:** Separación clara entre la lógica de negocio (procesamiento de Markdown), los casos de uso y la capa de presentación (UI).
- **Patrón Observer:** Para que el menú flotante reaccione en tiempo real al cambio de diapositiva o estado de la aplicación.
- **Patrón Strategy:** Para el renderizado de diferentes elementos (un "strategy" para tablas, otro para código, otro para imágenes), permitiendo extender el soporte de formatos fácilmente.

### Principios de Desarrollo

- **SOLID:** Especial énfasis en el _Single Responsibility Principle_ (ej. el componente que lee archivos no es el mismo que los renderiza).
- **Programación Orientada a Objetos (POO):** Modelado de las presentaciones, diapositivas y menús como objetos con estados y comportamientos definidos.
- **DRY (Don't Repeat Yourself):** Creación de una biblioteca de componentes UI reutilizables.

---

## 4. Stack Tecnológico Propuesto

Basado en las tendencias actuales de alto rendimiento y experiencia de usuario:

1.  **Framework de Frontend:** **React.js** o **Next.js** (por su enorme ecosistema y facilidad para manejar estados complejos).
2.  **Contenedor de Escritorio:** **Tauri** (más ligero y seguro que Electron, usa Rust en el backend pero permite UI en JS) o **Electron** (si se busca máxima compatibilidad y facilidad de desarrollo).
3.  **Estilos y Animaciones:**
    - **Tailwind CSS:** Para un diseño rápido y responsivo.
    - **Framer Motion:** Esencial para lograr el efecto de "zoom" dinámico y las transiciones suaves en el menú flotante.
4.  **Procesamiento de Markdown:** **Unified.js** (específicamente `remark` y `rehype`), que es el estándar de oro para transformar Markdown en HTML manipulable.
5.  **Lenguaje:** **TypeScript** (imprescindible para aplicar SOLID y POO con tipado fuerte).
6.  **Cloud/Hosting (Opcional):** **AWS S3 + CloudFront** para la versión web, o **Vercel**.

---

## 5. Requerimientos No Funcionales (RNF)

- **RNF-01 (Rendimiento):** La aplicación debe cargar y renderizar archivos de hasta 1000 líneas en menos de 200ms.
- **RNF-02 (Usabilidad):** La interfaz debe ser minimalista, evitando distracciones durante la presentación.
- **RNF-03 (Extensibilidad):** El sistema de iconos debe permitir la carga de SVGs personalizados por el usuario.
- **RNF-04 (Multiplataforma):** Debe funcionar en Windows, macOS y Linux.
