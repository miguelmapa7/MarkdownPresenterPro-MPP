import React from "react";
import { SlideViewer } from "./SlideViewer";
import { formatSlideCounter } from "./formatSlideCounter";
import { useTimer } from "./useTimer";

interface PresenterModeProps {
  currentHtml: string;
  nextHtml: string | null;
  currentIndex: number;
  totalSlides: number;
  isActive: boolean;
  onDeactivate: () => void;
}

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export const PresenterMode: React.FC<PresenterModeProps> = ({
  currentHtml,
  nextHtml,
  currentIndex,
  totalSlides,
  isActive,
  onDeactivate,
}) => {
  const elapsedSeconds = useTimer(isActive);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-40 flex bg-gray-900">
      <div className="flex-[7] bg-white overflow-auto">
        <SlideViewer renderedHtml={currentHtml} />
      </div>

      <div className="flex-[3] flex flex-col bg-gray-800 text-white p-4 gap-4">
        <div className="flex-1 rounded-lg overflow-auto bg-gray-700 p-2">
          {nextHtml ? (
            <div
              className="prose prose-invert prose-sm max-w-none scale-75 origin-top-left"
              dangerouslySetInnerHTML={{ __html: nextHtml }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-lg font-medium">
              Fin de Presentación
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="font-mono text-lg">{formatTime(elapsedSeconds)}</span>
          <span className="text-gray-300">
            {formatSlideCounter(currentIndex, totalSlides)}
          </span>
        </div>

        <button
          onClick={onDeactivate}
          className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition-colors"
        >
          Salir del Modo Presentador
        </button>
      </div>
    </div>
  );
};
