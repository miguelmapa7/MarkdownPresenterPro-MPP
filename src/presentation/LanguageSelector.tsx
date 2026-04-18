import React from "react";
import { useTranslation } from "./I18nProvider";
import type { SupportedLocale } from "@/application/ConfigurationUseCase";

interface LanguageSelectorProps {
  className?: string;
}

const LANGUAGES: { code: SupportedLocale; label: string }[] = [
  { code: "es", label: "ES" },
  { code: "en", label: "EN" },
];

/**
 * LanguageSelector — Selector de idioma con botones.
 *
 * Usa botones en vez de <select> porque WebKit (Tauri)
 * no respeta estilos CSS en <option> para dark mode.
 */
export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ className = "" }) => {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      className={`flex items-center gap-0.5 rounded-lg overflow-hidden ${className}`}
      role="radiogroup"
      aria-label={t("lang.label")}
    >
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLocale(code)}
          role="radio"
          aria-checked={locale === code}
          className={`px-2.5 py-1.5 text-xs font-medium transition-colors
            ${
              locale === code
                ? "bg-blue-500 text-white"
                : "bg-gray-200/60 text-gray-600 hover:bg-gray-300/80 dark:bg-gray-700/60 dark:text-gray-300 dark:hover:bg-gray-600/80"
            }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
};
