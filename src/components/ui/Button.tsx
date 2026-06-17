"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)]
    text-white font-semibold
    shadow-[0_4px_16px_rgba(108,92,231,0.3)]
    hover:shadow-[0_6px_24px_rgba(108,92,231,0.4)]
    hover:brightness-110
    active:brightness-95
  `,
  secondary: `
    bg-[var(--bg-elevated)]
    text-[var(--text-primary)]
    border border-[var(--border-default)]
    hover:bg-[var(--bg-surface)]
    hover:border-[var(--border-strong)]
    active:bg-[var(--bg-tertiary)]
  `,
  ghost: `
    bg-transparent
    text-[var(--text-secondary)]
    hover:bg-[var(--bg-tertiary)]
    hover:text-[var(--text-primary)]
    active:bg-[var(--bg-elevated)]
  `,
  danger: `
    bg-[var(--accent-red)]
    text-white font-semibold
    shadow-[0_4px_16px_rgba(255,107,107,0.2)]
    hover:brightness-110
    active:brightness-90
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-[var(--radius-sm)] gap-1.5",
  md: "px-4 py-2 text-sm rounded-[var(--radius-md)] gap-2",
  lg: "px-6 py-3 text-base rounded-[var(--radius-lg)] gap-2.5",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      children,
      className = "",
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center
          transition-all duration-[var(--transition-fast)]
          cursor-pointer select-none
          disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
