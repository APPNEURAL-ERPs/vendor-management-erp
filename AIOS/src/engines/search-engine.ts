import { AiosState, KnowledgeChunk, SearchHit } from "../core/domain";
import { estimateTokens } from "../core/id";
import { uniq } from "../core/utils";

const STOP_WORDS = new Set(["the", "a", "an", "and", "or", "to", "of", "in", "for", "on", "with", "is", "are", "what", "how", "show", "me", "last", "this"]);

export function tokenize(text: string): string[] {
  return uniq(String(text).toLowerCase().replace(/[^a-z0-9₹$._-]+/g, " ").split(/\s+/).filter((token) => token.length > 1 && !STOP_WORDS.has(token)));
}

export function chunkText(text: string, chunkSize = 700, overlap = 100): string[] {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let index = 0;
  while (index < clean.length) {
    const end = Math.min(index + chunkSize, clean.length);
    chunks.push(clean.slice(index, end).trim());
    if (end === clean.length) break;
    index = Math.max(0, end - overlap);
  }
  return chunks;
}

export class SearchEngine {
  buildChunk(base: Omit<KnowledgeChunk, "tokenEstimate" | "keywords"> & { text: string }): KnowledgeChunk {
    return {
      ...base,
      tokenEstimate: estimateTokens(base.text),
      keywords: tokenize(base.text).slice(0, 50)
    };
  }

  search(state: AiosState, tenantId: string, knowledgeBaseIds: string[], query: string, limit = 5): SearchHit[] {
    const queryTokens = tokenize(query);
    const chunks = state.chunks.filter((chunk) => chunk.tenantId === tenantId && knowledgeBaseIds.includes(chunk.knowledgeBaseId));
    const hits = chunks.map((chunk) => {
      const overlap = chunk.keywords.filter((keyword) => queryTokens.includes(keyword));
      const exact = String(chunk.text).toLowerCase().includes(String(query).toLowerCase()) ? 2 : 0;
      const score = overlap.length + exact + overlap.length / Math.max(1, queryTokens.length);
      const doc = state.documents.find((item) => item.id === chunk.documentId);
      return {
        chunkId: chunk.id,
        documentId: chunk.documentId,
        knowledgeBaseId: chunk.knowledgeBaseId,
        title: doc?.title ?? "Untitled document",
        text: chunk.text,
        score: Number(score.toFixed(4)),
        keywords: overlap,
        citation: `${doc?.title ?? "Document"}#chunk-${chunk.chunkIndex + 1}`
      };
    }).filter((hit) => hit.score > 0);

    return hits.sort((a, b) => b.score - a.score).slice(0, limit);
  }
}
