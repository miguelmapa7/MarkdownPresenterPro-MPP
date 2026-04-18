import React from "react";
import { motion, useMotionValue } from "framer-motion";
import { DockIcon } from "./DockIcon";
import type { IconResult } from "@/domain";
import type { SlideMetadata } from "@/domain";
import type { DockPosition } from "@/application";

interface DockSlideInfo {
  metadata: SlideMetadata;
  icon: IconResult;
}

interface FloatingDockProps {
  /** Info de cada diapositiva (metadatos + icono resuelto) */
  slides: DockSlideInfo[];
  /** Índice de la diapositiva activa */
  activeIndex: number;
  /** Posición del Dock en la pantalla */
  position: DockPosition;
  /** Callback al seleccionar una diapositiva */
  onSlideSelect: (index: number) => void;
}

/** Clases CSS según la posición del Dock */
const POSITION_CLASSES: Record<DockPosition, string> = {
  bottom: "bottom-4 left-1/2 -translate-x-1/2 flex-row",
  top: "top-4 left-1/2 -translate-x-1/2 flex-row",
  left: "left-4 top-1/2 -translate-y-1/2 flex-col",
  right: "right-4 top-1/2 -translate-y-1/2 flex-col",
};

/**
 * Componente FloatingDock — Menú flotante tipo Dock de macOS.
 *
 * Muestra un icono por cada diapositiva con efecto de magnificación.
 * Se posiciona en cualquiera de los 4 bordes de la pantalla.
 * El MotionValue del mouse se comparte entre todos los DockIcon
 * para que calculen su escala sin causar re-renders.
 */
export const FloatingDock: React.FC<FloatingDockProps> = ({
  slides,
  activeIndex,
  position,
  onSlideSelect,
}) => {
  // MotionValue compartido: posición del mouse
  // Se actualiza en onMouseMove sin causar re-renders
  const mouseX = useMotionValue(Infinity);

  const isHorizontal = position === "top" || position === "bottom";

  return (
    <motion.div
      onMouseMove={(e) => {
        mouseX.set(isHorizontal ? e.pageX : e.pageY);
      }}
      onMouseLeave={() => mouseX.set(Infinity)}
      layout
      className={`fixed z-50 flex items-end gap-2 rounded-2xl
        bg-white/80 backdrop-blur-md shadow-lg border border-gray-200/50
        dark:bg-gray-800/80 dark:border-gray-700/50
        p-2 ${POSITION_CLASSES[position]}`}
    >
      {slides.map((slide, index) => (
        <DockIcon
          key={index}
          iconSvg={slide.icon.content}
          mouseX={mouseX}
          isActive={index === activeIndex}
          onClick={() => onSlideSelect(index)}
          title={slide.metadata.title}
        />
      ))}
    </motion.div>
  );
};
