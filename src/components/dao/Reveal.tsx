"use client";

import { useEffect, useRef } from "react";
import { observeReveal } from "@/lib/reveal";

/**
 * The Text Motion V3 reveal primitive.
 *
 * It registers ONE element with the shared observer and adds `is-in` when it
 * arrives; every family class inside it (.mo-a ... .mo-g, and the retuned
 * .dao-rise / .dao-fade / .dao-side) responds to that one class. So a section
 * is one observation, not one per animated line.
 *
 * It renders a real element of the caller's choosing rather than a wrapper
 * div, because most of the places that need it are already a <section>, a
 * <header> or a <li> - inserting a div would change the layout and, worse,
 * the document outline.
 */
export function Reveal<T extends keyof React.JSX.IntrinsicElements = "div">({
  as,
  className,
  children,
  ...rest
}: {
  as?: T;
  className?: string;
  children?: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "className" | "children">) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observeReveal(el);
  }, []);

  const Tag = (as ?? "div") as React.ElementType;
  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
