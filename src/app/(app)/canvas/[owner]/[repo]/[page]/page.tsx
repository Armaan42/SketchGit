"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { FullPageSpinner } from "@/components/ui/Spinner";

// tldraw MUST be loaded client-side only (no SSR)
const SketchEditor = dynamic(
  () => import("@/components/canvas/SketchEditor"),
  { ssr: false }
);

export default function CanvasPage() {
  const params = useParams<{ owner: string; repo: string; page: string }>();
  const { owner, repo, page } = params;

  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPage() {
      try {
        const res = await fetch(
          `/api/github/files?owner=${owner}&repo=${repo}&path=pages/${page}.json&raw=true`
        );

        if (res.status === 404) {
          // File doesn't exist yet — will be created on first save
          setContent(null);
          setSha(null);
          setLoading(false);
          return;
        }

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load page");
        }

        const data = await res.json();
        setContent(data.content);
        setSha(data.sha);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load page");
      } finally {
        setLoading(false);
      }
    }

    fetchPage();
  }, [owner, repo, page]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[var(--bg-primary)]">
        <FullPageSpinner message={`Loading ${page}...`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-[var(--accent-red)]/10 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent-red)]">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            Failed to load page
          </h2>
          <p className="text-sm text-[var(--text-tertiary)] mb-5 max-w-md">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white text-sm font-semibold hover:brightness-110 transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <SketchEditor
      owner={owner}
      repo={repo}
      page={page}
      initialContent={content}
      initialSha={sha}
    />
  );
}
