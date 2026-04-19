import { useReducer, useCallback, useEffect, useState, useMemo } from "react";
import { Presentation, MarkdownParser, IconResolver } from "@/domain";
import type { Slide, IconResult, IconMode } from "@/domain";
import {
  RenderMarkdownUseCase,
  createDefaultRegistry,
  ConfigurationUseCase,
} from "@/application";
import type { DockPosition } from "@/application";
import { LocalPersistenceAdapter } from "@/infrastructure/LocalPersistenceAdapter";
import { createAdapters } from "@/infrastructure/AdapterFactory";
import type { AdapterSet } from "@/infrastructure/AdapterFactory";
import {
  SlideViewer,
  SlideErrorBoundary,
  LinearNavigator,
  FloatingDock,
  PresenterMode,
  PresentationLoader,
  WebPresentationLoader,
  WebModeBadge,
} from "@/presentation";
import { ThemeProvider } from "@/presentation/ThemeProvider";
import { ThemeToggle } from "@/presentation/ThemeToggle";
import { I18nProvider } from "@/presentation/I18nProvider";
import { LanguageSelector } from "@/presentation/LanguageSelector";
import { IconModeToggle } from "@/presentation/IconModeToggle";

// --- Estado global ---

interface AppState {
  presentation: Presentation | null;
  currentIndex: number;
  isPresenterMode: boolean;
  isFullscreen: boolean;
  dockPosition: DockPosition;
  isLoading: boolean;
  error: string | null;
}

type AppAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; presentation: Presentation }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "NAVIGATE"; index: number }
  | { type: "TOGGLE_PRESENTER" }
  | { type: "TOGGLE_FULLSCREEN" }
  | { type: "SET_DOCK_POSITION"; position: DockPosition };

const initialState: AppState = {
  presentation: null,
  currentIndex: 0,
  isPresenterMode: false,
  isFullscreen: false,
  dockPosition: "bottom",
  isLoading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, isLoading: true, error: null };
    case "LOAD_SUCCESS":
      return {
        ...state,
        presentation: action.presentation,
        currentIndex: 0,
        isLoading: false,
        error: null,
      };
    case "LOAD_ERROR":
      return { ...state, isLoading: false, error: action.error };
    case "NAVIGATE":
      return { ...state, currentIndex: action.index };
    case "TOGGLE_PRESENTER":
      return { ...state, isPresenterMode: !state.isPresenterMode };
    case "TOGGLE_FULLSCREEN":
      return { ...state, isFullscreen: !state.isFullscreen };
    case "SET_DOCK_POSITION":
      return { ...state, dockPosition: action.position };
    default:
      return state;
  }
}

// --- Servicios (instancias singleton) ---
const parser = new MarkdownParser();
const iconResolver = new IconResolver();
const renderer = new RenderMarkdownUseCase(parser, createDefaultRegistry());
const persistence = new LocalPersistenceAdapter();
const configUseCase = new ConfigurationUseCase(persistence);

/**
 * Regex para detectar rutas absolutas de imágenes locales en HTML renderizado.
 * Detecta rutas Unix (/home/..., /usr/...) y Windows (C:\..., D:\...).
 */
const LOCAL_IMAGE_REGEX =
  /(<img\s[^>]*src=["'])(?:\/(?:home|usr|tmp|var|opt|etc|mnt|media)[^"']*|[A-Z]:\\[^"']*)(["'][^>]*>)/gi;

/**
 * Reemplaza imágenes con rutas absolutas locales por un placeholder informativo.
 * Las imágenes con URLs remotas (HTTP/HTTPS) y rutas relativas no se modifican.
 */
function replaceLocalImages(html: string, placeholderText: string): string {
  return html.replace(
    LOCAL_IMAGE_REGEX,
    `<span class="inline-block px-3 py-1 rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 text-sm">${placeholderText}</span>`
  );
}

/**
 * Componente App — Orquestador principal de MPP.
 *
 * Conecta todos los componentes usando useReducer para estado global.
 * Delega lógica de negocio a los casos de uso.
 * Usa AdapterFactory para crear adaptadores según el entorno (Tauri o Web).
 */
export default function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [iconMode, setIconMode] = useState<IconMode>(iconResolver.getMode());
  const [adapters, setAdapters] = useState<AdapterSet | null>(null);

  // Inicializar adaptadores según el entorno detectado
  useEffect(() => {
    createAdapters().then(setAdapters);
  }, []);

  const handleToggleIconMode = useCallback(() => {
    const newMode: IconMode = iconMode === "varied" ? "content" : "varied";
    iconResolver.setMode(newMode);
    setIconMode(newMode);
  }, [iconMode]);

  const { presentation, currentIndex, isPresenterMode, isLoading, error, dockPosition } =
    state;

  // Renderizar diapositiva actual
  const currentSlide = presentation?.getSlideAt(currentIndex) ?? null;
  const rawCurrentHtml = currentSlide ? renderer.render(currentSlide).html : "";

  // En modo web, reemplazar imágenes locales con placeholder
  const currentHtml = useMemo(() => {
    if (adapters?.isWeb && rawCurrentHtml) {
      return replaceLocalImages(
        rawCurrentHtml,
        "🖼️ Imagen local no disponible en modo web"
      );
    }
    return rawCurrentHtml;
  }, [rawCurrentHtml, adapters?.isWeb]);

  // Renderizar siguiente diapositiva (para PresenterMode)
  const nextSlide =
    presentation && currentIndex < presentation.getTotalSlides() - 1
      ? presentation.getSlideAt(currentIndex + 1)
      : null;
  const rawNextHtml = nextSlide ? renderer.render(nextSlide).html : null;

  const nextHtml = useMemo(() => {
    if (adapters?.isWeb && rawNextHtml) {
      return replaceLocalImages(rawNextHtml, "🖼️ Imagen local no disponible en modo web");
    }
    return rawNextHtml;
  }, [rawNextHtml, adapters?.isWeb]);

  // Resolver iconos para el Dock
  const dockSlides = presentation
    ? presentation.getSlides().map((slide: Slide, index: number) => ({
        metadata: slide.getMetadata(),
        icon: iconResolver.resolve(slide.getMetadata(), index) as IconResult,
      }))
    : [];

  // --- Handlers ---

  const handleLoad = useCallback(
    async (path: string, type: "file" | "directory") => {
      if (!adapters) return;
      dispatch({ type: "LOAD_START" });
      try {
        const { LoadPresentationUseCase } = await import("@/application");
        const useCase = new LoadPresentationUseCase(adapters.fileSystem, parser);
        const result = await useCase.execute({ path, type });

        if (result.success && result.presentation) {
          dispatch({ type: "LOAD_SUCCESS", presentation: result.presentation });
        } else {
          dispatch({ type: "LOAD_ERROR", error: result.error ?? "Error desconocido" });
        }
      } catch (err) {
        dispatch({
          type: "LOAD_ERROR",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    },
    [adapters]
  );

  const handleNext = useCallback(() => {
    if (presentation && currentIndex < presentation.getTotalSlides() - 1) {
      dispatch({ type: "NAVIGATE", index: currentIndex + 1 });
    }
  }, [presentation, currentIndex]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      dispatch({ type: "NAVIGATE", index: currentIndex - 1 });
    }
  }, [currentIndex]);

  const handleSlideSelect = useCallback((index: number) => {
    dispatch({ type: "NAVIGATE", index });
  }, []);

  // Atajos de teclado globales (P para presenter, F para fullscreen)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "p" || e.key === "P") {
        if (presentation) dispatch({ type: "TOGGLE_PRESENTER" });
      }
      if (e.key === "f" || e.key === "F11") {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
        } else {
          document.exitFullscreen();
        }
        dispatch({ type: "TOGGLE_FULLSCREEN" });
      }
      if (e.key === "Escape" && isPresenterMode) {
        dispatch({ type: "TOGGLE_PRESENTER" });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [presentation, isPresenterMode]);

  // --- Render ---

  // Pantalla de carga mientras se inicializan los adaptadores
  if (!adapters) {
    return (
      <ThemeProvider configUseCase={configUseCase}>
        <I18nProvider configUseCase={configUseCase}>
          <div className="h-screen bg-white dark:bg-gray-900 transition-colors flex items-center justify-center">
            <div className="text-gray-400 dark:text-gray-500 text-sm">Cargando...</div>
          </div>
        </I18nProvider>
      </ThemeProvider>
    );
  }

  // Sin presentación: mostrar loader según el entorno
  if (!presentation) {
    return (
      <ThemeProvider configUseCase={configUseCase}>
        <I18nProvider configUseCase={configUseCase}>
          <div className="h-screen bg-white dark:bg-gray-900 transition-colors">
            {adapters.isWeb ? (
              <WebPresentationLoader
                onLoad={handleLoad}
                webFs={adapters.webFileSystem!}
                isLoading={isLoading}
                error={error}
              />
            ) : (
              <PresentationLoader
                onLoad={handleLoad}
                isLoading={isLoading}
                error={error}
              />
            )}
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
              <LanguageSelector />
              <ThemeToggle />
            </div>
            {adapters.isWeb && <WebModeBadge />}
          </div>
        </I18nProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider configUseCase={configUseCase}>
      <I18nProvider configUseCase={configUseCase}>
        <div className="h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors">
          {/* Controles globales: idioma, iconos y tema */}
          <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
            <IconModeToggle mode={iconMode} onToggle={handleToggleIconMode} />
            <LanguageSelector />
            <ThemeToggle />
          </div>

          {/* Modo Presentador (overlay) */}
          <PresenterMode
            currentHtml={currentHtml}
            nextHtml={nextHtml}
            currentIndex={currentIndex}
            totalSlides={presentation.getTotalSlides()}
            isActive={isPresenterMode}
            onDeactivate={() => dispatch({ type: "TOGGLE_PRESENTER" })}
          />

          {/* Vista normal */}
          {!isPresenterMode && (
            <>
              {/* Contenido de la diapositiva */}
              <SlideErrorBoundary>
                <SlideViewer renderedHtml={currentHtml} />
              </SlideErrorBoundary>

              {/* Navegación lineal */}
              <LinearNavigator
                canGoNext={currentIndex < presentation.getTotalSlides() - 1}
                canGoPrevious={currentIndex > 0}
                onNext={handleNext}
                onPrevious={handlePrevious}
              />

              {/* Dock flotante */}
              <FloatingDock
                slides={dockSlides}
                activeIndex={currentIndex}
                position={dockPosition}
                onSlideSelect={handleSlideSelect}
              />
            </>
          )}

          {/* Badge de modo web */}
          {adapters.isWeb && <WebModeBadge />}
        </div>
      </I18nProvider>
    </ThemeProvider>
  );
}
