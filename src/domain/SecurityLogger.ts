/**
 * SecurityLogger — Registro de eventos de seguridad.
 *
 * Componente ligero que registra en consola los intentos de inyección
 * detectados por el sanitizador HTML. Cumple con el requerimiento 12.5
 * (A09:2021 — Fallos en el Registro y Monitoreo de Seguridad).
 */

export type SecurityEventType =
  | "xss_script"
  | "xss_event_handler"
  | "xss_dangerous_url"
  | "xss_dangerous_element"
  | "xss_dangerous_style";

export interface SecurityEvent {
  type: SecurityEventType;
  detail: string;
  timestamp: number;
}

export interface ISecurityLogger {
  log(event: SecurityEvent): void;
  getEvents(): SecurityEvent[];
}

export class SecurityLogger implements ISecurityLogger {
  private events: SecurityEvent[] = [];

  log(event: SecurityEvent): void {
    this.events.push(event);
    console.warn(`[SecurityLogger] ${event.type}: ${event.detail}`);
  }

  getEvents(): SecurityEvent[] {
    return [...this.events];
  }
}
