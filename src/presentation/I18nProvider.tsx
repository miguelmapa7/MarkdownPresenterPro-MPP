import React, { createContext, useContext, useState, useCallback } from "react";
import type { ConfigurationUseCase } from "@/application/ConfigurationUseCase";
import type { SupportedLocale } from "@/application/ConfigurationUseCase";
import esTranslations from "@/i18n/locales/es.json";
import enTranslations from "@/i18n/locales/en.json";

type TranslationMap = Record<string, string>;

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/** Mapa de traducciones por idioma */
const translations: Record<SupportedLocale, TranslationMap> = {
  es: esTranslations,
  en: enTranslations,
};

interface I18nProviderProps {
  children: React.ReactNode;
  configUseCase: ConfigurationUseCase;
}

/**
 * I18nProvider — Sistema ligero de internacionalización.
 *
 * Carga traducciones desde archivos JSON estáticos.
 * Resuelve claves con fallback a español si falta una clave.
 * Persiste la preferencia de idioma via ConfigurationUseCase.
 */
export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  configUseCase,
}) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    try {
      return configUseCase.getLocale();
    } catch {
      return "es";
    }
  });

  const setLocale = useCallback(
    (newLocale: SupportedLocale) => {
      setLocaleState(newLocale);
      try {
        configUseCase.setLocale(newLocale);
      } catch {
        console.warn("[I18nProvider] No se pudo persistir el idioma");
      }
    },
    [configUseCase]
  );

  /**
   * Función de traducción.
   * Busca la clave en el idioma activo; si no existe, usa español como fallback.
   * Si tampoco existe en español, retorna la clave misma.
   * Soporta interpolación: t("key", { current: "1", total: "5" })
   */
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = translations[locale]?.[key] ?? translations["es"]?.[key] ?? key;

      if (params) {
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          value = value.replace(`{${paramKey}}`, String(paramValue));
        });
      }

      return value;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

/**
 * Hook para consumir traducciones.
 * Debe usarse dentro de un I18nProvider.
 */
export function useTranslation(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useTranslation debe usarse dentro de un I18nProvider");
  }
  return ctx;
}
