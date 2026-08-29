import { describe, expect, it } from "vitest";

import { cursorVariants } from "./cursorVariants";

function el(attrs: Record<string, string>): HTMLElement {
  const node = document.createElement("div");
  for (const [name, value] of Object.entries(attrs)) {
    node.setAttribute(name, value);
  }
  return node;
}

describe("cursorVariants", () => {
  it("returns the base variant for null", () => {
    expect(cursorVariants(null)).toEqual({ kind: "base" });
  });

  it("returns the base variant for an element with no cursor hints", () => {
    expect(cursorVariants(el({}))).toEqual({ kind: "base" });
  });

  it("maps data-cursor='link' to the link variant", () => {
    expect(cursorVariants(el({ "data-cursor": "link" }))).toEqual({ kind: "link" });
  });

  it("maps data-cursor='button' to the button variant", () => {
    expect(cursorVariants(el({ "data-cursor": "button" }))).toEqual({ kind: "button" });
  });

  it("ignores an unknown data-cursor value", () => {
    expect(cursorVariants(el({ "data-cursor": "sparkle" }))).toEqual({ kind: "base" });
  });

  it("maps data-cursor-text to a label variant carrying the text", () => {
    expect(cursorVariants(el({ "data-cursor-text": "View project" }))).toEqual({
      kind: "label",
      text: "View project",
    });
  });

  it("treats an empty data-cursor-text as a label with empty text", () => {
    expect(cursorVariants(el({ "data-cursor-text": "" }))).toEqual({ kind: "label", text: "" });
  });

  it("carries a known icon key on the label variant", () => {
    expect(cursorVariants(el({ "data-cursor-text": "Read", "data-cursor-icon": "eye" }))).toEqual({
      kind: "label",
      text: "Read",
      icon: "eye",
    });
    expect(cursorVariants(el({ "data-cursor-text": "Email", "data-cursor-icon": "mail" }))).toEqual({
      kind: "label",
      text: "Email",
      icon: "mail",
    });
  });

  it("drops an unknown icon key", () => {
    const result = cursorVariants(el({ "data-cursor-text": "Go", "data-cursor-icon": "rocket" }));
    expect(result).toEqual({ kind: "label", text: "Go" });
  });

  it("prefers the label variant when both data-cursor-text and data-cursor are present", () => {
    expect(cursorVariants(el({ "data-cursor-text": "View", "data-cursor": "link" }))).toEqual({
      kind: "label",
      text: "View",
    });
  });
});
