import { describe, expect, it } from "vitest";
import { canonicalConnectionPair } from "./domain";

describe("insight connections", () => {
  it("stores both directions as one canonical pair", () => {
    expect(canonicalConnectionPair("b", "a")).toEqual(["a", "b"]);
    expect(canonicalConnectionPair("a", "b")).toEqual(["a", "b"]);
  });
  it("rejects self-connections", () => {
    expect(() => canonicalConnectionPair("a", "a")).toThrow();
  });
});
