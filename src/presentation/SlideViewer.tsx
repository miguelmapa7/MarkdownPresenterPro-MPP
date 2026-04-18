import React from "react";

interface SlideViewerProps {
  /** HTML renderizado de la diapositiva actual */
  renderedHtml: string;
}

/**
 * Componente SlideViewer — Visualiza el contenido de una diapositiva.
 *
 * Renderiza el HTML generado por Unified.js con estilos Tailwind.
 * Maximiza el área de contenido según el diseño minimalista.
 * Usa dangerouslySetInnerHTML porque el HTML viene de nuestro
 * pipeline controlado (Markdown → AST → HTML).
 */
export const SlideViewer: React.FC<SlideViewerProps> = ({ renderedHtml }) => {
  return (
    <div className="flex-1 overflow-auto p-8 md:p-12 lg:p-16">
      <article
        className="prose prose-neutral max-w-none
          prose-headings:text-gray-800
          prose-p:text-gray-700
          prose-code:text-sm
          prose-pre:bg-gray-900 prose-pre:text-gray-100
          prose-img:rounded-lg prose-img:shadow-md
          prose-table:border-collapse
          prose-th:bg-gray-100 prose-th:p-2
          prose-td:border prose-td:border-gray-200 prose-td:p-2"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
};
