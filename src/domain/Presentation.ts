import { Slide } from "./Slide";

/**
 * Evento emitido cuando cambia la diapositiva activa.
 */
export interface SlideChangedEvent {
  previousIndex: number;
  currentIndex: number;
  slide: Slide;
  totalSlides: number;
}

/**
 * Interfaz Observer — Los componentes que quieran reaccionar
 * a cambios de diapositiva deben implementar esta interfaz.
 * Ejemplo: el FloatingDock la implementa para resaltar el icono activo.
 */
export interface ISlideObserver {
  onSlideChanged(event: SlideChangedEvent): void;
}

/**
 * Entidad Presentation — Colección ordenada de diapositivas
 * con estado de navegación y patrón Observer.
 *
 * Es el "sujeto" del patrón Observer: cuando se navega
 * a otra diapositiva, notifica a todos los observadores
 * registrados (Dock, SlideViewer, etc.).
 */
export class Presentation {
  private currentIndex: number = 0;
  private observers: Set<ISlideObserver> = new Set();

  constructor(private readonly slides: Slide[]) {
    if (slides.length === 0) {
      throw new Error("Una presentación debe tener al menos una diapositiva");
    }
  }

  // --- Navegación ---

  /**
   * Navega a una diapositiva específica por índice.
   * Lanza RangeError si el índice está fuera de rango.
   */
  goToSlide(index: number): SlideChangedEvent {
    if (index < 0 || index >= this.slides.length) {
      throw new RangeError(
        `Índice ${index} fuera de rango [0, ${this.slides.length - 1}]`
      );
    }

    const previousIndex = this.currentIndex;
    this.currentIndex = index;

    const event: SlideChangedEvent = {
      previousIndex,
      currentIndex: this.currentIndex,
      slide: this.slides[this.currentIndex]!,
      totalSlides: this.slides.length,
    };

    this.notifyObservers(event);
    return event;
  }

  /**
   * Avanza a la siguiente diapositiva.
   * Retorna null si ya está en la última (no modifica estado).
   */
  next(): SlideChangedEvent | null {
    if (this.isLastSlide()) {
      return null;
    }
    return this.goToSlide(this.currentIndex + 1);
  }

  /**
   * Retrocede a la diapositiva anterior.
   * Retorna null si ya está en la primera (no modifica estado).
   */
  previous(): SlideChangedEvent | null {
    if (this.isFirstSlide()) {
      return null;
    }
    return this.goToSlide(this.currentIndex - 1);
  }

  // --- Consultas ---

  getCurrentSlide(): Slide {
    return this.slides[this.currentIndex]!;
  }

  getSlideAt(index: number): Slide {
    if (index < 0 || index >= this.slides.length) {
      throw new RangeError(
        `Índice ${index} fuera de rango [0, ${this.slides.length - 1}]`
      );
    }
    return this.slides[index]!;
  }

  getSlides(): readonly Slide[] {
    return this.slides;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  getTotalSlides(): number {
    return this.slides.length;
  }

  isFirstSlide(): boolean {
    return this.currentIndex === 0;
  }

  isLastSlide(): boolean {
    return this.currentIndex === this.slides.length - 1;
  }

  // --- Observer ---

  addObserver(observer: ISlideObserver): void {
    this.observers.add(observer);
  }

  removeObserver(observer: ISlideObserver): void {
    this.observers.delete(observer);
  }

  private notifyObservers(event: SlideChangedEvent): void {
    for (const observer of this.observers) {
      observer.onSlideChanged(event);
    }
  }
}
