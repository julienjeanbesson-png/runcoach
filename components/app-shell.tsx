"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CalendarDays, Clock3, Footprints, Home, Settings2 } from "lucide-react";
import { APP_NAME, navigationItems } from "@/data/constants";
import { cn } from "@/lib/utils/cn";

const iconByPath: Record<string, typeof Home> = {
  "/dashboard": Home,
  "/plan": CalendarDays,
  "/history": Clock3,
  "/settings": Settings2
};

export function AppShell({
  children,
  showNavigation = true
}: {
  children: ReactNode;
  showNavigation?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-24 pt-4 sm:px-6 lg:px-8">
      <header className="sticky top-3 z-20 mb-4 rounded-3xl border border-white/70 bg-white/85 px-4 py-3 shadow-soft backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-soft">
              <Footprints className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{APP_NAME}</p>
              <p className="text-xs text-slate-500">Personal running coach</p>
            </div>
          </Link>
          <Link href="/onboarding" className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
            Edit profile
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <div className="pb-4 pt-6 text-center text-[11px] font-medium uppercase tracking-[0.32em] text-slate-400">
        RunCoach MVP
      </div>

      {showNavigation ? (
        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-xl">
          <div className="mx-auto grid max-w-5xl grid-cols-4 gap-2">
            {navigationItems.map((item) => {
              const Icon = iconByPath[item.href] ?? CalendarDays;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-medium transition",
                    active ? "bg-slate-950 text-white shadow-soft" : "bg-slate-100 text-slate-600"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
