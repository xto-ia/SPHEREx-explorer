import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defence around the whole app.
 *
 * Without it an exception thrown inside an effect (a stale frame buffer, a
 * malformed response) unmounts the React root and leaves a black page with no
 * explanation. The fallback stays bilingual on purpose: it can render before
 * the language provider is available.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the real stack in the console: the UI only says what happened.
    console.error('SPHEREx Explorer crashed', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 px-6 py-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rose-300">
          viewport error · помилка інтерфейсу
        </p>
        <h1 className="text-xl text-zinc-100">
          The workspace stopped rendering. / Робоча область перестала відображатися.
        </h1>
        <p className="text-[13px] leading-relaxed text-zinc-500">
          Nothing was invented to fill the gap: the failed frame is simply not shown. Reload the page,
          or reopen the field from a clean link. / Дані не підмінялися: збійний кадр просто не
          показано. Перезавантажте сторінку або відкрийте поле чистим посиланням.
        </p>
        <pre className="overflow-x-auto border border-line bg-black/40 px-3 py-2 font-mono text-[10px] leading-relaxed text-zinc-500">
          {error.message}
        </pre>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.location.reload()} className="btn-primary">
            Reload · Перезавантажити
          </button>
          <a href="/" className="btn-ghost">
            Landing · Головна
          </a>
        </div>
      </main>
    );
  }
}
