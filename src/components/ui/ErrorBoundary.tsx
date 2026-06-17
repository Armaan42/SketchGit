"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";
import Button from "./Button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error inside Canvas Boundary:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[var(--bg-primary)] flex items-center justify-center p-6 z-[9999]">
          {/* Background decorative glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--accent-red)] opacity-[0.03] rounded-full blur-[100px] pointer-events-none" />

          <div className="relative glass rounded-[var(--radius-xl)] p-8 max-w-lg w-full text-center shadow-[var(--shadow-lg)] border border-[var(--accent-red)]/20 animate-scale-in">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto rounded-full bg-[var(--accent-red)]/10 flex items-center justify-center mb-6">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-[var(--accent-red)]"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              Something went wrong on the canvas
            </h2>
            
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              A client-side error occurred while rendering the whiteboard. This can happen if the page data has a mismatched schema or if the editor layout collapsed.
            </p>

            {this.state.error && (
              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--bg-secondary)] border border-[var(--border-subtle)] text-left mb-6 overflow-auto max-h-32 text-xs font-mono text-[var(--text-secondary)]">
                <span className="text-[var(--accent-red)] font-semibold">Error:</span> {this.state.error.message}
                {this.state.error.stack && (
                  <pre className="mt-2 opacity-70 whitespace-pre-wrap">
                    {this.state.error.stack.split("\n").slice(0, 3).join("\n")}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => (window.location.href = "/dashboard")}
                className="w-full sm:w-auto"
              >
                Back to Dashboard
              </Button>
              <Button
                variant="primary"
                onClick={this.handleReload}
                className="w-full sm:w-auto"
              >
                Reload Canvas
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
