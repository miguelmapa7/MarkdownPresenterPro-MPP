import React, { useRef } from "react";
import { motion, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useTranslation } from "./I18nProvider";

interface DockIconProps {
  /** SVG string del icono */
  iconSvg: string;
  /** Posición X del mouse (MotionValue compartido por el Dock) */
  mouseX: MotionValue<number>;
  /** Si esta es la diapositiva activa */
  isActive: boolean;
  /** Callback al hacer clic */
  onClick: () => void;
  /** Tooltip con el título de la diapositiva */
  title: string;
}

/** Tamaño base del icono en píxeles */
const BASE_SIZE = 40;
/** Tamaño máximo al magnificar */
const MAX_SIZE = 64;
/** Radio de influencia en píxeles (qué tan lejos afecta el cursor) */
const MAGNIFICATION_RADIUS = 150;

/**
 * Componente DockIcon — Icono individual del Dock con efecto de magnificación.
 *
 * Cada icono calcula su escala basándose en la distancia al cursor:
 * - Cursor encima → escala máxima (MAX_SIZE)
 * - Cursor lejos → escala base (BASE_SIZE)
 * - Transición suave con useSpring
 *
 * El algoritmo garantiza:
 * - Escala máxima en el icono más cercano al cursor
 * - Decrecimiento monótono con la distancia
 * - Orden relativo de iconos preservado
 * - Escala dentro de límites [BASE_SIZE, MAX_SIZE]
 */
export const DockIcon: React.FC<DockIconProps> = ({
  iconSvg,
  mouseX,
  isActive,
  onClick,
  title,
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();

  // Distancia del centro del icono al cursor
  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return MAGNIFICATION_RADIUS + 1;
    return val - (bounds.x + bounds.width / 2);
  });

  // Mapear distancia → tamaño del icono
  // Cuando distancia = 0 → MAX_SIZE, cuando distancia >= RADIUS → BASE_SIZE
  const widthSync = useTransform(
    distance,
    [-MAGNIFICATION_RADIUS, 0, MAGNIFICATION_RADIUS],
    [BASE_SIZE, MAX_SIZE, BASE_SIZE]
  );

  // Suavizar con spring para transición fluida
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.button
      ref={ref}
      style={{ width, height: width }}
      onClick={onClick}
      title={title}
      aria-label={t("nav.slideLabel", { title })}
      className={`flex items-center justify-center rounded-xl transition-colors
        ${
          isActive
            ? "bg-blue-500/20 ring-2 ring-blue-400"
            : "bg-gray-200/60 hover:bg-gray-300/80 dark:bg-gray-600/60 dark:hover:bg-gray-500/80"
        }`}
    >
      <div
        className="w-3/5 h-3/5 [&>svg]:w-full [&>svg]:h-full [&>svg]:stroke-gray-600 dark:[&>svg]:stroke-gray-300"
        dangerouslySetInnerHTML={{ __html: iconSvg }}
      />
    </motion.button>
  );
};

export { BASE_SIZE, MAX_SIZE, MAGNIFICATION_RADIUS };
