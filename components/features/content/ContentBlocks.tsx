import Image from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";

import { dimensionsForRatio, resolveImageBlock } from "@/lib/image/imageLayout";
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
type Layout = ImageBlock["layout"];
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

const LAYOUT_CONTAINER_CLASS: Record<Layout, string> = {
  full: "w-full",
  inset: "mx-auto w-full max-w-2xl",
  pair: "grid grid-cols-1 gap-sm sm:grid-cols-2",
};

type BlockImageValue = NonNullable<ImageBlock["image"] | ImageBlock["secondImage"]>;

// The image field's own `crop` (fractions of the original asset the editor
// kept) applied to the asset's pre-crop pixel dimensions, giving the pixel
// size — and therefore ratio — the image actually renders at.
// `metadata.dimensions.aspectRatio` is the *pre*-crop ratio, so it isn't
// usable here, and the fetched `src` (built via a bare `urlFor(image).url()`)
// is cropped to this same rectangle, so this must be what's passed as the
// intrinsic width/height too or the reserved box won't match the real image.
function postCropDimensions(
  image: BlockImageValue,
): { width: number; height: number } | undefined {
  const dimensions = image.metadata?.dimensions;
  if (!dimensions) return undefined;

  const crop = image.crop;
  const width = crop ? dimensions.width * (1 - crop.left - crop.right) : dimensions.width;
  const height = crop ? dimensions.height * (1 - crop.top - crop.bottom) : dimensions.height;
  if (width <= 0 || height <= 0) return undefined;

  return { width: Math.round(width), height: Math.round(height) };
}

function BlockImage({
  image,
  forcedRatio,
  objectFit,
  applyMaxHeightGuard,
  sizes,
}: {
  image: BlockImageValue;
  forcedRatio: ReturnType<typeof resolveImageBlock>["forcedRatio"];
  objectFit: ReturnType<typeof resolveImageBlock>["objectFit"];
  applyMaxHeightGuard: boolean;
  sizes: string;
}) {
  const lqip = image.metadata?.lqip ?? undefined;

  if (forcedRatio) {
    const { width, height } = dimensionsForRatio(forcedRatio);
    const src = urlFor(image).width(width).height(height).fit("crop").url();

    return (
      <div className="relative aspect-4/3 overflow-hidden">
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

  // No forced width/height/crop: the URL builder call preserves whatever crop
  // rectangle the editor stored in Studio, and the image renders at its
  // natural post-crop ratio.
  const src = urlFor(image).url();
  const dimensions = postCropDimensions(image) ?? { width: 1200, height: 1200 };

  const widthClass = applyMaxHeightGuard
    ? "h-auto w-auto max-h-[85vh] max-w-full"
    : "h-auto w-full";

  return (
    <div className={applyMaxHeightGuard ? "flex justify-center" : undefined}>
      <Image
        src={src}
        alt={image.alt}
        width={dimensions.width}
        height={dimensions.height}
        sizes={sizes}
        placeholder={lqip ? "blur" : "empty"}
        blurDataURL={lqip}
        className={`${widthClass} ${objectFit === "cover" ? "object-cover" : "object-contain"}`}
      />
    </div>
  );
}

function ImageBlockView({ block }: { block: ImageBlock }) {
  const { layout: authoredLayout, caption, image, secondImage } = block;
  const showPair = authoredLayout === "pair" && image?.asset && secondImage?.asset;

  if (!image?.asset && !secondImage?.asset) return null;

  const imageDimensions = image?.asset ? postCropDimensions(image) : undefined;
  const resolved = resolveImageBlock({
    authoredLayout,
    aspectRatio: imageDimensions ? imageDimensions.width / imageDimensions.height : undefined,
  });

  return (
    <figure className={LAYOUT_CONTAINER_CLASS[resolved.layout]}>
      {image?.asset && (
        <BlockImage
          image={image}
          forcedRatio={resolved.forcedRatio}
          objectFit={resolved.objectFit}
          applyMaxHeightGuard={resolved.applyMaxHeightGuard}
          sizes={resolved.sizes}
        />
      )}
      {showPair && secondImage?.asset && (
        <BlockImage
          image={secondImage}
          forcedRatio={resolved.forcedRatio}
          objectFit={resolved.objectFit}
          applyMaxHeightGuard={resolved.applyMaxHeightGuard}
          sizes={resolved.sizes}
        />
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
