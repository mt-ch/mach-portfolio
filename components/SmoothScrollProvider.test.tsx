import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SmoothScrollProvider } from "./SmoothScrollProvider";

const lenisConstructor = vi.fn();

vi.mock("lenis", () => ({
  default: class {
    constructor(options: unknown) {
      lenisConstructor(options);
    }
    raf() {}
    destroy() {}
  },
}));

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      media: "(prefers-reduced-motion: reduce)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  lenisConstructor.mockClear();
});

describe("SmoothScrollProvider", () => {
  it("renders children without instantiating Lenis when the user prefers reduced motion", async () => {
    stubMatchMedia(true);

    render(
      <SmoothScrollProvider>
        <p>page content</p>
      </SmoothScrollProvider>,
    );

    expect(await screen.findByText("page content")).toBeInTheDocument();
    expect(lenisConstructor).not.toHaveBeenCalled();
  });

  it("instantiates Lenis when the user has no reduced-motion preference", async () => {
    stubMatchMedia(false);

    render(
      <SmoothScrollProvider>
        <p>page content</p>
      </SmoothScrollProvider>,
    );

    expect(screen.getByText("page content")).toBeInTheDocument();
    await waitFor(() => expect(lenisConstructor).toHaveBeenCalled());
  });
});
