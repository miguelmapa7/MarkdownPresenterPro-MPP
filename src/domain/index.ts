// Capa de Dominio — Entidades y servicios core
// Exporta las entidades, interfaces y servicios de la lógica de negocio

export { Slide } from "./Slide";
export type { SlideContentType, SlideMetadata } from "./Slide";
export { Presentation } from "./Presentation";
export type { SlideChangedEvent, ISlideObserver } from "./Presentation";
export { MarkdownParser } from "./MarkdownParser";
export type { IMarkdownParser } from "./MarkdownParser";
export { IconResolver } from "./IconResolver";
export type { IIconResolver, IconResult, IconMode } from "./IconResolver";
