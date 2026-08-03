import { client } from "./client";
import { aboutQuery } from "./queries";
import type { About } from "./types";

export async function getAbout(): Promise<About | null> {
  return client.fetch(aboutQuery);
}
