import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ConfigurationUseCase } from "@/application/ConfigurationUseCase";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  children: React.ReactNode;
  configUseCase: ConfigurationUseCase;
}

/**
 * ThemeProvider — Gestiona el tema visual de la aplicación.
 *
 * Lee la preferencia almacenada via ConfigurationUseCase al montar.
 * Aplica/remueve la clase 'dark' en document.documentElement.
 * Persiste automáticamente al cambiar tema.
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  configUseCase,
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return configUseCase.getTheme();
    } catch {
      return "light";
    }
  });

  // Sincronizar clase 'dark' en <html>
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      try {
        configUseCase.setTheme(newTheme);
      } catch {
        console.warn("[ThemeProvider] No se pudo persistir el tema");
      }
    },
    [configUseCase]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "light" ? "dark" : "light");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook para consumir el contexto de tema.
 * Debe usarse dentro de un ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme debe usarse dentro de un ThemeProvider");
  }
  return ctx;
}
