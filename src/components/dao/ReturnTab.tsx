"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/i18n/locales";
import { localeHref } from "@/i18n/locales";
import { cn } from "@/lib/cn";

/**
 * v7 contract #1 - global contextual return control. A printed paper tab,
 * slightly rotated, pinned top-left beside the mark; hover straightens and
 * lifts 1px. Ground-aware inversion (paper tab on ink, ink tab on paper,
 * cream tab on blue/green). History-aware: if this page load has seen an
 * earlier internal route, the tab uses history.back() (restoring archive
 * scroll/filter for free); otherwise it navigates to the explicit fallback.
 * The user is never trapped. Hidden on mobile (≤720, CSS §11) - the brand
 * mark, the burger and the browser back gesture carry navigation there.
 */
let routeDepthThisLoad = 0;

export function ReturnTab({
  locale,
  label,
  fallback,
  ground = "dark",
}: {
  locale: Locale;
  label: string;
  fallback: string;
  ground?: "dark" | "light";
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    routeDepthThisLoad += 1;
  }, [pathname]);

  const onClick = () => {
    if (routeDepthThisLoad > 1) {
      router.back();
    } else {
      router.push(localeHref(locale, fallback));
    }
  };

  return (
    <button
      type="button"
      className={cn("dao-returntab", ground === "light" && "dao-returntab--ink")}
      onClick={onClick}
      aria-label={label}
    >
      <span aria-hidden="true" style={{ fontFamily: "sans-serif" }}>
        ←
      </span>
      <span className="dao-returntab__label">{label}</span>
    </button>
  );
}
