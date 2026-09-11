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
    expect(io.unobserved).toContain(target);

    // A second intersection must not re-fire the reveal.
    target.style.opacity = "0.5";
    io.intersect(target);
    expect(target.style.opacity).toBe("0.5");
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

  it("reveals each direct child of a group, later ones after earlier ones", () => {
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

    // Every child ends revealed...
    for (const row of rows) expect(row.style.opacity).toBe("1");

    // ...and the cascade is ordered: each child waits longer than the one
    // before it (exact timing is a token, verified manually).
    const delayOf = (row: HTMLElement) =>
      Number.parseFloat(row.style.transitionDelay);
    expect(delayOf(rows[0])).toBe(0);
    expect(delayOf(rows[1])).toBeGreaterThan(delayOf(rows[0]));
    expect(delayOf(rows[2])).toBeGreaterThan(delayOf(rows[1]));
  });

  it("does not stagger a single-element reveal", () => {
    stubReducedMotion(false);

    render(
      <Reveal>
        <p>lone block</p>
      </Reveal>,
    );

    const target = screen.getByText("lone block").parentElement as HTMLElement;
    observers[0].intersect(target);

    expect(Number.parseFloat(target.style.transitionDelay)).toBe(0);
  });
});
