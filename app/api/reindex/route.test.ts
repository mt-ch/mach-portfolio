import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  reindexChunksMock,
  getAboutFreshMock,
  getExperienceEntryByIdMock,
  getProjectForIndexByIdMock,
  getKnowledgeEntryByIdMock,
} = vi.hoisted(() => ({
  reindexChunksMock: vi.fn(),
  getAboutFreshMock: vi.fn(),
  getExperienceEntryByIdMock: vi.fn(),
  getProjectForIndexByIdMock: vi.fn(),
  getKnowledgeEntryByIdMock: vi.fn(),
}));

vi.mock("@/lib/assistant/corpus/reindexDocument", () => ({
  reindexChunks: reindexChunksMock,
}));
vi.mock("@/lib/sanity", () => ({
  getAboutFresh: getAboutFreshMock,
  getExperienceEntryById: getExperienceEntryByIdMock,
  getProjectForIndexById: getProjectForIndexByIdMock,
  getKnowledgeEntryById: getKnowledgeEntryByIdMock,
}));

const { POST } = await import("./route");

const SECRET = "test-secret";

function makeRequest(body: string, signature: string | null) {
  const headers = new Headers();
  if (signature !== null) {
    headers.set("sanity-webhook-signature", signature);
  }
  return new Request("http://localhost/api/reindex", {
    method: "POST",
    headers,
    body,
  });
}

const { encodeSignatureHeader } = await import("@sanity/webhook");

async function sign(body: string) {
  return encodeSignatureHeader(body, Date.now(), SECRET);
}

describe("POST /api/reindex", () => {
  beforeEach(() => {
    process.env.SANITY_REINDEX_SECRET = SECRET;
    reindexChunksMock.mockReset();
    getAboutFreshMock.mockReset();
    getExperienceEntryByIdMock.mockReset();
    getProjectForIndexByIdMock.mockReset();
    getKnowledgeEntryByIdMock.mockReset();
    reindexChunksMock.mockResolvedValue(0);
  });

  afterEach(() => {
    delete process.env.SANITY_REINDEX_SECRET;
  });

  it("rejects a request with no signature header without reindexing", async () => {
    const body = JSON.stringify({ _id: "doc-1", _type: "project" });

    const response = await POST(makeRequest(body, null));

    expect(response.status).toBe(401);
    expect(reindexChunksMock).not.toHaveBeenCalled();
  });

  it("rejects a request with an invalid signature without reindexing", async () => {
    const body = JSON.stringify({ _id: "doc-1", _type: "project" });

    const response = await POST(makeRequest(body, "t=1,v=not-a-real-signature"));

    expect(response.status).toBe(401);
    expect(reindexChunksMock).not.toHaveBeenCalled();
  });

  it("refetches a published project by id and reindexes its chunks", async () => {
    const project = {
      _id: "doc-1",
      title: "A",
      slug: { current: "a" },
      summary: "s",
      body: [],
      techStack: [],
      skills: [],
      impact: [],
      dateCompleted: null,
    };
    getProjectForIndexByIdMock.mockResolvedValueOnce(project);
    reindexChunksMock.mockResolvedValueOnce(1);
    const body = JSON.stringify({ _id: "doc-1", _type: "project" });
    const signature = await sign(body);

    const response = await POST(makeRequest(body, signature));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(getProjectForIndexByIdMock).toHaveBeenCalledWith("doc-1");
    expect(reindexChunksMock).toHaveBeenCalledWith(
      "doc-1",
      expect.arrayContaining([expect.objectContaining({ documentId: "doc-1" })]),
    );
    expect(json).toEqual({ reindexed: true, documentId: "doc-1", chunksIndexed: 1 });
  });

  it("purges a project's chunks when the refetch finds no document (deleted/unpublished)", async () => {
    getProjectForIndexByIdMock.mockResolvedValueOnce(null);
    const body = JSON.stringify({ _id: "doc-1", _type: "project" });
    const signature = await sign(body);

    const response = await POST(makeRequest(body, signature));

    expect(response.status).toBe(200);
    expect(reindexChunksMock).toHaveBeenCalledWith("doc-1", []);
  });

  it("refetches a published experience entry by id and reindexes its chunks", async () => {
    const entry = {
      _id: "doc-2",
      company: "Acme",
      companyUrl: null,
      logo: null,
      order: 1,
      roles: [
        {
          title: "Engineer",
          startDate: "2020-01-01",
          endDate: null,
          summary: [],
          isCurrent: true,
        },
      ],
    };
    getExperienceEntryByIdMock.mockResolvedValueOnce(entry);
    reindexChunksMock.mockResolvedValueOnce(1);
    const body = JSON.stringify({ _id: "doc-2", _type: "experience" });
    const signature = await sign(body);

    const response = await POST(makeRequest(body, signature));

    expect(response.status).toBe(200);
    expect(getExperienceEntryByIdMock).toHaveBeenCalledWith("doc-2");
    expect(reindexChunksMock).toHaveBeenCalledWith(
      "doc-2",
      expect.arrayContaining([expect.objectContaining({ documentId: "doc-2" })]),
    );
  });

  it("purges an experience entry's chunks when the refetch finds no document", async () => {
    getExperienceEntryByIdMock.mockResolvedValueOnce(null);
    const body = JSON.stringify({ _id: "doc-2", _type: "experience" });
    const signature = await sign(body);

    await POST(makeRequest(body, signature));

    expect(reindexChunksMock).toHaveBeenCalledWith("doc-2", []);
  });

  it("refetches the about singleton and reindexes its chunks when the id matches", async () => {
    const about = {
      _id: "doc-3",
      name: "Matt",
      headline: "Engineer",
      bio: [],
      resumeUrl: null,
      email: "a@b.com",
      socialLinks: [],
    };
    getAboutFreshMock.mockResolvedValueOnce(about);
    reindexChunksMock.mockResolvedValueOnce(1);
    const body = JSON.stringify({ _id: "doc-3", _type: "about" });
    const signature = await sign(body);

    const response = await POST(makeRequest(body, signature));

    expect(response.status).toBe(200);
    expect(reindexChunksMock).toHaveBeenCalledWith(
      "doc-3",
      expect.arrayContaining([expect.objectContaining({ documentId: "doc-3" })]),
    );
  });

  it("purges the about singleton's chunks when the refetch returns null (deleted)", async () => {
    getAboutFreshMock.mockResolvedValueOnce(null);
    const body = JSON.stringify({ _id: "doc-3", _type: "about" });
    const signature = await sign(body);

    await POST(makeRequest(body, signature));

    expect(reindexChunksMock).toHaveBeenCalledWith("doc-3", []);
  });

  it("purges chunks for an unrecognized document type without fetching anything", async () => {
    const body = JSON.stringify({ _id: "doc-4", _type: "somethingElse" });
    const signature = await sign(body);

    await POST(makeRequest(body, signature));

    expect(getAboutFreshMock).not.toHaveBeenCalled();
    expect(getExperienceEntryByIdMock).not.toHaveBeenCalled();
    expect(getProjectForIndexByIdMock).not.toHaveBeenCalled();
    expect(getKnowledgeEntryByIdMock).not.toHaveBeenCalled();
    expect(reindexChunksMock).toHaveBeenCalledWith("doc-4", []);
  });

  it("refetches a published knowledge base entry by id and reindexes its chunks", async () => {
    const entry = {
      _id: "doc-5",
      title: "Positioning statement",
      body: [{ style: "normal", children: [{ text: "I focus on frontend systems." }] }],
      tags: ["positioning"],
    };
    getKnowledgeEntryByIdMock.mockResolvedValueOnce(entry);
    reindexChunksMock.mockResolvedValueOnce(1);
    const body = JSON.stringify({ _id: "doc-5", _type: "knowledgeBaseEntry" });
    const signature = await sign(body);

    const response = await POST(makeRequest(body, signature));

    expect(response.status).toBe(200);
    expect(getKnowledgeEntryByIdMock).toHaveBeenCalledWith("doc-5");
    expect(reindexChunksMock).toHaveBeenCalledWith(
      "doc-5",
      expect.arrayContaining([expect.objectContaining({ documentId: "doc-5" })]),
    );
  });

  it("purges a knowledge base entry's chunks when the refetch finds no document (deleted/unpublished)", async () => {
    getKnowledgeEntryByIdMock.mockResolvedValueOnce(null);
    const body = JSON.stringify({ _id: "doc-5", _type: "knowledgeBaseEntry" });
    const signature = await sign(body);

    await POST(makeRequest(body, signature));

    expect(reindexChunksMock).toHaveBeenCalledWith("doc-5", []);
  });
});
