import Image from "next/image";
import type { Image as SanityImage } from "sanity";

import { dimensionsForRatio, type RatioToken } from "@/lib/image/imageLayout";
import { urlFor } from "@/lib/sanity/image";
import type { SanityImageAssetMetadata } from "@/lib/sanity/types";

type CoverImageAsset = SanityImage & {
  metadata?: SanityImageAssetMetadata | null;
};

type CoverImageProps = {
  image: CoverImageAsset | null | undefined;
  alt: string;
  /** The target aspect ratio, used to derive the Sanity URL builder dimensions. */
  ratio: RatioToken;
  /** The responsive `sizes` hint for this caller's real rendered width. */
  sizes: string;
  className?: string;
  /** Load-priority hint for the probable LCP image (e.g. the first row's cover). */
  priority?: boolean;
};

function hasImageAsset(image: CoverImageAsset | null | undefined): boolean {
  return Boolean(image?.asset);
}

export function CoverImage({
  image,
  alt,
  ratio,
  sizes,
  className = "h-full w-full object-cover",
  priority = false,
}: CoverImageProps) {
  if (!hasImageAsset(image)) {
    return <div className={`bg-grey-100 ${className}`} />;
  }

  const { width, height } = dimensionsForRatio(ratio);
  const src = urlFor(image!).width(width).height(height).fit("crop").url();
  const lqip = image!.metadata?.lqip;

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      priority={priority}
      {...(lqip ? { placeholder: "blur" as const, blurDataURL: lqip } : {})}
    />
  );
}

export function LogoImage({
  image,
  alt,
}: {
  image: SanityImage | null | undefined;
  alt: string;
}) {
  if (!hasImageAsset(image)) {
    return null;
  }

  const src = urlFor(image!).width(256).height(256).fit("max").url();

  return (
    <Image
      src={src}
      alt={alt}
      width={256}
      height={256}
      className="h-full w-full object-contain"
    />
  );
}
