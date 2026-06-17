"use client";

import Link from "next/link";
import type { SaveStatus } from "./SketchEditor";

interface SaveToolbarProps {
  owner: string;
  repo: string;
  page: string;
  status: SaveStatus;
  errorMessage: string | null;
  onSave: () => void;
  onReload: () => void;
}

const statusConfig: Record<
  SaveStatus,
  { label: string; color: string; icon: string }
> = {
  idle: {
    label: "",
    color: "text-[var(--text-muted)]",
    icon: "",
  },
  unsaved: {
    label: "Unsaved changes",
    color: "text-[var(--accent-orange)]",
    icon: "●",
  },
  saving: {
    label: "Saving…",
    color: "text-[var(--accent-blue)]",
    icon: "",
  },
  saved: {
    label: "Saved",
    color: "text-[var(--accent-green)]",
    icon: "✓",
  },
  error: {
    label: "Save failed",
    color: "text-[var(--accent-red)]",
    icon: "✗",
  },
  conflict: {
    label: "Conflict",
    color: "text-[var(--accent-red)]",
    icon: "⚠",
  },
};

export default function SaveToolbar({
  owner,
  repo,
  page,
  status,
  errorMessage,
  onSave,
  onReload,
}: SaveToolbarProps) {
  const config = statusConfig[status];

  return (
    <>
      {/* Top toolbar */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-4 pointer-events-none">
        {/* Left: Navigation */}
        <div className="pointer-events-auto">
          <Link
            href={`/dashboard/${owner}/${repo}`}
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] glass-strong shadow-[var(--shadow-md)] hover:bg-[var(--bg-surface)] transition-all group"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors font-medium">
              {repo}
            </span>
            <span className="text-[var(--text-muted)]">/</span>
            <span className="text-sm text-[var(--text-primary)] font-semibold capitalize">
              {page}
            </span>
          </Link>
        </div>

        {/* Right: Save controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Status indicator */}
          {status !== "idle" && (
            <div
              className={`flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] glass-strong shadow-[var(--shadow-sm)] text-xs font-medium ${config.color}`}
            >
              {status === "saving" ? (
                <div className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                config.icon && <span>{config.icon}</span>
              )}
              <span>{config.label}</span>
            </div>
          )}

          {/* Save button */}
          <button
            onClick={onSave}
            disabled={status === "saving" || status === "idle"}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)]
              text-sm font-semibold transition-all cursor-pointer
              shadow-[var(--shadow-md)]
              ${
                status === "unsaved" || status === "error"
                  ? "bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white hover:brightness-110"
                  : "glass-strong text-[var(--text-secondary)]"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            id="save-btn"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save
            <kbd className="ml-1 px-1 py-0.5 rounded bg-white/10 text-[10px] font-mono hidden sm:inline">
              ⌘S
            </kbd>
          </button>
        </div>
      </div>

      {/* Error / Conflict banner */}
      {(status === "error" || status === "conflict") && errorMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[300] animate-fade-in-up">
          <div className="flex items-center gap-3 px-5 py-3 rounded-[var(--radius-lg)] glass-strong shadow-[var(--shadow-lg)] border border-[var(--accent-red)]/30">
            <span className="text-sm text-[var(--accent-red)]">
              {errorMessage}
            </span>
            {status === "conflict" && (
              <button
                onClick={onReload}
                className="px-3 py-1 rounded-[var(--radius-sm)] bg-[var(--accent-red)] text-white text-xs font-semibold hover:brightness-110 transition-all cursor-pointer"
              >
                Reload
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
