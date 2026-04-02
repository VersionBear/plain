import { Component } from 'react';
import { DOCS_URL, SUPPORT_URL } from '../../utils/publicLinks';

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

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

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
              Plain hit an unexpected rendering error. Your notes are usually
              still in this browser or in your connected folder. Refresh the
              page to reopen the app.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-muted">
              Plain has no built-in sync or remote recovery service. If this
              keeps happening, check the storage guide and reconnect your folder
              if you use one.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90"
              >
                Refresh Plain
              </button>
              <a
                href={DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-line/30 hover:text-ink"
              >
                Storage guide
              </a>
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-line/30 hover:text-ink"
              >
                Support
              </a>
            </div>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
