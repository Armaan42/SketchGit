"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface HeaderProps {
  breadcrumbs?: BreadcrumbItem[];
}

export default function Header({ breadcrumbs }: HeaderProps) {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo + Breadcrumbs */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 group"
            >
              {/* Logo mark */}
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-blue)] flex items-center justify-center shadow-[0_2px_10px_rgba(108,92,231,0.3)] transition-transform duration-[var(--transition-base)] group-hover:scale-105">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 19l7-7 3 3-7 7-3-3z" />
                  <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
                  <path d="M2 2l7.586 7.586" />
                  <circle cx="11" cy="11" r="2" />
                </svg>
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)] tracking-tight hidden sm:block">
                SketchGit
              </span>
            </Link>

            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-1 ml-2">
                {breadcrumbs.map((crumb, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-[var(--text-muted)]"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-sm text-[var(--text-primary)] font-medium">
                        {crumb.label}
                      </span>
                    )}
                  </div>
                ))}
              </nav>
            )}
          </div>

          {/* User menu */}
          {session?.user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
              >
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-7 h-7 rounded-full ring-2 ring-[var(--border-default)]"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-xs font-bold text-white">
                    {session.user.name?.[0] || "U"}
                  </div>
                )}
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`text-[var(--text-tertiary)] transition-transform ${menuOpen ? "rotate-180" : ""}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 glass-strong rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] py-1.5 animate-scale-in origin-top-right">
                  <div className="px-4 py-2.5 border-b border-[var(--border-subtle)]">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                      {session.user.name}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] truncate mt-0.5">
                      {session.user.login || session.user.email}
                    </p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="w-full text-left px-4 py-2.5 text-sm text-[var(--accent-red)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
