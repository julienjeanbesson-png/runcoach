import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "neutral";

export function badgeVariants({ variant = "default" }: { variant?: BadgeVariant } = {}) {
  const variants: Record<BadgeVariant, string> = {
    default: "bg-slate-900 text-white",
    secondary: "bg-slate-100 text-slate-700",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    neutral: "bg-slate-50 text-slate-600"
  };

  return cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium", variants[variant]);
}

export function Badge({
  children,
  className,
  variant
}: {
  children: ReactNode;
  className?: string;
  variant?: BadgeVariant;
}) {
  return <span className={cn(badgeVariants({ variant }), className)}>{children}</span>;
}
