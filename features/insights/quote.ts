import type { RotatingQuote } from "./contracts";

const MAX_QUOTE_LENGTH = 180;

const systemQuotes: RotatingQuote[] = [
  { id: "system-curiosity", text: "A more curious you leads to a brighter tomorrow.", attribution: "Keep learning." },
  { id: "system-reflection", text: "Small ideas grow stronger each time you return to them.", attribution: "Keep reflecting." },
  { id: "system-noticing", text: "Notice what changes the way you see the world.", attribution: "Stay curious." },
];

type QuoteInsight = {
  id: string;
  content: string;
  title: string | null;
  sourceTitle: string | null;
};

function normalizeWhitespace(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function firstSentence(value: string) {
  const normalized = normalizeWhitespace(value);
  return normalized.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? normalized;
}

function truncateQuote(value: string) {
  if (value.length <= MAX_QUOTE_LENGTH) return value;
  const candidate = value.slice(0, MAX_QUOTE_LENGTH - 1).trimEnd();
  const wordBoundary = candidate.lastIndexOf(" ");
  const truncated = wordBoundary >= MAX_QUOTE_LENGTH / 2 ? candidate.slice(0, wordBoundary) : candidate;
  return `${truncated}…`;
}

export function buildRotatingQuotes(rows: QuoteInsight[]): RotatingQuote[] {
  if (rows.length < 3) return systemQuotes.map((quote) => ({ ...quote }));

  return rows.map((row) => ({
    id: row.id,
    text: truncateQuote(firstSentence(row.content)),
    attribution: row.sourceTitle || row.title || "Personal insight.",
  }));
}
