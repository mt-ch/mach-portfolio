import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Image as SanityImage } from "sanity";

import { dimensionsForRatio } from "@/lib/image/imageLayout";
import { urlFor } from "@/lib/sanity/image";
import type { SanityImageAssetMetadata } from "@/lib/sanity/types";

import { CoverImage } from "./CoverImage";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    placeholder,
    blurDataURL,
  }: {
    src: string;
    alt: string;
    placeholder?: string;
    blurDataURL?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      data-placeholder={placeholder}
      data-blur-data-url={blurDataURL}
    />
  ),
}));

type CoverImageAsset = SanityImage & {
  metadata?: SanityImageAssetMetadata | null;
};

function image(
  metadata: SanityImageAssetMetadata | null = null,
): CoverImageAsset {
  return {
    _type: "image",
    asset: {
      _type: "reference",
      _ref: "image-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-2000x3000-jpg",
    },
    metadata,
  } as CoverImageAsset;
}

describe("CoverImage", () => {
  it("renders the grey placeholder div when the asset is absent", () => {
    const { container } = render(
      <CoverImage image={null} alt="" ratio="3:2" sizes="100vw" />,
    );

    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(container.firstChild).toHaveClass("bg-grey-100");
  });

  it("requests Sanity URL builder dimensions derived from the ratio prop", () => {
    const asset = image();
    const { width, height } = dimensionsForRatio("4:3");
    const expectedSrc = urlFor(asset).width(width).height(height).fit("crop").url();

    const { container } = render(
      <CoverImage image={asset} alt="" ratio="4:3" sizes="100vw" />,
    );

    expect(container.querySelector("img")).toHaveAttribute("src", expectedSrc);
  });

  it("renders without a blur placeholder when lqip metadata is absent", () => {
    const { container } = render(
      <CoverImage image={image(null)} alt="" ratio="3:2" sizes="100vw" />,
    );

    expect(container.querySelector("img")).not.toHaveAttribute(
      "data-placeholder",
      "blur",
    );
  });

  it("renders a blur-up placeholder from lqip metadata when present", () => {
    const lqip = "data:image/png;base64,tinyplaceholder";
    const { container } = render(
      <CoverImage
        image={image({ lqip, dimensions: null })}
        alt=""
        ratio="3:2"
        sizes="100vw"
      />,
    );

    const img = container.querySelector("img");
    expect(img).toHaveAttribute("data-placeholder", "blur");
    expect(img).toHaveAttribute("data-blur-data-url", lqip);
  });
});
