"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import Button from "@/components/ui/Button";

function LoginErrorBanner() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  if (!error) return null;

  let message = "An error occurred during authentication.";
  if (error === "Configuration") {
    message = "Server configuration error. Please ensure AUTH_SECRET and GitHub OAuth credentials are set correctly in your environment.";
  } else if (error === "AccessDenied") {
    message = "Access denied. The authorization request was cancelled or the token has expired.";
  } else if (error === "OAuthSignin") {
    message = "Failed to start the GitHub sign-in process. Please try again.";
  } else if (error === "OAuthCallback") {
    message = "Failed to complete authentication. Verify that your GitHub OAuth App callback URL matches this site's URL.";
  }

  return (
    <div className="mb-6 p-4 rounded-[var(--radius-lg)] bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20 text-sm text-[var(--accent-red)] text-center animate-fade-in">
      <span className="font-semibold">Sign-in failed:</span> {message}
      <p className="text-[10px] mt-1.5 opacity-70">Code: {error}</p>
    </div>
  );
}

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--border-default)] border-t-[var(--accent-primary)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[var(--accent-primary)] opacity-[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[var(--accent-blue)] opacity-[0.04] rounded-full blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-[var(--accent-cyan)] opacity-[0.03] rounded-full blur-[100px]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--text-tertiary) 1px, transparent 1px), linear-gradient(90deg, var(--text-tertiary) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-[var(--accent-primary)] to-transparent opacity-[0.06] blur-[60px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo */}
        <div className="animate-fade-in-up mb-8">
          <div className="w-16 h-16 rounded-[var(--radius-xl)] bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-blue)] flex items-center justify-center shadow-[0_4px_30px_rgba(108,92,231,0.3)] animate-float">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </div>
        </div>

        {/* Hero text */}
        <div className="text-center max-w-xl animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-blue)] animate-gradient">
              SketchGit
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-2">
            GitHub-native visual workspace
          </p>
          <p className="text-sm text-[var(--text-tertiary)] max-w-md mx-auto">
            An infinite canvas where every page is a JSON file committed to your GitHub repo. Diagrams that live with your code, with free version history via commits.
          </p>
        </div>

        {/* Login card */}
        <div
          className="mt-10 glass rounded-[var(--radius-xl)] p-8 w-full max-w-sm animate-fade-in-up shadow-[var(--shadow-lg)]"
          style={{ animationDelay: "250ms" }}
        >
          <Suspense fallback={null}>
            <LoginErrorBanner />
          </Suspense>
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            }
          >
            Sign in with GitHub
          </Button>

          <p className="text-xs text-[var(--text-muted)] text-center mt-4 leading-relaxed">
            SketchGit needs repository access to save your diagrams as files in your GitHub repos.
          </p>
        </div>

        {/* Feature pills */}
        <div
          className="flex flex-wrap items-center justify-center gap-3 mt-10 animate-fade-in-up"
          style={{ animationDelay: "400ms" }}
        >
          {[
            { icon: "🎨", label: "Infinite Canvas" },
            { icon: "📁", label: "GitHub Storage" },
            { icon: "🕒", label: "Version History" },
            { icon: "🔒", label: "You Own Your Data" },
          ].map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-full)] bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)]"
            >
              <span>{feature.icon}</span>
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
