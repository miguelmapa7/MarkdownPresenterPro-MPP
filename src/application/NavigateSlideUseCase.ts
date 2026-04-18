import type { Presentation, Slide, SlideChangedEvent } from "@/domain";

/**
 * Estado de navegación actual — lo que la UI necesita saber
 * para renderizar botones, indicadores y contenido.
 */
export interface NavigationState {
  currentIndex: number;
  totalSlides: number;
  canGoNext: boolean;
  canGoPrevious: boolean;
  currentSlide: Slide;
}

/**
 * Caso de uso: Navegar entre Diapositivas.
 *
 * Fachada sobre la entidad Presentation que simplifica
 * la interacción para la capa de UI. Los componentes React
 * usan este caso de uso en vez de manipular Presentation directamente.
 */
export class NavigateSlideUseCase {
  constructor(private readonly presentation: Presentation) {}

  next(): SlideChangedEvent | null {
    return this.presentation.next();
  }

  previous(): SlideChangedEvent | null {
    return this.presentation.previous();
  }

  goTo(index: number): SlideChangedEvent {
    return this.presentation.goToSlide(index);
  }

  getNavigationState(): NavigationState {
    return {
      currentIndex: this.presentation.getCurrentIndex(),
      totalSlides: this.presentation.getTotalSlides(),
      canGoNext: !this.presentation.isLastSlide(),
      canGoPrevious: !this.presentation.isFirstSlide(),
      currentSlide: this.presentation.getCurrentSlide(),
    };
  }
}
