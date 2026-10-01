import { describe, it, expect } from "vitest";
import { normalizeProfileUrl, isSupportedProfileUrl, UrlValidationError } from "./url";

describe("profile URL validation", () => {
  it("normalizes a valid LinkedIn profile URL", () => {
    const r = normalizeProfileUrl("https://www.linkedin.com/in/Jane-Doe/?trk=abc");
    expect(r).toEqual({
      platform: "linkedin",
      canonicalUrl: "https://www.linkedin.com/in/jane-doe",
      handle: "jane-doe",
    });
  });

  it("normalizes a valid Instagram profile URL", () => {
    const r = normalizeProfileUrl("https://instagram.com/Jane.Doe");
    expect(r).toEqual({
      platform: "instagram",
      canonicalUrl: "https://www.instagram.com/jane.doe",
      handle: "jane.doe",
    });
  });

  it("accepts a scheme-less host", () => {
    expect(isSupportedProfileUrl("linkedin.com/in/someone")).toBe(true);
  });

  const rejections: Array<[string, string]> = [
    ["http://www.linkedin.com/in/jane", "unsupported_scheme"],
    ["https://example.com/in/jane", "unsupported_host"],
    ["https://www.linkedin.com/company/acme", "unsupported_path"],
    ["https://www.instagram.com/p/XYZ123", "unsupported_path"],
    ["https://www.instagram.com/a/b", "unsupported_path"],
    ["https://user:pass@www.linkedin.com/in/jane", "credentials_in_url"],
    ["https://www.linkedin.com:8080/in/jane", "port_not_allowed"],
    ["https://www.linkedin.com/in/ab", "invalid_handle"],
    ["not a url", "invalid_url"],
  ];

  it.each(rejections)("rejects %s with code %s", (input, code) => {
    try {
      normalizeProfileUrl(input);
      throw new Error("expected rejection");
    } catch (e) {
      expect(e).toBeInstanceOf(UrlValidationError);
      expect((e as UrlValidationError).code).toBe(code);
    }
  });

  it("isSupportedProfileUrl returns false for private/other hosts", () => {
    expect(isSupportedProfileUrl("https://facebook.com/jane")).toBe(false);
  });
});
