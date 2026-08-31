"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";

// The assistant answer is rendered as a deliberately tiny slice of Markdown.
// Only these elements are allowed through; everything else (headings, tables,
// code, images, links, raw HTML) is unwrapped to its plain text via
// `unwrapDisallowed`. react-markdown does not parse raw HTML unless a plugin
// like rehype-raw is added, so no extra sanitizer schema is needed to enforce
// the whitelist.
const ALLOWED_ELEMENTS = ["p", "strong", "em", "ul", "li"];

interface ChatMarkdownAnswerProps {
  text: string;
}

// Memoized on `text`: the answer streams in token by token, and each frame
// re-parses the whole accumulated string through the remark/rehype pipeline.
// memo keeps that to one parse per actual text change.
export const ChatMarkdownAnswer = memo(function ChatMarkdownAnswer({
  text,
}: ChatMarkdownAnswerProps) {
  return (
    <div className="chat-markdown type-small text-black dark:text-white">
      <ReactMarkdown allowedElements={ALLOWED_ELEMENTS} unwrapDisallowed>
        {text}
      </ReactMarkdown>
    </div>
  );
});
