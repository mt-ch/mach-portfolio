import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

type WebhookPayload = {
  _type: string;
  slug?: { current?: string } | string;
};

type RevalidationTarget = {
  path: string;
  type?: "page" | "layout";
};

function slugFromPayload(payload: WebhookPayload): string | undefined {
  if (!payload.slug) return undefined;
  return typeof payload.slug === "string" ? payload.slug : payload.slug.current;
}

export async function POST(request: Request) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json(
      { message: "Revalidation secret is not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get(SIGNATURE_HEADER_NAME);
  const body = await request.text();

  if (!signature || !(await isValidSignature(body, signature, secret))) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body) as WebhookPayload;
  const targets = targetsForPayload(payload);

  for (const target of targets) {
    if (target.type) {
      revalidatePath(target.path, target.type);
    } else {
      revalidatePath(target.path);
    }
  }

  return NextResponse.json({
    revalidated: true,
    paths: targets.map((target) => target.path),
  });
}

function targetsForPayload(payload: WebhookPayload): RevalidationTarget[] {
  switch (payload._type) {
    case "project": {
      const targets: RevalidationTarget[] = [
        { path: "/" },
        { path: "/projects" },
        { path: "/sitemap.xml" },
      ];
      const slug = slugFromPayload(payload);
      if (slug) targets.push({ path: `/projects/${slug}` });
      return targets;
    }
    case "experience":
      return [{ path: "/" }];
    case "about":
      // The about doc carries Site SEO Defaults, which feed every project
      // page's metadata as well as the homepage's dated sitemap entry, so an
      // about edit must refresh the homepage, all project pages, and the
      // sitemap.
      return [
        { path: "/" },
        { path: "/projects/[slug]", type: "page" },
        { path: "/sitemap.xml" },
      ];
    default:
      return [];
  }
}
