import { describe, expect, it } from "vitest";

import { cursorVariants } from "./cursorVariants";

function el(attrs: Record<string, string>): HTMLElement {
  const node = document.createElement("div");
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

describe("cursorVariants", () => {
  it("returns base for null", () => {
    expect(cursorVariants(null)).toEqual({ kind: "base" });
  });

  it("returns base for an element with no data-cursor", () => {
    expect(cursorVariants(el({ href: "#" }))).toEqual({ kind: "base" });
  });

  it("returns base for an unknown data-cursor value", () => {
    expect(cursorVariants(el({ "data-cursor": "sparkle" }))).toEqual({ kind: "base" });
  });

  it("maps data-cursor=link", () => {
    expect(cursorVariants(el({ "data-cursor": "link" }))).toEqual({ kind: "link" });
  });

  it("maps data-cursor=button", () => {
    expect(cursorVariants(el({ "data-cursor": "button" }))).toEqual({ kind: "button" });
  });

  it("reads label text and icon from data-cursor-label / data-cursor-icon", () => {
    expect(
      cursorVariants(el({ "data-cursor": "label", "data-cursor-label": "View Project", "data-cursor-icon": "eye" })),
    ).toEqual({ kind: "label", text: "View Project", icon: "eye" });
  });

  it("accepts the mail icon key", () => {
    expect(
      cursorVariants(el({ "data-cursor": "label", "data-cursor-label": "Copy Email", "data-cursor-icon": "mail" })),
    ).toEqual({ kind: "label", text: "Copy Email", icon: "mail" });
  });

  it("drops an unknown icon key but keeps the label", () => {
    expect(
      cursorVariants(el({ "data-cursor": "label", "data-cursor-label": "Go", "data-cursor-icon": "rocket" })),
    ).toEqual({ kind: "label", text: "Go" });
  });

  it("defaults label text to empty string when data-cursor-label is absent", () => {
    expect(cursorVariants(el({ "data-cursor": "label" }))).toEqual({ kind: "label", text: "" });
  });
});
