import Image from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";

import {
  CONTENT_BLOCK_RATIO,
  CONTENT_BLOCK_SIZES,
  dimensionsForRatio,
} from "@/lib/image/imageLayout";
import type { ProjectDetail } from "@/lib/sanity";
import { urlFor } from "@/lib/sanity/image";

// The shared Content Block renderer: Text Block + Image Block rendering, layout
// handling, empty-block filtering, and inter-block spacing. Project Story and
// the homepage "How I work" section are the current callers; any future Content
// Block array renders through this same path. The block shape is derived from the
// generated Project `story` type since that is the only generated Content Block
// array and carries the image-asset detail the renderer needs.
type ContentBlockList = NonNullable<ProjectDetail["story"]>;
type ContentBlockItem = ContentBlockList[number];
type TextBlock = Extract<ContentBlockItem, { _type: "textBlock" }>;
type ImageBlock = Extract<ContentBlockItem, { _type: "imageBlock" }>;
type TextLayout = NonNullable<TextBlock["layout"]>;

const portableTextComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => (
      <h2 className="type-heading text-foreground font-medium">{children}</h2>
    ),
    h2: ({ children }) => (
      <h3 className="type-subheading text-foreground font-medium">
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="type-subheading text-foreground">{children}</h4>
    ),
    h4: ({ children }) => (
      <h5 className="type-body text-foreground font-medium">{children}</h5>
    ),
    h5: ({ children }) => (
      <h6 className="type-body text-foreground font-medium">{children}</h6>
    ),
    h6: ({ children }) => (
      <p className="type-small text-foreground font-medium">{children}</p>
    ),
    normal: ({ children }) => (
      <p className="type-body text-foreground">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="type-body pl-md border-grey-200 text-grey-300 border-l-2 italic">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => (
      <strong className="font-medium">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ value, children }) => (
      <a
        href={value?.href}
        className="underline"
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    ),
  },
};

const TEXT_CONTAINER_CLASS: Record<TextLayout, string> = {
  "one-column": "flex flex-col gap-sm px-md lg:px-0",
  "two-column-split": "grid grid-cols-1 gap-sm sm:grid-cols-2 px-md lg:px-0",
  "two-column-left": "grid grid-cols-1 gap-sm sm:grid-cols-2 px-md lg:px-0",
  "two-column-right": "grid grid-cols-1 gap-sm sm:grid-cols-2 px-md lg:px-0",
};

function TextBlockView({ block }: { block: TextBlock }) {
  if (!block.content || block.content.length === 0) return null;

  const layout: TextLayout = block.layout ?? "one-column";
  const heading = block.heading ? (
    <h2 className="type-subheading text-foreground font-medium">
      {block.heading}
    </h2>
  ) : null;
  const body = (
    <div className="gap-sm type-body text-foreground flex flex-col font-normal">
      <PortableText value={block.content} components={portableTextComponents} />
    </div>
  );

  if (layout === "two-column-split") {
    return (
      <div className={TEXT_CONTAINER_CLASS[layout]}>
        <div className="sm:col-start-1">{heading}</div>
        <div className="sm:col-start-2">{body}</div>
      </div>
    );
  }

  if (layout === "two-column-left" || layout === "two-column-right") {
    const placement =
      layout === "two-column-left" ? "sm:col-start-1" : "sm:col-start-2";
    return (
      <div className={TEXT_CONTAINER_CLASS[layout]}>
        <div className={`gap-md flex flex-col ${placement}`}>
          {heading}
          {body}
        </div>
      </div>
    );
  }

  return (
    <div className={TEXT_CONTAINER_CLASS[layout]}>
      {heading}
      {body}
    </div>
  );
}

type BlockImageValue = NonNullable<
  ImageBlock["image"] | ImageBlock["secondImage"]
>;

// Every Story Image Block crops to the same fixed `CONTENT_BLOCK_RATIO`
// (`object-cover`) at every breakpoint — a single image (`full`), or one
// panel of a `pair`. The class list controls whether the ratio and the
// max-height guard land here or on a shared wrapper — see `ImageBlockView`.
function ForcedRatioImage({
  image,
  sizes,
  className,
}: {
  image: BlockImageValue;
  sizes: string;
  className: string;
}) {
  const lqip = image.metadata?.lqip ?? undefined;
  const { width, height } = dimensionsForRatio(CONTENT_BLOCK_RATIO);
  const src = urlFor(image).width(width).height(height).fit("crop").url();

  return (
    <div className={className}>
      <Image
        src={src}
        alt={image.alt}
        fill
        sizes={sizes}
        placeholder={lqip ? "blur" : "empty"}
        blurDataURL={lqip}
        className="object-cover"
      />
    </div>
  );
}

function ImageBlockView({ block }: { block: ImageBlock }) {
  const { layout: authoredLayout, caption, image, secondImage } = block;

  if (!image?.asset && !secondImage?.asset) return null;

  // Only a genuine `pair` block with both assets renders as a pair —
  // anything else (a lone image, or a `layout` value from before `inset` was
  // removed) safely falls back to the full-bleed single-image treatment
  // rather than disappearing.
  const isPair =
    authoredLayout === "pair" && !!image?.asset && !!secondImage?.asset;
  const sizes = isPair ? CONTENT_BLOCK_SIZES.pair : CONTENT_BLOCK_SIZES.full;

  return (
    <figure className="w-full">
      {!isPair && image?.asset && (
        <ForcedRatioImage
          image={image}
          sizes={sizes}
          className="relative w-full aspect-3/2 max-h-[var(--layout-max-bleed-height)] overflow-hidden"
        />
      )}
      {isPair && image?.asset && secondImage?.asset && (
        // The frame — not each panel — carries the ratio and the guard at
        // `sm:` and up, so the *entire* two-image row matches a `full`
        // block's shape and height instead of each half-width panel getting
        // its own (much shorter) 3:2. Below `sm:` the panels stack, so each
        // one gets its own ratio/guard back, same as a standalone `full`.
        <div className="flex w-full flex-col gap-sm overflow-hidden sm:flex-row sm:aspect-3/2 sm:max-h-[var(--layout-max-bleed-height)]">
          <ForcedRatioImage
            image={image}
            sizes={sizes}
            className="relative aspect-3/2 max-h-[var(--layout-max-bleed-height)] overflow-hidden sm:aspect-auto sm:max-h-none sm:flex-1"
          />
          <ForcedRatioImage
            image={secondImage}
            sizes={sizes}
            className="relative aspect-3/2 max-h-[var(--layout-max-bleed-height)] overflow-hidden sm:aspect-auto sm:max-h-none sm:flex-1"
          />
        </div>
      )}
      {caption && (
        <figcaption className="type-caption text-grey-300 mt-xs">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

function hasRenderableContent(block: ContentBlockItem): boolean {
  if (block._type === "textBlock")
    return !!block.content && block.content.length > 0;
  return !!(block.image?.asset || block.secondImage?.asset);
}

// Whether a Content Block array would render anything. Callers that wrap
// ContentBlocks in their own chrome (e.g. HowIWorkSection inside HomeSection)
// use this to omit that chrome for an empty or absent array.
export function hasRenderableBlocks(
  blocks: ContentBlockList | null | undefined,
): boolean {
  return !!blocks?.some(hasRenderableContent);
}

function gapClassBetween(
  previous: ContentBlockItem["_type"],
  current: ContentBlockItem["_type"],
): string {
  return previous === "textBlock" || current === "textBlock"
    ? "mt-3xl"
    : "mt-sm";
}

export function ContentBlocks({
  blocks,
}: {
  blocks: ContentBlockList | null | undefined;
}) {
  const renderableBlocks = blocks?.filter(hasRenderableContent) ?? [];
  if (renderableBlocks.length === 0) return null;

  return (
    <div className="flex flex-col">
      {renderableBlocks.map((block, index) => {
        const previous = renderableBlocks[index - 1];
        const gapClass = previous
          ? gapClassBetween(previous._type, block._type)
          : "";
        return (
          <div key={block._key} className={gapClass}>
            {block._type === "textBlock" ? (
              <TextBlockView block={block} />
            ) : (
              <ImageBlockView block={block} />
            )}
          </div>
        );
      })}
    </div>
  );
}
