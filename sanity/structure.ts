import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("About")
        .id("about")
        .child(S.document().schemaType("about").documentId("about")),
      S.divider(),
      S.documentTypeListItem("project").title("Projects"),
      S.documentTypeListItem("experience").title("Experience"),
      S.divider(),
      S.listItem()
        .title("Assistant")
        .id("assistant")
        .child(
          S.list()
            .title("Assistant")
            .items([
              S.documentTypeListItem("knowledgeBaseEntry").title(
                "Knowledge Base Entries",
              ),
            ]),
        ),
      ...S.documentTypeListItems().filter(
        (item) =>
          !["about", "project", "experience", "knowledgeBaseEntry"].includes(
            item.getId() ?? "",
          ),
      ),
    ]);
