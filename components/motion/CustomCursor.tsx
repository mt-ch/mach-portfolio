"use client";

import { useRef, useState } from "react";

// GSAP
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Icons
import { Eye } from "lucide-react";

const cursorIcons = {
  eye: Eye,
} as const;

type CursorIconName = keyof typeof cursorIcons;

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const cursorBodyRef = useRef<HTMLDivElement | null>(null);
  const marqueeInnerRef = useRef<HTMLDivElement | null>(null);

  const cursorItemRefs = useRef<HTMLSpanElement[]>([]);
  const cursorLabelRefs = useRef<HTMLSpanElement[]>([]);

  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const marqueeTweenRef = useRef<gsap.core.Tween | null>(null);

  const [cursorIcon, setCursorIcon] = useState<string | null>(null);

  const CursorIcon = cursorIcon && cursorIcon in cursorIcons ? cursorIcons[cursorIcon as CursorIconName] : null;

  useGSAP(
    () => {
      const cursor = cursorRef.current;
      const cursorBody = cursorBodyRef.current;

      if (!cursor || !cursorBody) return;

      let isVisible = false;

      const showCursor = () => {
        if (isVisible) return;
        isVisible = true;

        gsap.to(cursor, {
          opacity: 1,
          duration: 0.18,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const hideCursor = () => {
        if (!isVisible) return;
        isVisible = false;

        gsap.to(cursor, {
          opacity: 0,
          duration: 0.18,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const handleMouseMove = (e: MouseEvent) => {
        gsap.set(cursor, {
          x: e.clientX,
          y: e.clientY,
        });

        showCursor();
      };

      const handleMouseDown = () => {
        gsap.to(cursorBody, {
          scale: 0.82,
          duration: 0.1,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      const handleMouseUp = () => {
        gsap.to(cursorBody, {
          scale: 1,
          duration: 0.28,
          ease: "power4.out",
          overwrite: "auto",
        });
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mouseup", handleMouseUp);

      document.documentElement.addEventListener("mouseleave", hideCursor);
      document.documentElement.addEventListener("mouseenter", showCursor);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mouseup", handleMouseUp);

        document.documentElement.removeEventListener("mouseleave", hideCursor);
        document.documentElement.removeEventListener("mouseenter", showCursor);
      };
    },
    { scope: cursorRef }
  );

  useGSAP(
    () => {
      const supportsCustomCursor = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

      if (!supportsCustomCursor) return;

      document.documentElement.classList.add("custom-cursor-active");

      return () => {
        document.documentElement.classList.remove("custom-cursor-active");
      };
    },
    { scope: cursorRef }
  );

  useGSAP(
    () => {
      const cursorBody = cursorBodyRef.current;
      const marqueeInner = marqueeInnerRef.current;

      const cursorItems = cursorItemRefs.current;
      const cursorLabels = cursorLabelRefs.current;

      if (!cursorBody || !marqueeInner || cursorItems.length === 0 || cursorLabels.length === 0) {
        return;
      }

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

      gsap.set(cursorItems, {
        opacity: 0,
        x: -8,
      });

      const stopCurrentAnimations = () => {
        timelineRef.current?.kill();
        timelineRef.current = null;

        marqueeTweenRef.current?.kill();
        marqueeTweenRef.current = null;
      };

      const handleMouseEnter = (e: Event) => {
        const target = e.currentTarget as HTMLElement;

        const text = target.getAttribute("data-cursor-text") ?? "";
        const icon = target.getAttribute("data-cursor-icon") ?? null;

        stopCurrentAnimations();

        setCursorIcon(icon);

        cursorLabels.forEach((item) => {
          item.textContent = text;
        });

        gsap.set(cursorBody, {
          scale: 1,
        });

        gsap.set(marqueeInner, {
          opacity: 0,
          xPercent: 0,
          x: -24,
        });

        gsap.set(cursorItems, {
          opacity: 0,
          x: -8,
        });

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
            0.14
          )
          .to(
            cursorItems,
            {
              opacity: 1,
              x: 0,
              duration: 0.24,
              ease: "power3.out",
            },
            0.16
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

      const handleMouseLeave = () => {
        stopCurrentAnimations();

        setCursorIcon(null);

        gsap.set(marqueeInner, {
          xPercent: 0,
          x: 0,
        });

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
            0
          )
          .to(
            marqueeInner,
            {
              opacity: 0,
              duration: 0.12,
              ease: "power2.out",
            },
            0
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
            0.04
          );
      };

      const handleLinkMouseEnter = () => {
        stopCurrentAnimations();

        setCursorIcon(null);

        gsap.set(marqueeInner, {
          opacity: 0,
          xPercent: 0,
          x: 0,
        });

        gsap.set(cursorItems, {
          opacity: 0,
          x: -8,
        });

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

      const handleLinkMouseLeave = () => {
        stopCurrentAnimations();

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

      const handleButtonMouseEnter = () => {
        stopCurrentAnimations();

        setCursorIcon(null);

        gsap.set(marqueeInner, {
          opacity: 0,
          xPercent: 0,
          x: 0,
        });

        gsap.set(cursorItems, {
          opacity: 0,
          x: -8,
        });

        gsap.to(cursorBody, {
          width: 10,
          height: 10,
          xPercent: -50,
          yPercent: -50,
          opacity: 1,
          scale: 1,
          backgroundColor: "var(--black)",
          duration: 0.24,
          ease: "power4.out",
          overwrite: "auto",
        });
      };

      const handleButtonMouseLeave = () => {
        stopCurrentAnimations();

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

      const projectElements = document.querySelectorAll<HTMLElement>("[data-cursor-text]");

      const linkElements = document.querySelectorAll<HTMLElement>("[data-cursor='link']");

      const buttonElements = document.querySelectorAll<HTMLElement>("[data-cursor='button']");

      projectElements.forEach((element) => {
        element.addEventListener("mouseenter", handleMouseEnter);
        element.addEventListener("mouseleave", handleMouseLeave);
      });

      linkElements.forEach((element) => {
        element.addEventListener("mouseenter", handleLinkMouseEnter);
        element.addEventListener("mouseleave", handleLinkMouseLeave);
      });

      buttonElements.forEach((element) => {
        element.addEventListener("mouseenter", handleButtonMouseEnter);
        element.addEventListener("mouseleave", handleButtonMouseLeave);
      });

      return () => {
        projectElements.forEach((element) => {
          element.removeEventListener("mouseenter", handleMouseEnter);
          element.removeEventListener("mouseleave", handleMouseLeave);
        });

        linkElements.forEach((element) => {
          element.removeEventListener("mouseenter", handleLinkMouseEnter);
          element.removeEventListener("mouseleave", handleLinkMouseLeave);
        });

        buttonElements.forEach((element) => {
          element.removeEventListener("mouseenter", handleButtonMouseEnter);
          element.removeEventListener("mouseleave", handleButtonMouseLeave);
        });

        stopCurrentAnimations();
      };
    },
    { scope: cursorRef }
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
          className="type-mono-small relative flex w-max shrink-0 items-center font-medium text-black uppercase opacity-0 will-change-transform"
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

              {CursorIcon ? <CursorIcon className="size-md shrink-0" strokeWidth={1.5} aria-hidden="true" /> : null}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
