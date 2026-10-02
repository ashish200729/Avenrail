import { Component, useState, type ReactNode } from "react";

export function startupErrorDetail(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string" && error.trim()) return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message || "An unknown error interrupted startup.";
  }
  return "An unknown error interrupted startup.";
}

export function StartupError({
  error,
  onRetry = () => window.location.reload(),
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const detail = startupErrorDetail(error);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(detail);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopyFailed(true);
    }
  };
  return (
    <main className="flex h-full items-center justify-center overflow-y-auto bg-background-base p-6 text-content">
      <div role="alert" className="w-full max-w-lg">
        <h1 className="text-xl font-semibold">Avenrail couldn't start</h1>
        <p className="mt-3 text-sm leading-relaxed text-content/70">
          Reload to try again. If this keeps happening, copy the error details.
        </p>
        <details className="mt-5 rounded-lg border border-content/15 p-3">
          <summary className="cursor-pointer text-sm focus-visible:outline-2 focus-visible:outline-accent">
            Error details
          </summary>
          <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed select-text">
            {detail}
          </pre>
        </details>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md bg-content px-3 py-2 text-sm font-medium text-background-base focus-visible:outline-2 focus-visible:outline-accent"
          >
            Reload app
          </button>
          <button
            type="button"
            onClick={() => void copy()}
            className="rounded-md border border-content/20 px-3 py-2 text-sm hover:bg-content/8 focus-visible:outline-2 focus-visible:outline-accent"
          >
            {copied ? "Copied" : "Copy error"}
          </button>
        </div>
        {copyFailed ? (
          <p className="mt-3 text-xs text-content/70" role="status">
            Copy is unavailable. Select the text in Error details to copy it.
          </p>
        ) : null}
      </div>
    </main>
  );
}

export class StartupBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; error: unknown }
> {
  state = { failed: false, error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { failed: true, error };
  }

  render() {
    return this.state.failed ? (
      <StartupError error={this.state.error} />
    ) : (
      this.props.children
    );
  }
}
