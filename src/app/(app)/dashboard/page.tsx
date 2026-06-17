"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card from "@/components/ui/Card";
import { FullPageSpinner } from "@/components/ui/Spinner";
import type { GitHubRepo } from "@/types/sketch";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchRepos() {
      try {
        const res = await fetch("/api/github/repos?per_page=100");
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to fetch repos");
        }
        const data = await res.json();
        setRepos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load repos");
      } finally {
        setLoading(false);
      }
    }
    fetchRepos();
  }, []);

  const filteredRepos = useMemo(() => {
    if (!search.trim()) return repos;
    const q = search.toLowerCase();
    return repos.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.full_name.toLowerCase().includes(q)
    );
  }, [repos, search]);

  if (loading) {
    return (
      <>
        <Header />
        <FullPageSpinner message="Loading your repositories..." />
      </>
    );
  }

  return (
    <>
      <Header />

      {/* Background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-[var(--accent-primary)] to-transparent opacity-[0.04] blur-[60px] pointer-events-none" />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page header */}
        <div className="animate-fade-in mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Welcome back{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Select a repository to open or create sketches
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-6 animate-fade-in" style={{ animationDelay: "60ms" }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search repositories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-[var(--radius-lg)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] transition-all"
            id="search-repos"
          />
        </div>

        {error && (
          <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-sm text-[var(--accent-red)] mb-6 animate-fade-in">
            {error}
          </div>
        )}

        {/* Repo grid */}
        {filteredRepos.length === 0 && !error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-muted)]">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p className="text-[var(--text-secondary)] font-medium">
              {search ? "No repositories match your search" : "No repositories found"}
            </p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {search
                ? "Try a different search term"
                : "Create a repository on GitHub to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
            {filteredRepos.map((repo) => (
              <Card
                key={repo.id}
                onClick={() =>
                  router.push(`/dashboard/${repo.owner.login}/${repo.name}`)
                }
                padding="none"
                id={`repo-${repo.name}`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--accent-primary)]/20 to-[var(--accent-blue)]/20 border border-[var(--border-subtle)] flex items-center justify-center flex-shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--accent-secondary)]">
                          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                          <path d="M9 18c-4.51 2-5-2-7-2" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                          {repo.name}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)]">
                          {repo.owner.login}
                        </p>
                      </div>
                    </div>
                    {repo.private && (
                      <span className="flex-shrink-0 px-2 py-0.5 rounded-[var(--radius-full)] bg-[var(--bg-tertiary)] text-[10px] font-medium text-[var(--text-muted)] border border-[var(--border-subtle)]">
                        Private
                      </span>
                    )}
                  </div>

                  {repo.description && (
                    <p className="text-xs text-[var(--text-tertiary)] line-clamp-2 mb-3">
                      {repo.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[var(--accent-cyan)]" />
                        {repo.language}
                      </span>
                    )}
                    {repo.stargazers_count > 0 && (
                      <span className="flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[var(--accent-orange)]">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        {repo.stargazers_count}
                      </span>
                    )}
                    <span className="ml-auto">
                      {repo.updated_at
                        ? new Date(repo.updated_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        : ""}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
