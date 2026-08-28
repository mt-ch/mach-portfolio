import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider } from "@/components/features/theme/ThemeProvider";

import { ChatShell } from "./ChatShell";

// ChatShell renders the ThemeToggle, which reads theme from context, so
// every render needs a ThemeProvider around it.
function renderShell() {
  return render(<ChatShell>content</ChatShell>, { wrapper: ThemeProvider });
}

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

  it("shows the toggle button when the drawer is closed", () => {
    stubMatchMedia(true);
    renderShell();

    expect(screen.getByRole("button", { name: "Open chat" })).toBeInTheDocument();
  });

  it("keeps the toggle visible while the drawer is open in push mode (desktop)", async () => {
    stubMatchMedia(true);
    const user = userEvent.setup();
    renderShell();

    const toggle = screen.getByRole("button", { name: "Open chat" });
    await user.click(toggle);

    expect(toggle).toBeInTheDocument();
  });

  it("keeps the toggle usable after opening and closing the drawer in push mode", async () => {
    stubMatchMedia(true);
    const user = userEvent.setup();
    renderShell();

    const toggle = screen.getByRole("button", { name: "Open chat" });
    await user.click(toggle);
    await user.click(toggle);

    expect(toggle).toBeInTheDocument();
    expect(toggle).toBeEnabled();
  });

  it("hides the toggle entirely while the drawer is open in overlay mode (mobile/tablet)", async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Open chat" }));

    expect(screen.queryByRole("button", { name: "Open chat" })).not.toBeInTheDocument();
  });

  it("brings the toggle back once the drawer has fully closed again in overlay mode", async () => {
    stubMatchMedia(false);
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Open chat" }));
    await user.click(screen.getByRole("button", { name: "Close chat panel" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Open chat" })).toBeInTheDocument());
  });

  it("renders the theme toggle alongside the chat toggle", () => {
    stubMedia({ desktop: true, dark: false });
    renderShell();

    expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
  });

  it("defaults the theme toggle to the OS preference when nothing is stored", () => {
    stubMedia({ desktop: true, dark: true });
    renderShell();

    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("clicking the theme toggle switches the label and applies the dark class", async () => {
    stubMedia({ desktop: true, dark: false });
    const user = userEvent.setup();
    renderShell();

    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));

    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists the theme choice so it's honored on the next mount", async () => {
    stubMedia({ desktop: true, dark: false });
    const user = userEvent.setup();
    const { unmount } = renderShell();

    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    unmount();

    renderShell();

    expect(screen.getByRole("button", { name: "Switch to light mode" })).toBeInTheDocument();
  });
});
