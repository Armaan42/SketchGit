"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`relative ${sizeMap[size]}`}>
        {/* Outer ring */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-[var(--border-default)]`}
        />
        {/* Spinning arc */}
        <div
          className={`absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--accent-primary)] border-r-[var(--accent-secondary)] animate-spin`}
        />
        {/* Inner glow */}
        <div
          className={`absolute inset-1 rounded-full bg-[var(--accent-primary)] opacity-10 blur-sm`}
        />
      </div>
    </div>
  );
}

/** Full-page centered spinner with a message */
export function FullPageSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-fade-in">
      <Spinner size="lg" />
      {message && (
        <p className="text-sm text-[var(--text-tertiary)]">{message}</p>
      )}
    </div>
  );
}
