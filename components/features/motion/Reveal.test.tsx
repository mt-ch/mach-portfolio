import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// A controllable IntersectionObserver stub: capture the callback and let a
// test drive intersections, and record observe/unobserve targets.
type IOCallback = (
  entries: Array<{ target: Element; isIntersecting: boolean }>,
  observer: { unobserve: (el: Element) => void },
) => void;

const observers: FakeIntersectionObserver[] = [];

class FakeIntersectionObserver {
  observed = new Set<Element>();
  unobserved: Element[] = [];
  private callback: IOCallback;

  constructor(callback: IOCallback) {
    this.callback = callback;
    observers.push(this);
  }

  observe(el: Element) {
    this.observed.add(el);
  }
  unobserve(el: Element) {
    this.observed.delete(el);
    this.unobserved.push(el);
  }
  disconnect() {
    this.observed.clear();
  }

  intersect(el: Element) {
    // A real observer never delivers an entry for an element it is no longer
    // observing — which is how the "reveal once" guarantee holds.
    if (!this.observed.has(el)) return;
    this.callback([{ target: el, isIntersecting: true }], this);
  }
}

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("reduced-motion") ? matches : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

import { Reveal } from "./Reveal";

beforeEach(() => {
  observers.length = 0;
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Reveal", () => {
  it("ends revealed once its element intersects, and is not re-animated on a second intersection", () => {
    stubReducedMotion(false);

    render(
      <Reveal>
        <p>section body</p>
      </Reveal>,
    );

    const target = screen.getByText("section body").parentElement as HTMLElement;
    const io = observers[0];

    // Hidden before it scrolls into view.
    expect(target.style.opacity).toBe("0");

    io.intersect(target);
    expect(target.style.opacity).toBe("1");
    expect(target.style.transform).toBe("translateY(0)");
    expect(io.unobserved).toContain(target);

    // A second intersection must not reset it to hidden or re-fire.
    target.style.transitionDelay = "";
    io.intersect(target);
    expect(target.style.opacity).toBe("1");
    expect(target.style.transitionDelay).toBe("");
  });

  it("leaves content present with no hidden state under reduced motion", () => {
    stubReducedMotion(true);

    render(
      <Reveal>
        <p>present immediately</p>
      </Reveal>,
    );

    const target = screen.getByText("present immediately")
      .parentElement as HTMLElement;
    expect(target.style.opacity).toBe("");
    expect(observers).toHaveLength(0);
  });

  it("cascades direct children with a per-child stagger delay when asked", () => {
    stubReducedMotion(false);

    render(
      <Reveal stagger>
        <p>row one</p>
        <p>row two</p>
        <p>row three</p>
      </Reveal>,
    );

    const rows = ["row one", "row two", "row three"].map(
      (t) => screen.getByText(t) as HTMLElement,
    );
    const io = observers[0];

    rows.forEach((row) => io.intersect(row));

    expect(rows[0].style.transitionDelay).toBe("0ms");
    expect(rows[1].style.transitionDelay).toBe("80ms");
    expect(rows[2].style.transitionDelay).toBe("160ms");
  });
});
