// The single inline artifact a chat answer can carry: the one Project an
// answer is genuinely about. Model-asserted via the `reference_project` tool,
// then server-validated against what retrieval actually returned. About and
// Experience retrievals produce no client-visible artifact at all.
export interface ProjectReference {
  slug: string;
  title: string;
  summary: string;
  imageUrl: string | null;
}

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}
