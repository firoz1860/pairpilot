import { describe, it, expect, vi } from "vitest";
import { guardedFetch } from "./live";

const ALLOW = ["api.example.com"];
const opts = { allowlist: ALLOW, timeoutMs: 1000, maxRetries: 1 };

describe("guardedFetch SSRF protection", () => {
  it("refuses a disallowed/internal host before making any request", async () => {
    const fetchImpl = vi.fn();
    await expect(
      guardedFetch("https://127.0.0.1/x", { ...opts, allowlist: ["127.0.0.1"] }, fetchImpl as never),
    ).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("refuses a non-https URL", async () => {
    const fetchImpl = vi.fn();
    await expect(guardedFetch("http://api.example.com/x", opts, fetchImpl as never)).rejects.toThrow();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("follows and revalidates a redirect that stays in the allowlist", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: "https://api.example.com/final" } }),
      )
      .mockResolvedValueOnce(new Response("ok", { status: 200 }));
    const res = await guardedFetch("https://api.example.com/start", opts, fetchImpl as never);
    expect(res.status).toBe(200);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("rejects a redirect pointing at an internal address", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: "https://169.254.169.254/latest" } }),
      );
    await expect(
      guardedFetch("https://api.example.com/start", opts, fetchImpl as never),
    ).rejects.toThrow();
  });
});
