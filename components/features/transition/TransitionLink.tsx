"use client";

import { forwardRef, type ComponentProps, type MouseEvent } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { usePageTransition } from "./PageTransitionProvider";

type TransitionLinkProps = ComponentProps<typeof Link>;

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

// Wraps next/link so that an in-site forward navigation plays the
// full-motion page transition instead of swapping the route instantly.
// Anything that isn't a plain left-click to a different in-site path —
// external URLs, new-tab links, modified clicks, and hash/query-only
// changes — falls through to normal link behaviour untouched, so the
// site still works with JavaScript disabled.
export const TransitionLink = forwardRef<HTMLAnchorElement, TransitionLinkProps>(function TransitionLink(
  { href, target, onClick, ...props },
  ref,
) {
  const pathname = usePathname();
  const transition = usePageTransition();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (!transition || event.defaultPrevented || isModifiedClick(event) || opensNewContext(target)) return;

    const hrefString = hrefToString(href);
    if (isExternal(hrefString)) return;

    const targetPath = hrefString.split(/[?#]/)[0];
    if (targetPath === "" || targetPath === pathname) return;

    event.preventDefault();
    transition.startTransition(hrefString);
  };

  return <Link ref={ref} href={href} target={target} onClick={handleClick} {...props} />;
});
