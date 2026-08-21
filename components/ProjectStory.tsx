import Image from "next/image";
import { PortableText, type PortableTextComponents } from "@portabletext/react";

import type { ProjectDetail } from "@/lib/sanity";
import { urlFor } from "@/lib/sanity/image";

type StoryBlocks = NonNullable<ProjectDetail["story"]>;
type StoryBlock = StoryBlocks[number];
type TextStoryBlock = Extract<StoryBlock, { _type: "textBlock" }>;
type ImageStoryBlock = Extract<StoryBlock, { _type: "imageBlock" }>;
type Layout = ImageStoryBlock["layout"];

const portableTextComponents: PortableTextComponents = {
  block: {
    h1: ({ children }) => <h2 className="type-heading font-medium text-foreground">{children}</h2>,
    h2: ({ children }) => <h3 className="type-subheading font-medium text-foreground">{children}</h3>,
    h3: ({ children }) => <h4 className="type-subheading text-foreground">{children}</h4>,
    h4: ({ children }) => <h5 className="type-body font-medium text-foreground">{children}</h5>,
    h5: ({ children }) => <h6 className="type-body font-medium text-foreground">{children}</h6>,
    h6: ({ children }) => <p className="type-small font-medium text-foreground">{children}</p>,
    normal: ({ children }) => <p className="type-body text-foreground">{children}</p>,
    blockquote: ({ children }) => <blockquote className="type-body pl-md border-l-2 border-grey-200 text-grey-300 italic">{children}</blockquote>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-medium">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ value, children }) => (
      <a href={value?.href} className="underline" target="_blank" rel="noreferrer">
        {children}
      </a>
    ),
  },
};

function TextBlockView({ block }: { block: TextStoryBlock }) {
  if (!block.content || block.content.length === 0) return null;
  return (
    <div className="gap-sm flex flex-col">
      <PortableText value={block.content} components={portableTextComponents} />
    </div>
  );
}

const LAYOUT_CONTAINER_CLASS: Record<Layout, string> = {
  full: "w-full",
  inset: "mx-auto w-full max-w-2xl",
  pair: "grid grid-cols-1 gap-sm sm:grid-cols-2",
};

const LAYOUT_ASPECT_CLASS: Record<Layout, string> = {
  full: "aspect-16/9",
  inset: "aspect-4/3",
  pair: "aspect-4/3",
};

const LAYOUT_SIZES: Record<Layout, string> = {
  full: "100vw",
  inset: "(max-width: 1024px) 100vw, 672px",
  pair: "(max-width: 640px) 100vw, 50vw",
};

function StoryImage({ image, layout }: { image: ImageStoryBlock["image"] | ImageStoryBlock["secondImage"]; layout: Layout }) {
  if (!image?.asset) return null;

  const src = urlFor(image).width(1600).height(1000).fit("crop").url();

  return (
    <div className={`relative overflow-hidden ${LAYOUT_ASPECT_CLASS[layout]}`}>
      <Image src={src} alt={image.alt} fill sizes={LAYOUT_SIZES[layout]} className="object-cover" />
    </div>
  );
}

function ImageBlockView({ block }: { block: ImageStoryBlock }) {
  const { layout, caption, image, secondImage } = block;
  const showPair = layout === "pair" && image?.asset && secondImage?.asset;

  if (!image?.asset && !secondImage?.asset) return null;

  return (
    <figure className={LAYOUT_CONTAINER_CLASS[layout]}>
      <StoryImage image={image} layout={layout} />
      {showPair && <StoryImage image={secondImage} layout={layout} />}
      {caption && <figcaption className="type-caption text-grey-300 mt-xs">{caption}</figcaption>}
    </figure>
  );
}

export function ProjectStory({ blocks }: { blocks: StoryBlocks | null | undefined }) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="gap-sm px-md flex flex-col">
      {blocks.map((block) =>
        block._type === "textBlock" ? <TextBlockView key={block._key} block={block} /> : <ImageBlockView key={block._key} block={block} />
      )}
    </div>
  );
}
