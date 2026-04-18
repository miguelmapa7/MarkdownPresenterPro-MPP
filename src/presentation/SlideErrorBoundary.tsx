import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary para capturar errores de renderizado en diapositivas.
 *
 * Si un componente hijo falla al renderizar, este boundary
 * muestra un mensaje amigable en vez de crashear toda la app.
 * Es como un try/catch pero para componentes React.
 */
export class SlideErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[SlideErrorBoundary]", error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
          <p className="text-lg font-medium mb-2">Error al renderizar la diapositiva</p>
          <p className="text-sm">{this.state.error?.message ?? "Error desconocido"}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
