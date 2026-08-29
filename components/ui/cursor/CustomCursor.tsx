"use client";

import { useRef } from "react";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Eye, Mail } from "lucide-react";

import { useCursorInteractions } from "./useCursorInteractions";
import { useCursorPosition } from "./useCursorPosition";
import { CURSOR_ICON_KEYS, type CursorIconKey, type CursorVariant } from "./cursorVariants";

const MARQUEE_COPIES = 4;

// Render-layer counterpart to `CURSOR_ICON_KEYS`: the lucide component for each
// icon key. Both icons are pre-rendered and toggled imperatively so an icon
// change never triggers a React re-render mid-animation.
const ICON_COMPONENTS: Record<CursorIconKey, typeof Eye> = {
  eye: Eye,
  mail: Mail,
};

// Resolve `--space-md` to a pixel number once: GSAP cannot interpolate a CSS
// custom property (`var(--space-md) 0`) and snaps it instead. Cached because
// it only feeds the label variant's padding and does not change at runtime.
let cachedSpaceMd: number | null = null;
function resolveSpaceMd(): number {
  if (cachedSpaceMd !== null) return cachedSpaceMd;
  const probe = document.createElement("div");
  probe.style.cssText = "position:absolute;visibility:hidden;height:var(--space-md)";
  document.body.appendChild(probe);
  cachedSpaceMd = probe.getBoundingClientRect().height || 16;
  probe.remove();
  return cachedSpaceMd;
}

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorBodyRef = useRef<HTMLDivElement | null>(null);
  const marqueeInnerRef = useRef<HTMLDivElement | null>(null);
  const cursorItemRefs = useRef<HTMLSpanElement[]>([]);
  const cursorLabelRefs = useRef<HTMLSpanElement[]>([]);
  const iconRefs = useRef<Record<CursorIconKey, HTMLSpanElement[]>>(
    CURSOR_ICON_KEYS.reduce(
      (acc, key) => {
        acc[key] = [];
        return acc;
      },
      {} as Record<CursorIconKey, HTMLSpanElement[]>,
    ),
  );

  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const marqueeTweenRef = useRef<gsap.core.Tween | null>(null);
  const prevKindRef = useRef<CursorVariant["kind"]>("base");

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

      const cameFromLabel = prevKindRef.current === "label";
      prevKindRef.current = variant.kind;

      const setIconVisibility = (activeIcon: CursorIconKey | undefined) => {
        CURSOR_ICON_KEYS.forEach((key) => {
          iconRefs.current[key].forEach((node) => {
            node.hidden = key !== activeIcon;
          });
        });
      };

      if (variant.kind === "label") {
        // Toggle the pre-rendered icons imperatively — no React re-render
        // interleaved with the GSAP animation.
        setIconVisibility(variant.icon);
        labels.forEach((node) => {
          node.textContent = variant.text;
        });

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

      // Non-label variants: collapse the marquee (fading it out if we are
      // coming from the label) and animate the dot to its target shape.
      const target =
        variant.kind === "link"
          ? { width: 32, height: 32, opacity: 0.25, backgroundColor: "var(--brand)" }
          : variant.kind === "button"
            ? { width: 10, height: 10, opacity: 1, backgroundColor: "var(--foreground)" }
            : { width: 16, height: 16, opacity: 1, backgroundColor: "var(--brand)" };

      const collapse = {
        ...target,
        paddingTop: 0,
        paddingBottom: 0,
        xPercent: -50,
        yPercent: -50,
        scale: 1,
        ease: "expo.out",
        overwrite: "auto" as const,
      };

      const tl = gsap.timeline({
        onComplete: () => {
          setIconVisibility(undefined);
          gsap.set(marqueeInner, { xPercent: 0, x: 0 });
          labels.forEach((node) => {
            node.textContent = "";
          });
        },
      });
      timelineRef.current = tl;

      if (cameFromLabel) {
        tl.to(items, { opacity: 0, x: -8, duration: 0.14, ease: "power2.out" }, 0)
          .to(marqueeInner, { opacity: 0, duration: 0.12, ease: "power2.out" }, 0)
          .to(cursorBody, { ...collapse, duration: 0.34 }, 0.04);
      } else {
        gsap.set(marqueeInner, { opacity: 0, xPercent: 0, x: 0 });
        gsap.set(items, { opacity: 0, x: -8 });
        tl.to(cursorBody, { ...collapse, duration: 0.28 }, 0);
      }
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
              {CURSOR_ICON_KEYS.map((key) => {
                const Icon = ICON_COMPONENTS[key];
                return (
                  <span
                    key={key}
                    ref={(element) => {
                      if (element) iconRefs.current[key][index] = element;
                    }}
                    hidden
                  >
                    <Icon className="size-md shrink-0" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                );
              })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
