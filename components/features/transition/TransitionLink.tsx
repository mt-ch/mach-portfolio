"use client";

import { forwardRef, type ComponentProps, type MouseEvent } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTransitionRouter } from "next-view-transitions";

import { PAGE_PUSH_DURATION_MS } from "@/lib/motion/constants";
import { useMotionEnvironment } from "@/lib/motion/environment";
import { resolvePageTransitionMode } from "@/lib/motion/resolvePageTransitionMode";

type TransitionLinkProps = ComponentProps<typeof Link>;

// Shared across every TransitionLink: a push is in flight until this
// timestamp. Starting a second `startViewTransition` before the first
// settles makes the browser abort with `InvalidStateError` and can wedge
// the router (a later navigation then silently does nothing or lands
// without resetting scroll). While a push is in flight, further clicks
// navigate instantly instead.
let pushLockedUntil = 0;
const PUSH_LOCK_MS = PAGE_PUSH_DURATION_MS + 150;

/** Test-only: clear the shared in-flight lock between cases. */
export function resetPushLockForTests(): void {
  pushLockedUntil = 0;
}

function hrefToString(href: TransitionLinkProps["href"]): string {
  if (typeof href === "string") return href;
  return `${href.pathname ?? ""}${href.search ?? ""}${href.hash ?? ""}`;
}

function isExternal(href: string): boolean {
  return /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith("//");
}

function opensNewContext(target: string | undefined): boolean {
  return target !== undefined && target !== "" && target !== "_self";
}

function isModifiedClick(event: MouseEvent): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

// Wraps next/link so an in-site forward navigation plays the view-transition
// page push (docs/adr/0014-motion-system.md) instead of a hard route swap.
// The click-eligibility rules are unchanged from ADR 0008: only a plain
// left-click to a different in-site path is intercepted — external URLs,
// new-tab links, modified clicks, and hash/query-only changes fall through
// to normal link behaviour, so the site still works with JavaScript
// disabled. When `resolvePageTransitionMode` returns `"instant"` (no View
// Transitions support, reduce-motion, or a narrow viewport) the click falls
// through to `next/link`'s own client-side navigation — a clean route swap
// with no View Transition snapshot taken.
export const TransitionLink = forwardRef<HTMLAnchorElement, TransitionLinkProps>(function TransitionLink(
  { href, target, onClick, ...props },
  ref,
) {
  const pathname = usePathname();
  const transitionRouter = useTransitionRouter();
  const env = useMotionEnvironment();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (event.defaultPrevented || isModifiedClick(event) || opensNewContext(target)) return;

    const hrefString = hrefToString(href);
    if (isExternal(hrefString)) return;

    const targetPath = hrefString.split(/[?#]/)[0];
    if (targetPath === "" || targetPath === pathname) return;

    // Instant mode, or a push already in flight: leave the event alone so
    // `next/link` runs its own client-side navigation with no View
    // Transition.
    if (resolvePageTransitionMode(env) === "instant" || Date.now() < pushLockedUntil) return;

    event.preventDefault();
    pushLockedUntil = Date.now() + PUSH_LOCK_MS;
    transitionRouter.push(hrefString);
  };

  return <Link ref={ref} href={href} target={target} onClick={handleClick} {...props} />;
});
