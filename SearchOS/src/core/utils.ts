export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export function normalizeText(text: string): string {
  return String(text ?? "").toLowerCase().trim();
}

export function includesText(value: unknown, query: string): boolean {
  return normalizeText(String(value ?? "")).includes(normalizeText(query));
}

export function tokenize(text: string): string[] {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function extractKeywords(text: string, maxKeywords = 20): string[] {
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "was", "are", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "must", "shall", "can", "this", "that",
    "these", "those", "it", "its", "they", "them", "their"
  ]);
  return [...new Set(tokenize(text))].filter(w => w.length > 2 && !stopWords.has(w)).slice(0, maxKeywords);
}

export function calculateSimilarity(text1: string, text2: string): number {
  const tokens1 = new Set(tokenize(text1));
  const tokens2 = new Set(tokenize(text2));
  if (tokens1.size === 0 || tokens2.size === 0) return 0;
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  return intersection.size / Math.sqrt(tokens1.size * tokens2.size);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

export function highlightMatches(text: string, query: string): string[] {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  if (!normalizedText || !normalizedQuery) return [];
  
  const matches: string[] = [];
  let startIndex = 0;
  
  while (true) {
    const matchIndex = normalizedText.indexOf(normalizedQuery, startIndex);
    if (matchIndex === -1) break;
    
    const snippetStart = Math.max(0, matchIndex - 30);
    const snippetEnd = Math.min(text.length, matchIndex + query.length + 30);
    const snippet = text.slice(snippetStart, snippetEnd);
    matches.push((snippetStart > 0 ? "..." : "") + snippet + (snippetEnd < text.length ? "..." : ""));
    startIndex = matchIndex + 1;
    
    if (matches.length >= 3) break;
  }
  
  return matches;
}

export function extractSnippet(text: string, query: string, maxLength = 150): string {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  
  if (!normalizedText) return "";
  
  const matchIndex = normalizedText.indexOf(normalizedQuery);
  if (matchIndex === -1) {
    return truncate(text, maxLength);
  }
  
  const snippetStart = Math.max(0, matchIndex - 50);
  const snippetEnd = Math.min(text.length, matchIndex + query.length + 100);
  const snippet = text.slice(snippetStart, snippetEnd);
  return (snippetStart > 0 ? "..." : "") + snippet + (snippetEnd < text.length ? "..." : "");
}

export function calculateScore(document: { title: string; content: string; keywords?: string[] }, query: string): number {
  const queryTokens = tokenize(query);
  const titleTokens = tokenize(document.title);
  const contentTokens = tokenize(document.content);
  
  let score = 0;
  
  for (const queryToken of queryTokens) {
    if (titleTokens.includes(queryToken)) {
      score += 10;
    }
    if (contentTokens.includes(queryToken)) {
      score += 1;
    }
  }
  
  if (document.keywords) {
    for (const queryToken of queryTokens) {
      if (document.keywords.includes(queryToken)) {
        score += 5;
      }
    }
  }
  
  const titleSimilarity = calculateSimilarity(document.title, query);
  score += titleSimilarity * 15;
  
  const contentSimilarity = calculateSimilarity(document.content, query);
  score += contentSimilarity * 5;
  
  return score;
}
