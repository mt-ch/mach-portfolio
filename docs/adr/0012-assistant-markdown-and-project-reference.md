# Assistant answers render Markdown + an inline Project reference

Issues #174 and #180 rework what a chat answer renders. The bubble used to be a
bare text node with a citation chip row underneath — every retrieved document
got a chip, and About/Experience chips linked uselessly to `/`. That is
replaced by a Markdown body and, when the answer is genuinely about one
Project, a single inline reference card.

## Markdown body — a deliberately tiny element whitelist

`ChatMessageBubble` renders the accumulating answer string through
`react-markdown` on every stream frame (`ChatMarkdownAnswer`, memoized on the
text so it's one parse per actual change). Only these elements are allowed
through, via `allowedElements` + `unwrapDisallowed`:

```
p, strong, em, ul, li
```

Everything else — headings, tables, code blocks, code spans, images, links,
raw HTML — is unwrapped to its plain text. `react-markdown` does not parse raw
HTML without `rehype-raw`, so no extra sanitizer schema is needed to hold the
line. Incomplete syntax mid-stream (`a **bold`) renders literally until the
delimiter closes. The system prompt's Formatting section is written to match
this whitelist exactly (paragraphs, bold, italic, short lists — nothing else).

## The citation chip row is gone

Removed entirely from `ChatMessageBubble`, along with its `AnimatePresence` and
`.map`. About and Experience retrievals now produce **no** client-visible
artifact. `context.ts` no longer builds a `citations` array or a
`citationForMetadata` mapping.

## Project reference — model-asserted, retrieval-validated

When an answer is genuinely about one specific Project, the bubble shows one
inline **Project reference card** below the Markdown body — Variant B stacked
poster (full-width 16:9 cover, then title, one-line summary,
"View the project →"), the whole block linking to `/projects/<slug>`. With no
cover image it degrades to title + summary + link. Entrance is an opacity 0→1
fade on the `citations` event using the existing `citationTransition`
(opacity-only, so reduced motion needs nothing extra).

Which Project (if any) is decided in two steps:

1. **Model asserts** via a `reference_project` tool call (`tool_choice: auto`,
   `max_tokens` unchanged). The system prompt points at it with the "only when
   the answer is really about that one Project" constraint. `streamAnswer`
   accumulates the tool block's `input_json_delta` fragments — never valid JSON
   mid-stream, never surfaced as a text delta — and yields a single
   `{ type: "reference"; slug }` item when the block closes (0 or 1 per answer).

2. **Server validates** against retrieval. `projectReferenceFrom(chunks,
   assertedSlug)` returns a reference only if a retrieved chunk has
   `documentType === "project"` and `metadata.slug === assertedSlug`; otherwise
   `null`. A hallucinated slug, or a real slug retrieval didn't surface,
   renders nothing.

The `citations` SSE event keeps its name and its once-after-the-last-delta
ordering; only the payload changed — from `{ citations: ChatCitation[] }` to
`{ project: ProjectReference | null }`.

## Not here

`MAX_CONTEXT_TOKENS` / `TOP_K` retuning for the larger combined corpus is
spec §6's ticket, not this one.
