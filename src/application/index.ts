// Capa de Aplicación — Casos de uso
// Exporta los casos de uso que orquestan la lógica de dominio

export { LoadPresentationUseCase } from "./LoadPresentationUseCase";
export type {
  LoadPresentationInput,
  LoadPresentationResult,
} from "./LoadPresentationUseCase";
export { NavigateSlideUseCase } from "./NavigateSlideUseCase";
export type { NavigationState } from "./NavigateSlideUseCase";
export {
  RenderMarkdownUseCase,
  StrategyRegistry,
  createDefaultRegistry,
} from "./RenderMarkdownUseCase";
export type { RenderedSlide, RenderStrategy } from "./RenderMarkdownUseCase";
export { ConfigurationUseCase } from "./ConfigurationUseCase";
export type {
  DockPosition,
  UserConfiguration,
  RecentFile,
  KeyboardShortcutMap,
} from "./ConfigurationUseCase";
