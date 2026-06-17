"use client";

import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  glow?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingStyles = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

export default function Card({
  children,
  hover = true,
  glow = false,
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`
        glass rounded-[var(--radius-lg)]
        ${paddingStyles[padding]}
        ${
          hover
            ? "transition-all duration-[var(--transition-base)] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 cursor-pointer"
            : ""
        }
        ${glow ? "animate-pulse-glow" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}