/** Formatea el contador de diapositivas: "N de M" */
export function formatSlideCounter(currentIndex: number, totalSlides: number): string {
  return `${currentIndex + 1} de ${totalSlides}`;
}
