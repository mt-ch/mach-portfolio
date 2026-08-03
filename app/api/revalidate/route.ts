import { isValidSignature, SIGNATURE_HEADER_NAME } from "@sanity/webhook";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

type WebhookPayload = {
  _type: string;
  slug?: { current?: string } | string;
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
  const paths = pathsForPayload(payload);

  for (const path of paths) {
    revalidatePath(path);
  }

  return NextResponse.json({ revalidated: true, paths });
}

function pathsForPayload(payload: WebhookPayload): string[] {
  switch (payload._type) {
    case "project": {
      const paths = ["/", "/projects"];
      const slug = slugFromPayload(payload);
      if (slug) paths.push(`/projects/${slug}`);
      return paths;
    }
    case "experience":
    case "about":
      return ["/"];
    default:
      return [];
  }
}
