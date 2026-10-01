// @vitest-environment node
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from "./auth";

describe("auth", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).not.toContain("correct horse");
    expect(await verifyPassword("correct horse battery staple", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("round-trips a session token", async () => {
    const token = await createSessionToken("participant-123");
    expect(await verifySessionToken(token)).toBe("participant-123");
  });

  it("rejects a tampered or garbage token", async () => {
    const token = await createSessionToken("participant-123");
    expect(await verifySessionToken(`${token}tampered`)).toBeNull();
    expect(await verifySessionToken("not-a-jwt")).toBeNull();
  });
});
