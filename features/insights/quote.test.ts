import { describe, expect, it } from "vitest";
import { buildRotatingQuotes } from "./quote";

function insight(id: string, content = `Insight ${id}`, title: string | null = null, sourceTitle: string | null = null) {
  return { id, content, title, sourceTitle };
}

describe("buildRotatingQuotes", () => {
  it("uses the normalized first sentence from insight content", () => {
    const [quote] = buildRotatingQuotes([
      insight("1", "  A useful idea.   More detail follows. "),
      insight("2"),
      insight("3"),
    ]);
    expect(quote.text).toBe("A useful idea.");
  });

  it("truncates long content at a word boundary", () => {
    const [quote] = buildRotatingQuotes([insight("1", "insight ".repeat(40)), insight("2"), insight("3")]);
    expect(quote.text.length).toBeLessThanOrEqual(180);
    expect(quote.text).toMatch(/insight…$/);
  });

  it("resolves attribution from source, title, then personal fallback", () => {
    const quotes = buildRotatingQuotes([
      insight("source", "One", "Title", "Source"),
      insight("title", "Two", "Title"),
      insight("personal", "Three"),
    ]);
    expect(quotes.map((quote) => quote.attribution)).toEqual(["Source", "Title", "Personal insight."]);
  });

  it.each([0, 1, 2])("returns three system quotes when %i insights exist", (count) => {
    const quotes = buildRotatingQuotes(Array.from({ length: count }, (_, index) => insight(String(index))));
    expect(quotes).toHaveLength(3);
    expect(quotes[0]).toEqual(expect.objectContaining({ text: "A more curious you leads to a brighter tomorrow.", attribution: "Keep learning." }));
    expect(quotes.every((quote) => quote.id.startsWith("system-"))).toBe(true);
  });

  it("uses only user insights once three exist", () => {
    const quotes = buildRotatingQuotes([insight("1"), insight("2"), insight("3")]);
    expect(quotes.map((quote) => quote.id)).toEqual(["1", "2", "3"]);
    expect(quotes.some((quote) => quote.id.startsWith("system-"))).toBe(false);
  });
});
