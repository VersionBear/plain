import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Plain crashed while rendering.', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12 text-ink">
          <div className="max-w-md rounded-3xl border border-line bg-panel p-8 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
              Plain
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight">
              Something went wrong
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              The app hit an unexpected error while rendering. Refresh the page
              to retry.
            </p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
