"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { FullPageSpinner } from "@/components/ui/Spinner";
import type { GitHubFileInfo } from "@/types/sketch";

export default function RepoDetailPage() {
  const params = useParams<{ owner: string; repo: string }>();
  const router = useRouter();
  const { owner, repo } = params;

  const [pages, setPages] = useState<GitHubFileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noPagesDir, setNoPagesDir] = useState(false);

  // New page modal
  const [showNewPage, setShowNewPage] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete page modal
  const [pageToDelete, setPageToDelete] = useState<GitHubFileInfo | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchPages() {
    await Promise.resolve();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/github/files?owner=${owner}&repo=${repo}&path=pages`
      );
      if (res.status === 404) {
        setNoPagesDir(true);
        setPages([]);
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        if (res.status === 401 || data.type === "auth") {
          const { signOut } = await import("next-auth/react");
          signOut({ callbackUrl: "/login?error=AccessDenied" });
          return;
        }
        throw new Error(data.error || "Failed to load pages");
      }
      const data: GitHubFileInfo[] = await res.json();
      // Filter to only .json files
      const jsonFiles = data.filter(
        (f) => f.type === "file" && f.name.endsWith(".json")
      );
      setPages(jsonFiles);
      setNoPagesDir(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load pages");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner, repo]);

  async function handleCreatePage() {
    if (!newPageName.trim()) return;

    const sanitized = newPageName
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/\.json$/, "");

    setCreating(true);
    try {
      const { createEmptyPage } = await import("@/lib/sketch-file");
      const content = JSON.stringify(createEmptyPage(), null, 2);

      const res = await fetch("/api/github/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          path: `pages/${sanitized}.json`,
          content,
          message: `Create page: ${sanitized}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create page");
      }

      setShowNewPage(false);
      setNewPageName("");
      // Navigate to the new page
      router.push(`/canvas/${owner}/${repo}/${sanitized}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create page");
    } finally {
      setCreating(false);
    }
  }

  async function handleCreatePagesDir() {
    setCreating(true);
    try {
      const { createEmptyPage } = await import("@/lib/sketch-file");
      const content = JSON.stringify(createEmptyPage(), null, 2);

      const res = await fetch("/api/github/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          path: "pages/home.json",
          content,
          message: "Initialize SketchGit workspace",
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to initialize workspace");
      }

      router.push(`/canvas/${owner}/${repo}/home`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeletePage() {
    if (!pageToDelete) return;

    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/github/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          path: pageToDelete.path,
          sha: pageToDelete.sha,
          message: `Delete page: ${pageToDelete.name.replace(/\.json$/, "")}`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete page");
      }

      // Remove from pages state
      setPages((prev) => prev.filter((p) => p.sha !== pageToDelete.sha));
      setPageToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete page");
    } finally {
      setDeleting(false);
    }
  }

  const breadcrumbs = [
    { label: "Repositories", href: "/dashboard" },
    { label: `${owner}/${repo}` },
  ];

  if (loading) {
    return (
      <>
        <Header breadcrumbs={breadcrumbs} />
        <FullPageSpinner message="Loading pages..." />
      </>
    );
  }

  return (
    <>
      <Header breadcrumbs={breadcrumbs} />

      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-[var(--accent-primary)] to-transparent opacity-[0.04] blur-[60px] pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
              {repo}
            </h1>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {pages.length} page{pages.length !== 1 ? "s" : ""} in this workspace
            </p>
          </div>
          {!noPagesDir && (
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowNewPage(true)}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
              id="new-page-btn"
            >
              New Page
            </Button>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-sm text-[var(--accent-red)] mb-6 animate-fade-in">
            {error}
          </div>
        )}

        {/* No pages directory yet */}
        {noPagesDir && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--accent-blue)]/10 border border-[var(--border-subtle)] flex items-center justify-center mb-5">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--accent-secondary)]">
                <path d="M12 19l7-7 3 3-7 7-3-3z" />
                <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                <path d="M2 2l7.586 7.586" />
                <circle cx="11" cy="11" r="2" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              No SketchGit workspace yet
            </h2>
            <p className="text-sm text-[var(--text-tertiary)] max-w-md mb-6">
              This repo doesn&apos;t have a <code className="px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-xs">pages/</code> directory.
              Initialize it to start creating diagrams.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleCreatePagesDir}
              loading={creating}
              id="init-workspace-btn"
            >
              Initialize Workspace
            </Button>
          </div>
        )}

        {/* Pages grid */}
        {!noPagesDir && pages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
              </svg>
            </div>
            <p className="text-[var(--text-secondary)] font-medium">
              No pages yet
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1 mb-5">
              Create your first page to start sketching
            </p>
            <Button
              variant="primary"
              onClick={() => setShowNewPage(true)}
            >
              Create first page
            </Button>
          </div>
        )}

        {pages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 stagger-children">
            {pages.map((page) => {
              const pageName = page.name.replace(/\.json$/, "");
              return (
                <Card
                  key={page.sha}
                  onClick={() =>
                    router.push(`/canvas/${owner}/${repo}/${pageName}`)
                  }
                  padding="none"
                  id={`page-${pageName}`}
                >
                  <div className="p-5 relative group">
                    {/* Delete Page Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPageToDelete(page);
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-[var(--radius-sm)] bg-[var(--bg-secondary)]/90 text-[var(--text-tertiary)] hover:text-[var(--accent-red)] hover:bg-[var(--accent-red)]/15 border border-[var(--border-subtle)] transition-all cursor-pointer opacity-0 group-hover:opacity-100 z-10"
                      title="Delete Page"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>

                    {/* Page preview placeholder */}
                    <div className="w-full h-28 rounded-[var(--radius-md)] bg-[var(--bg-primary)] border border-[var(--border-subtle)] mb-4 flex items-center justify-center overflow-hidden">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-[var(--text-muted)] opacity-40">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate capitalize">
                          {pageName}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {(page.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-[var(--text-muted)] flex-shrink-0"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* New Page Modal */}
      <Modal
        isOpen={showNewPage}
        onClose={() => {
          setShowNewPage(false);
          setNewPageName("");
        }}
        title="Create new page"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowNewPage(false);
                setNewPageName("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreatePage}
              loading={creating}
              disabled={!newPageName.trim()}
              id="create-page-confirm"
            >
              Create
            </Button>
          </>
        }
      >
        <label className="block">
          <span className="text-sm font-medium text-[var(--text-primary)] mb-2 block">
            Page name
          </span>
          <input
            type="text"
            value={newPageName}
            onChange={(e) => setNewPageName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newPageName.trim()) handleCreatePage();
            }}
            placeholder="e.g. architecture, user-flow, wireframe"
            className="w-full px-4 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            autoFocus
            id="new-page-name-input"
          />
          <p className="text-xs text-[var(--text-muted)] mt-2">
            Will be saved as <code className="px-1 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--accent-secondary)]">
              pages/{newPageName.trim().replace(/[^a-zA-Z0-9_-]/g, "-") || "page-name"}.json
            </code>
          </p>
        </label>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!pageToDelete}
        onClose={() => setPageToDelete(null)}
        title="Delete Page"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setPageToDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeletePage}
              loading={deleting}
              id="delete-page-confirm"
            >
              Delete Page
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--text-secondary)]">
            Are you sure you want to delete <span className="font-semibold text-[var(--text-primary)] capitalize">{pageToDelete?.name.replace(/\.json$/, "")}</span>?
          </p>
          <p className="text-xs text-[var(--accent-red)] font-medium">
            This action will permanently delete the JSON file from your GitHub repository. This cannot be undone.
          </p>
        </div>
      </Modal>
    </>
  );
}
