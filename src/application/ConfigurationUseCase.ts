import type { IPersistenceAdapter } from "@/infrastructure/IPersistenceAdapter";

/** Posiciones válidas del menú flotante Dock */
export type DockPosition = "top" | "bottom" | "left" | "right";

/** Idiomas soportados por la aplicación */
export type SupportedLocale = "es" | "en";

/** Archivo abierto recientemente */
export interface RecentFile {
  path: string;
  type: "file" | "directory";
  lastOpened: string; // ISO 8601
  title: string;
}

/** Mapa de atajos de teclado configurables */
export interface KeyboardShortcutMap {
  nextSlide: string[];
  previousSlide: string[];
  togglePresenterMode: string[];
  toggleFullscreen: string[];
  exitPresentation: string[];
}

/** Configuración completa del usuario */
export interface UserConfiguration {
  dockPosition: DockPosition;
  theme: "light" | "dark";
  locale: SupportedLocale;
  recentFiles: RecentFile[];
  keyboardShortcuts: KeyboardShortcutMap;
}

/** Valores predeterminados para primera ejecución */
const DEFAULT_CONFIG: UserConfiguration = {
  dockPosition: "bottom",
  theme: "light",
  locale: "es",
  recentFiles: [],
  keyboardShortcuts: {
    nextSlide: ["ArrowRight", "Space"],
    previousSlide: ["ArrowLeft"],
    togglePresenterMode: ["p"],
    toggleFullscreen: ["f", "F11"],
    exitPresentation: ["Escape"],
  },
};

const CONFIG_KEY = "mpp-user-config";

/**
 * Caso de uso: Gestión de Configuración.
 *
 * Administra las preferencias del usuario (posición del Dock,
 * tema, archivos recientes, atajos de teclado).
 * Delega la persistencia a IPersistenceAdapter.
 */
export class ConfigurationUseCase {
  constructor(private readonly persistence: IPersistenceAdapter) {}

  /** Obtiene la configuración completa, con defaults si no existe */
  getConfig(): UserConfiguration {
    const saved = this.persistence.get<UserConfiguration>(CONFIG_KEY);
    if (!saved) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...saved };
  }

  /** Obtiene la posición actual del Dock */
  getDockPosition(): DockPosition {
    return this.getConfig().dockPosition;
  }

  /** Cambia la posición del Dock y persiste */
  setDockPosition(position: DockPosition): void {
    const config = this.getConfig();
    config.dockPosition = position;
    this.persistence.set(CONFIG_KEY, config);
  }

  /** Obtiene el tema actual */
  getTheme(): "light" | "dark" {
    return this.getConfig().theme;
  }

  /** Cambia el tema y persiste */
  setTheme(theme: "light" | "dark"): void {
    const config = this.getConfig();
    config.theme = theme;
    this.persistence.set(CONFIG_KEY, config);
  }

  /** Agrega un archivo a la lista de recientes */
  addRecentFile(file: Omit<RecentFile, "lastOpened">): void {
    const config = this.getConfig();
    // Remover si ya existe para moverlo al inicio
    config.recentFiles = config.recentFiles.filter((f) => f.path !== file.path);
    config.recentFiles.unshift({
      ...file,
      lastOpened: new Date().toISOString(),
    });
    // Mantener máximo 10 recientes
    config.recentFiles = config.recentFiles.slice(0, 10);
    this.persistence.set(CONFIG_KEY, config);
  }

  /** Obtiene la lista de archivos recientes */
  getRecentFiles(): RecentFile[] {
    return this.getConfig().recentFiles;
  }

  /** Obtiene los atajos de teclado */
  getKeyboardShortcuts(): KeyboardShortcutMap {
    return this.getConfig().keyboardShortcuts;
  }

  /** Obtiene el idioma preferido del usuario */
  getLocale(): SupportedLocale {
    return this.getConfig().locale;
  }

  /** Cambia el idioma y persiste la preferencia */
  setLocale(locale: SupportedLocale): void {
    const config = this.getConfig();
    config.locale = locale;
    this.persistence.set(CONFIG_KEY, config);
  }
}
