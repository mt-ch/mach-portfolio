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

// Distinguishes the drawer's desktop-breakpoint query from useTheme's
// prefers-color-scheme query, since stubMatchMedia above answers every
// query identically and can't drive them independently.
function stubMedia({ desktop, dark }: { desktop: boolean; dark: boolean }) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation(
      (query: string) =>
        ({
          matches: query.includes("prefers-color-scheme") ? dark : desktop,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        }) as unknown as MediaQueryList,
    ),
  );
}

describe("ChatShell", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
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

  it("renders the theme toggle alongside the chat toggle", () => {
    stubMedia({ desktop: true, dark: false });
    render(<ChatShell>content</ChatShell>);

    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it("defaults the theme toggle to the OS preference when nothing is stored", () => {
    stubMedia({ desktop: true, dark: true });
    render(<ChatShell>content</ChatShell>);

    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("clicking the theme toggle switches the label and applies the dark class", async () => {
    stubMedia({ desktop: true, dark: false });
    const user = userEvent.setup();
    render(<ChatShell>content</ChatShell>);

    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));

    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists the theme choice so it's honored on the next mount", async () => {
    stubMedia({ desktop: true, dark: false });
    const user = userEvent.setup();
    const { unmount } = render(<ChatShell>content</ChatShell>);

    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    unmount();

    render(<ChatShell>content</ChatShell>);

    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
  });

  it("shifts the theme toggle left together with the chat toggle when the drawer opens in push mode", async () => {
    stubMedia({ desktop: true, dark: false });
    const user = userEvent.setup();
    render(<ChatShell>content</ChatShell>);

    const themeToggle = screen.getByRole("button", { name: "Switch to dark mode" });
    await user.click(screen.getByRole("button", { name: "Open chat" }));

    expect(themeToggle.className).toContain("-translate-x-102");
  });
});
