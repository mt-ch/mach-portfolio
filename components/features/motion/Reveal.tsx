"use client";

import type { ElementType, ReactNode } from "react";

import { useSectionReveal } from "@/lib/motion/useSectionReveal";

/**
 * Client boundary for reveal-on-scroll (#226). Wrap a below-the-fold section
 * so it fades and rises into view once as it is scrolled to. `stagger` cascades
 * the wrapper's direct children (experience rows, project cards, the
 * other-projects list); without it the wrapper reveals as one block.
 *
 * Renders a single element (`as`, default `div`) so it can stand in for the
 * container it replaces — e.g. `as="tbody"` for the experience table, or take
 * the grid classes for the other-projects list. Carries no reveal markup or
 * classes of its own; the animation is driven imperatively from inline style.
 */
export function Reveal({
  as: Tag = "div",
  stagger = false,
  className,
  children,
}: {
  as?: ElementType;
  stagger?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useSectionReveal({ stagger });

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}
