/**
 * Server-side SSRF protection for outbound source extraction.
 *
 * Even though only two public hosts are ever requested, a hostile redirect or
 * a DNS entry pointing at an internal address must not let the extractor reach
 * private networks or cloud metadata endpoints. These pure checks are applied
 * to every resolved address and to every redirect target by the adapter.
 */

export class SsrfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SsrfError";
  }
}

export function parseIpv4(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const octets: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const n = Number(part);
    if (n < 0 || n > 255) return null;
    octets.push(n);
  }
  return octets;
}

export function isDisallowedIpv4(octets: number[]): boolean {
  const [a, b] = octets as [number, number, number, number];
  if (a === 0) return true; // 0.0.0.0/8 "this network"
  if (a === 10) return true; // private
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local + 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved + broadcast
  return false;
}

export function isDisallowedIp(ipRaw: string): boolean {
  const ip = ipRaw.trim().toLowerCase().replace(/^\[/, "").replace(/\]$/, "");
  if (ip.includes(":")) {
    const addr = ip.split("%")[0] as string; // strip zone id
    if (addr === "::1" || addr === "::" || addr === "0:0:0:0:0:0:0:1") return true;
    if (addr.startsWith("fe80")) return true; // link-local
    if (addr.startsWith("fc") || addr.startsWith("fd")) return true; // unique local
    const mapped = addr.match(/::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (mapped) {
      const octets = parseIpv4(mapped[1] as string);
      return octets ? isDisallowedIpv4(octets) : true;
    }
    return false;
  }
  const octets = parseIpv4(ip);
  if (!octets) return false; // not an IP literal; hostname checks handle it
  return isDisallowedIpv4(octets);
}

const DISALLOWED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata",
]);

export function isDisallowedHostname(hostRaw: string): boolean {
  const host = hostRaw.trim().toLowerCase().replace(/\.$/, "");
  if (!host) return true;
  if (DISALLOWED_HOSTNAMES.has(host)) return true;
  if (
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }
  return isDisallowedIp(host);
}

/** Throw unless `host` is in the allowlist and is not an internal/reserved target. */
export function assertAllowedHost(hostRaw: string, allowlist: readonly string[]): void {
  const host = hostRaw.trim().toLowerCase().replace(/\.$/, "");
  if (isDisallowedHostname(host)) {
    throw new SsrfError(`host is not permitted: ${host}`);
  }
  const allowed = allowlist.map((h) => h.trim().toLowerCase());
  if (!allowed.includes(host)) {
    throw new SsrfError(`host is not in the allowlist: ${host}`);
  }
}

/** Throw unless a redirect target is https and stays within the allowlist. */
export function assertSafeRedirect(targetUrl: string, allowlist: readonly string[]): void {
  let url: URL;
  try {
    url = new URL(targetUrl);
  } catch {
    throw new SsrfError("redirect target is not a valid URL");
  }
  if (url.protocol !== "https:") {
    throw new SsrfError("redirect target must be https");
  }
  assertAllowedHost(url.hostname, allowlist);
}
