import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { About, ProjectListItem } from "@/lib/sanity";

import { ReframeHome } from "./ReframeHome";
import { OUTER_TIMEOUT_MS } from "./useReframe";

function makeStreamResponse() {
  let controllerRef!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
    },
  });
  const encoder = new TextEncoder();

  return {
    response: new Response(stream, {
      status: 200,
      headers: { "content-type": "text/event-stream" },
    }),
    push(event: string, data: unknown) {
      controllerRef.enqueue(
        encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
      );
    },
    close() {
      controllerRef.close();
    },
  };
}

const about: About = {
  _id: "about",
  name: "Matt Chan",
  headline: "Senior frontend engineer",
  bio: null,
  resumeUrl: null,
  email: "matt@example.com",
  socialLinks: null,
};

function makeProject(overrides: Partial<ProjectListItem>): ProjectListItem {
  return {
    _id: overrides.title ?? "project",
    title: "Untitled",
    slug: { _type: "slug", current: "untitled" },
    summary: "A project",
    coverImage: null,
    techStack: null,
    skills: null,
    impact: null,
    role: null,
    links: null,
    featured: true,
    order: 0,
    dateCompleted: null,
    ...overrides,
  };
}

const projects: ProjectListItem[] = [
  makeProject({
    title: "Collab Canvas",
    slug: { _type: "slug", current: "collab-canvas" },
    summary: "Default collab canvas summary.",
  }),
  makeProject({
    title: "Design System",
    slug: { _type: "slug", current: "design-system" },
    summary: "Default design system summary.",
  }),
];

describe("ReframeHome", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders default About and Featured Projects content ungated, even while the overlay is open", () => {
    render(<ReframeHome about={about} projects={projects} />);

    expect(screen.getByText("Matt Chan")).toBeInTheDocument();
    expect(screen.getByText("Senior frontend engineer")).toBeInTheDocument();
    expect(screen.getByText("Collab Canvas")).toBeInTheDocument();
    expect(screen.getByText("Default collab canvas summary.")).toBeInTheDocument();
    expect(screen.getByText("Design System")).toBeInTheDocument();
  });

  it("dismisses the overlay via Skip without submitting, leaving default content unchanged", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<ReframeHome about={about} projects={projects} />);

    await user.click(
      screen.getByRole("button", { name: /skip — show me the default page/i }),
    );

    expect(
      screen.queryByRole("button", { name: /^go$/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Collab Canvas")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("closes the overlay and shows a tailoring pill on submit, with the aria-live status set", async () => {
    const user = userEvent.setup();
    const { response } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    render(<ReframeHome about={about} projects={projects} />);

    await user.type(
      screen.getByLabelText(/what are you looking for/i),
      "distributed systems",
    );
    await user.click(screen.getByRole("button", { name: /^go$/i }));

    expect(
      screen.queryByRole("button", { name: /^go$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/Tailoring for.*distributed systems/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tailoring this page to your request."),
    ).toBeInTheDocument();
  });

  it("reorders and highlights matching cards on selection, and patches copy in place with the pill going static", async () => {
    const user = userEvent.setup();
    const { response, push, close } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    render(<ReframeHome about={about} projects={projects} />);

    await user.type(
      screen.getByLabelText(/what are you looking for/i),
      "systems work",
    );
    await user.click(screen.getByRole("button", { name: /^go$/i }));

    act(() => {
      push("selection", {
        selected: [
          { slug: "design-system", match_reason: "matches" },
          { slug: "collab-canvas", match_reason: "also matches" },
        ],
      });
    });

    await waitFor(() =>
      expect(screen.getAllByText("Matching…")).toHaveLength(2),
    );

    const cardTitles = screen
      .getAllByRole("heading", { level: 3 })
      .map((el) => el.textContent);
    expect(cardTitles).toEqual(["Design System", "Collab Canvas"]);

    act(() => {
      push("copy", {
        hero: { headline: "Built for systems work", subheadline: "sub" },
        projects: [
          { slug: "design-system", blurb: "Tailored design system blurb." },
          { slug: "collab-canvas", blurb: "Tailored collab canvas blurb." },
        ],
        about: { emphasis: "Tailored emphasis text." },
      });
      close();
    });

    await waitFor(() =>
      expect(screen.getByText("Built for systems work")).toBeInTheDocument(),
    );
    expect(screen.getByText("Tailored emphasis text.")).toBeInTheDocument();
    expect(
      screen.getByText("Tailored design system blurb."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tailored collab canvas blurb."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Matching…")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Tailored for.*systems work/),
    ).toBeInTheDocument();
    expect(
      screen.getByText("View updated for: systems work"),
    ).toBeInTheDocument();
  });

  it("reopens the overlay and resets to input state via Try a different intent", async () => {
    const user = userEvent.setup();
    const { response, push, close } = makeStreamResponse();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    render(<ReframeHome about={about} projects={projects} />);

    await user.type(
      screen.getByLabelText(/what are you looking for/i),
      "systems work",
    );
    await user.click(screen.getByRole("button", { name: /^go$/i }));

    act(() => {
      push("selection", {
        selected: [{ slug: "collab-canvas", match_reason: "matches" }],
      });
      push("copy", {
        hero: { headline: "Built for systems work", subheadline: "sub" },
        projects: [
          { slug: "collab-canvas", blurb: "Tailored collab canvas blurb." },
        ],
        about: { emphasis: "Tailored emphasis text." },
      });
      close();
    });

    await waitFor(() =>
      expect(screen.getByText("Built for systems work")).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole("button", { name: /try a different intent/i }),
    );

    expect(
      screen.getByRole("button", { name: /^go$/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Senior frontend engineer")).toBeInTheDocument();
    expect(
      screen.queryByText("Built for systems work"),
    ).not.toBeInTheDocument();
  });

  it("on fallback, the pill disappears and content reverts to exactly the default state with no error", async () => {
    vi.useFakeTimers();
    const { response } = makeStreamResponse(); // never resolves
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    render(<ReframeHome about={about} projects={projects} />);

    fireEvent.change(screen.getByLabelText(/what are you looking for/i), {
      target: { value: "systems work" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^go$/i }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(OUTER_TIMEOUT_MS + 100);
    });

    expect(
      screen.queryByText(/Tailoring for/),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Tailored for/)).not.toBeInTheDocument();
    expect(screen.getByText("Senior frontend engineer")).toBeInTheDocument();
    const cardTitles = screen
      .getAllByRole("heading", { level: 3 })
      .map((el) => el.textContent);
    expect(cardTitles).toEqual(["Collab Canvas", "Design System"]);

    vi.useRealTimers();
  });
});
