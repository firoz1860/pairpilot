import { describe, it, expect } from "vitest";
import {
  isDisallowedIp,
  isDisallowedHostname,
  assertAllowedHost,
  assertSafeRedirect,
  SsrfError,
} from "./ssrf";

const ALLOW = ["www.linkedin.com", "www.instagram.com"];

describe("SSRF guards", () => {
  const blockedIps = [
    "127.0.0.1",
    "10.0.0.5",
    "172.16.9.1",
    "172.31.255.255",
    "192.168.1.1",
    "169.254.169.254", // cloud metadata
    "0.0.0.0",
    "100.64.0.1", // CGNAT
    "::1",
    "fe80::1",
    "fc00::1",
    "fd12:3456::1",
    "::ffff:127.0.0.1",
  ];
  it.each(blockedIps)("blocks internal/reserved IP %s", (ip) => {
    expect(isDisallowedIp(ip)).toBe(true);
  });

  const publicIps = ["8.8.8.8", "93.184.216.34", "1.1.1.1", "2606:4700::1111"];
  it.each(publicIps)("allows public IP %s", (ip) => {
    expect(isDisallowedIp(ip)).toBe(false);
  });

  it("blocks internal hostnames", () => {
    for (const h of ["localhost", "foo.local", "svc.internal", "metadata.google.internal"]) {
      expect(isDisallowedHostname(h)).toBe(true);
    }
  });

  it("assertAllowedHost permits allowlisted public hosts", () => {
    expect(() => assertAllowedHost("www.linkedin.com", ALLOW)).not.toThrow();
  });

  it("assertAllowedHost rejects non-allowlisted and internal hosts", () => {
    expect(() => assertAllowedHost("evil.example.com", ALLOW)).toThrow(SsrfError);
    expect(() => assertAllowedHost("127.0.0.1", ALLOW)).toThrow(SsrfError);
    expect(() => assertAllowedHost("localhost", ALLOW)).toThrow(SsrfError);
  });

  it("assertSafeRedirect enforces https + allowlist", () => {
    expect(() => assertSafeRedirect("https://www.instagram.com/jane", ALLOW)).not.toThrow();
    expect(() => assertSafeRedirect("http://www.instagram.com/jane", ALLOW)).toThrow(SsrfError);
    expect(() => assertSafeRedirect("https://169.254.169.254/latest/meta-data", ALLOW)).toThrow(
      SsrfError,
    );
  });
});
