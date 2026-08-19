// Below this fraction of the answer's significant words showing up in the
// retrieved context, the answer is treated as ungrounded — the model may
// have drifted onto content the corpus never supplied.
export const MIN_TRACEABILITY_RATIO = 0.5;

const MIN_WORD_LENGTH = 4;

const STOPWORDS = new Set([
  "about", "above", "after", "again", "against", "being", "below", "between",
  "could", "derived", "does", "doesn", "during", "each", "from", "have",
  "here", "into", "just", "more", "most", "only", "other", "over", "same",
  "should", "some", "than", "that", "their", "them", "then", "there",
  "these", "they", "this", "those", "through", "under", "until", "very",
  "were", "what", "when", "where", "which", "while", "with", "would",
  "your", "yours",
]);

function significantWords(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return [...new Set(words.filter((word) => word.length >= MIN_WORD_LENGTH && !STOPWORDS.has(word)))];
}

// Chunks arrive already stuffed into `contextText` by buildContext, so the
// citations event's source material and this check's source material are
// the same text — no separate chunk lookup needed.
export function isAnswerGrounded(answerText: string, contextText: string): boolean {
  const answerWords = significantWords(answerText);
  if (answerWords.length === 0) return true;

  const context = contextText.toLowerCase();
  const tracedCount = answerWords.filter((word) => context.includes(word)).length;

  return tracedCount / answerWords.length >= MIN_TRACEABILITY_RATIO;
}
