import { afterEach, describe, expect, it } from "vitest";
import { isGoogleSsoEnabled } from "./config";

const originalValue = process.env.GOOGLE_SSO_ON;

afterEach(() => {
  if (originalValue === undefined) delete process.env.GOOGLE_SSO_ON;
  else process.env.GOOGLE_SSO_ON = originalValue;
});

describe("Google SSO feature flag", () => {
  it("is disabled by default", () => {
    delete process.env.GOOGLE_SSO_ON;
    expect(isGoogleSsoEnabled()).toBe(false);
  });

  it("is enabled only by the explicit true value", () => {
    process.env.GOOGLE_SSO_ON = "true";
    expect(isGoogleSsoEnabled()).toBe(true);

    process.env.GOOGLE_SSO_ON = "false";
    expect(isGoogleSsoEnabled()).toBe(false);
  });
});
