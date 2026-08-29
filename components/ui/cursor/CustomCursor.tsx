"use client";

import { useRef } from "react";

// GSAP
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Icons
import { Eye, Mail } from "lucide-react";

import type { CursorIconName, CursorVariant } from "./cursorVariants";
import { useCursorInteractions } from "./useCursorInteractions";
import { useCursorPosition } from "./useCursorPosition";

const cursorIcons: Record<CursorIconName, typeof Eye> = {
  eye: Eye,
  mail: Mail,
};

// The custom cursor: owns the refs, the rendered markup, and the GSAP
// timelines that animate the body between variants. Pointer tracking lives
// in `useCursorPosition`, hover detection in `useCursorInteractions`, and
// the variant decision in the pure `cursorVariants` seam. The infinite
// marquee tween stays here — it is visual-only and has no seam value.
//
// This layer is animation-bound presentational glue: verified manually,
// not unit tested (`cursorVariants` carries the tested behaviour).
export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorBodyRef = useRef<HTMLDivElement | null>(null);
  const marqueeInnerRef = useRef<HTMLDivElement | null>(null);

  const cursorItemRefs = useRef<HTMLSpanElement[]>([]);
  const cursorLabelRefs = useRef<HTMLSpanElement[]>([]);

  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const marqueeTweenRef = useRef<gsap.core.Tween | null>(null);

  // The kind the body is currently animated to, so a return to `base` can
  // play the matching exit animation for the shape it is leaving.
  const currentKindRef = useRef<CursorVariant["kind"]>("base");

  const variant = useCursorInteractions();

  const CursorIcon = variant.kind === "label" && variant.icon ? cursorIcons[variant.icon] : null;

  useCursorPosition(cursorRef, cursorBodyRef);

  // Toggle the global flag that hides the native cursor, but only on
  // devices that actually have a fine hover-capable pointer.
  useGSAP(
    () => {
      const supportsCustomCursor = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

      if (!supportsCustomCursor) return;

      document.documentElement.classList.add("custom-cursor-active");

      return () => {
        document.documentElement.classList.remove("custom-cursor-active");
      };
    },
    { scope: cursorRef },
  );

  // Resting-state setup: the body is a small square, the marquee and its
  // items are hidden and nudged left ready to slide in.
  useGSAP(
    () => {
      const cursorBody = cursorBodyRef.current;
      const marqueeInner = marqueeInnerRef.current;

      if (!cursorBody || !marqueeInner) return;

      gsap.set(cursorBody, {
        width: 16,
        height: 16,
        xPercent: -50,
        yPercent: -50,
        scale: 1,
      });

      gsap.set(marqueeInner, {
        opacity: 0,
        xPercent: 0,
        x: 0,
      });

      gsap.set(cursorItemRefs.current, {
        opacity: 0,
        x: -8,
      });
    },
    { scope: cursorRef },
  );

  // Animate the body between variants whenever the hovered variant changes.
  useGSAP(
    () => {
      const cursorBody = cursorBodyRef.current;
      const marqueeInner = marqueeInnerRef.current;

      const cursorItems = cursorItemRefs.current;
      const cursorLabels = cursorLabelRefs.current;

      if (!cursorBody || !marqueeInner || cursorItems.length === 0 || cursorLabels.length === 0) {
        return;
      }

      const previousKind = currentKindRef.current;
      currentKindRef.current = variant.kind;

      if (variant.kind === "base" && previousKind === "base") return;

      const stopCurrentAnimations = () => {
        timelineRef.current?.kill();
        timelineRef.current = null;

        marqueeTweenRef.current?.kill();
        marqueeTweenRef.current = null;
      };

      stopCurrentAnimations();

      const enterLabel = (text: string) => {
        cursorLabels.forEach((item) => {
          item.textContent = text;
        });

        gsap.set(cursorBody, { scale: 1 });
        gsap.set(marqueeInner, { opacity: 0, xPercent: 0, x: -24 });
        gsap.set(cursorItems, { opacity: 0, x: -8 });

        const enterTl = gsap.timeline();
        timelineRef.current = enterTl;

        enterTl
          .to(cursorBody, {
            width: 168,
            padding: "var(--space-md) 0",
            xPercent: -8,
            duration: 0.48,
            ease: "expo.out",
          })
          .to(
            marqueeInner,
            {
              opacity: 1,
              duration: 0.12,
              ease: "power2.out",
            },
            0.14,
          )
          .to(
            cursorItems,
            {
              opacity: 1,
              x: 0,
              duration: 0.24,
              ease: "power3.out",
            },
            0.16,
          )
          .add(() => {
            marqueeTweenRef.current = gsap.to(marqueeInner, {
              xPercent: -25,
              duration: 1.8,
              ease: "none",
              repeat: -1,
              delay: 0,
            });
          });
      };

      const leaveLabel = () => {
        gsap.set(marqueeInner, { xPercent: 0, x: 0 });

        const leaveTl = gsap.timeline({
          onComplete: () => {
            cursorLabels.forEach((item) => {
              item.textContent = "";
            });
          },
        });

        timelineRef.current = leaveTl;

        leaveTl
          .to(
            cursorItems,
            {
              opacity: 0,
              x: -8,
              duration: 0.14,
              ease: "power2.out",
            },
            0,
          )
          .to(
            marqueeInner,
            {
              opacity: 0,
              duration: 0.12,
              ease: "power2.out",
            },
            0,
          )
          .to(
            cursorBody,
            {
              width: 16,
              height: 16,
              padding: "0",
              xPercent: -50,
              duration: 0.34,
              ease: "expo.out",
            },
            0.04,
          );
      };

      const resetMarqueeForSimpleVariant = () => {
        gsap.set(marqueeInner, { opacity: 0, xPercent: 0, x: 0 });
        gsap.set(cursorItems, { opacity: 0, x: -8 });
      };

      const enterLink = () => {
        resetMarqueeForSimpleVariant();
        gsap.to(cursorBody, {
          width: 32,
          height: 32,
          xPercent: -50,
          yPercent: -50,
          opacity: 0.25,
          scale: 1,
          duration: 0.28,
          ease: "power4.out",
          overwrite: "auto",
        });
      };

      const leaveLink = () => {
        gsap.to(cursorBody, {
          width: 16,
          height: 16,
          xPercent: -50,
          yPercent: -50,
          opacity: 1,
          scale: 1,
          duration: 0.26,
          ease: "power4.out",
          overwrite: "auto",
        });
      };

      const enterButton = () => {
        resetMarqueeForSimpleVariant();
        gsap.to(cursorBody, {
          width: 10,
          height: 10,
          xPercent: -50,
          yPercent: -50,
          opacity: 1,
          scale: 1,
          backgroundColor: "var(--foreground)",
          duration: 0.24,
          ease: "power4.out",
          overwrite: "auto",
        });
      };

      const leaveButton = () => {
        gsap.to(cursorBody, {
          width: 16,
          height: 16,
          xPercent: -50,
          yPercent: -50,
          opacity: 1,
          scale: 1,
          backgroundColor: "var(--brand)",
          duration: 0.28,
          ease: "power4.out",
          overwrite: "auto",
        });
      };

      if (variant.kind === "label") {
        enterLabel(variant.text);
        return;
      }
      if (variant.kind === "link") {
        enterLink();
        return;
      }
      if (variant.kind === "button") {
        enterButton();
        return;
      }

      // variant.kind === "base": play the exit for the shape we were in.
      if (previousKind === "label") leaveLabel();
      else if (previousKind === "link") leaveLink();
      else if (previousKind === "button") leaveButton();

      // The marquee tween is spawned from a timeline callback, so it sits
      // outside useGSAP's auto-collected scope — kill it explicitly.
      return stopCurrentAnimations;
    },
    { dependencies: [variant], scope: cursorRef },
  );

  return (
    <div
      ref={cursorRef}
      className="custom-cursor pointer-events-none fixed top-0 left-0 z-50 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-0"
    >
      <div
        ref={cursorBodyRef}
        className="bg-brand absolute top-1/2 left-1/2 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-start overflow-hidden"
        style={{
          willChange: "width, height, transform",
        }}
      >
        <div
          ref={marqueeInnerRef}
          className="type-small relative flex w-max shrink-0 items-center font-medium text-white opacity-0 will-change-transform"
        >
          {Array.from({ length: 4 }).map((_, index) => (
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

              {CursorIcon ? <CursorIcon className="size-md shrink-0" strokeWidth={1.75} aria-hidden="true" /> : null}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
