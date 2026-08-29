"use client";

import { useRef } from "react";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Eye, Mail } from "lucide-react";

import { useCursorInteractions } from "./useCursorInteractions";
import { useCursorPosition } from "./useCursorPosition";
import { useCustomCursorActive } from "./useCustomCursorActive";
import type { CursorIconKey } from "./cursorVariants";

const MARQUEE_COPIES = 4;

// Resolve `--space-md` to a pixel number: GSAP cannot interpolate a CSS
// custom property (`var(--space-md) 0`) and snaps it instead.
function resolveSpaceMd(): number {
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;height:var(--space-md)";
  document.body.appendChild(probe);
  const px = probe.getBoundingClientRect().height;
  probe.remove();
  return px || 16;
}

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorBodyRef = useRef<HTMLDivElement | null>(null);
  const marqueeInnerRef = useRef<HTMLDivElement | null>(null);
  const cursorItemRefs = useRef<HTMLSpanElement[]>([]);
  const cursorLabelRefs = useRef<HTMLSpanElement[]>([]);
  const iconRefs = useRef<Record<CursorIconKey, HTMLSpanElement[]>>({ eye: [], mail: [] });

  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const marqueeTweenRef = useRef<gsap.core.Tween | null>(null);

  useCustomCursorActive();
  useCursorPosition({ cursorRef, cursorBodyRef });

  const variant = useCursorInteractions();

  useGSAP(
    () => {
      const cursorBody = cursorBodyRef.current;
      const marqueeInner = marqueeInnerRef.current;
      if (!cursorBody || !marqueeInner) return;

      const items = cursorItemRefs.current;
      const labels = cursorLabelRefs.current;
      const paddingPx = resolveSpaceMd();

      const stop = () => {
        timelineRef.current?.kill();
        timelineRef.current = null;
        marqueeTweenRef.current?.kill();
        marqueeTweenRef.current = null;
      };

      stop();

      // Toggle the pre-rendered icons imperatively — no React re-render
      // interleaved with the GSAP animation.
      const activeIcon = variant.kind === "label" ? variant.icon : undefined;
      (Object.keys(iconRefs.current) as CursorIconKey[]).forEach((key) => {
        iconRefs.current[key].forEach((node) => {
          node.hidden = key !== activeIcon;
        });
      });

      if (variant.kind === "label") {
        labels.forEach((node) => {
          node.textContent = variant.text;
        });
      }

      if (variant.kind === "label") {
        gsap.set(marqueeInner, { opacity: 0, xPercent: 0, x: -24 });
        gsap.set(items, { opacity: 0, x: -8 });

        const tl = gsap.timeline();
        timelineRef.current = tl;
        tl.to(cursorBody, {
          width: 168,
          paddingTop: paddingPx,
          paddingBottom: paddingPx,
          xPercent: -8,
          backgroundColor: "var(--brand)",
          opacity: 1,
          scale: 1,
          duration: 0.48,
          ease: "expo.out",
        })
          .to(marqueeInner, { opacity: 1, duration: 0.12, ease: "power2.out" }, 0.14)
          .to(items, { opacity: 1, x: 0, duration: 0.24, ease: "power3.out" }, 0.16)
          .add(() => {
            marqueeTweenRef.current = gsap.to(marqueeInner, {
              xPercent: -25,
              duration: 1.8,
              ease: "none",
              repeat: -1,
            });
          });
        return;
      }

      // Non-label variants: collapse the marquee and animate the dot.
      gsap.set(marqueeInner, { opacity: 0, xPercent: 0, x: 0 });
      gsap.set(items, { opacity: 0, x: -8 });
      labels.forEach((node) => {
        node.textContent = "";
      });

      const target =
        variant.kind === "link"
          ? { width: 32, height: 32, opacity: 0.25, backgroundColor: "var(--brand)" }
          : variant.kind === "button"
            ? { width: 10, height: 10, opacity: 1, backgroundColor: "var(--foreground)" }
            : { width: 16, height: 16, opacity: 1, backgroundColor: "var(--brand)" };

      gsap.to(cursorBody, {
        ...target,
        paddingTop: 0,
        paddingBottom: 0,
        xPercent: -50,
        yPercent: -50,
        scale: 1,
        duration: 0.28,
        ease: "power4.out",
        overwrite: "auto",
      });
    },
    { scope: cursorRef, dependencies: [variant] },
  );

  return (
    <div
      ref={cursorRef}
      className="custom-cursor pointer-events-none fixed top-0 left-0 z-50 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-0"
    >
      <div
        ref={cursorBodyRef}
        className="bg-brand absolute top-1/2 left-1/2 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-start overflow-hidden"
        style={{ willChange: "width, height, transform" }}
      >
        <div
          ref={marqueeInnerRef}
          className="type-small relative flex w-max shrink-0 items-center font-medium text-white opacity-0 will-change-transform"
        >
          {Array.from({ length: MARQUEE_COPIES }).map((_, index) => (
            <span
              key={index}
              ref={(element) => {
                if (element) cursorItemRefs.current[index] = element;
              }}
              className="gap-sm pr-sm flex shrink-0 items-center whitespace-nowrap opacity-0"
              aria-hidden={index === 0 ? undefined : "true"}
            >
              <span
                ref={(element) => {
                  if (element) cursorLabelRefs.current[index] = element;
                }}
              />
              <span
                ref={(element) => {
                  if (element) iconRefs.current.eye[index] = element;
                }}
                hidden
              >
                <Eye className="size-md shrink-0" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <span
                ref={(element) => {
                  if (element) iconRefs.current.mail[index] = element;
                }}
                hidden
              >
                <Mail className="size-md shrink-0" strokeWidth={1.75} aria-hidden="true" />
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
