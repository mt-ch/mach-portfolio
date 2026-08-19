import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "@/sanity/env";

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  perspective: "published",
});

// Bypasses the CDN (which can lag ~60s behind a publish) for the reindex
// webhook's by-id refetches, where indexing stale content would defeat the
// point of refetching instead of trusting the webhook payload.
export const freshClient = client.withConfig({ useCdn: false });
