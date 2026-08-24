import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ChatShell } from "./ChatShell";

function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      media: "(min-width: 640px)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList),
  );
}

describe("ChatShell", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it("shows the toggle button when the drawer is closed, in push mode", () => {
    stubMatchMedia(true);
    render(<ChatShell>content</ChatShell>);

    expect(screen.getByRole("button", { name: "Open chat" })).toBeInTheDocument();
  });

  it("shows the toggle button when the drawer is closed, in overlay mode", () => {
    stubMatchMedia(false);
    render(<ChatShell>content</ChatShell>);

    expect(screen.getByRole("button", { name: "Open chat" })).toBeInTheDocument();
  });

  it("keeps the toggle visible and shifts it left when the drawer opens in push mode (desktop)", async () => {
    stubMatchMedia(true);
    const user = userEvent.setup();
    render(<ChatShell>content</ChatShell>);

    const toggle = screen.getByRole("button", { name: "Open chat" });
    await user.click(toggle);

    expect(toggle).toBeInTheDocument();
    expect(toggle.className).toContain("-translate-x-102");
  });

  it("returns the toggle to its resting position once the drawer closes again in push mode", async () => {
    stubMatchMedia(true);
    const user = userEvent.setup();
    render(<ChatShell>content</ChatShell>);

    const toggle = screen.getByRole("button", { name: "Open chat" });
    await user.click(toggle);
    await user.click(toggle);

    expect(toggle.className).not.toContain("-translate-x-102");
    expect(toggle.className).toContain("translate-x-0");
  });

  it("hides the toggle entirely while the drawer is open in overlay mode (mobile/tablet)", async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<ChatShell>content</ChatShell>);

    await user.click(screen.getByRole("button", { name: "Open chat" }));

    expect(screen.queryByRole("button", { name: "Open chat" })).not.toBeInTheDocument();
  });

  it("brings the toggle back once the drawer has fully closed again in overlay mode", async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    render(<ChatShell>content</ChatShell>);

    await user.click(screen.getByRole("button", { name: "Open chat" }));
    await user.click(screen.getByRole("button", { name: "Close chat panel" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Open chat" })).toBeInTheDocument());
  });
});
