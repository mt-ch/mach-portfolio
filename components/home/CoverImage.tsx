import Image from "next/image";
import type { Image as SanityImage } from "sanity";

import { urlFor } from "@/lib/sanity/image";

type CoverImageProps = {
  image: SanityImage | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
};

function hasImageAsset(image: SanityImage | null | undefined): boolean {
  return Boolean(image?.asset);
}

export function CoverImage({
  image,
  alt,
  className = "h-full w-full object-cover",
  sizes = "(max-width: 768px) 100vw, 33vw",
}: CoverImageProps) {
  if (!hasImageAsset(image)) {
    return <div className={`bg-grey-100 ${className}`} />;
  }

  const src = urlFor(image!).width(1200).height(800).fit("crop").url();

  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={800}
      sizes={sizes}
      className={className}
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
