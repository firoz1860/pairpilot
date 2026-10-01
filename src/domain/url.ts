/**
 * URL validation + canonicalization for the two (and only two) allowed
 * profile-information sources: a participant's official public LinkedIn
 * profile and their official public Instagram profile.
 *
 * Anything else — other hosts, non-https schemes, embedded credentials,
 * company/hashtag/post URLs — is rejected with a specific error code.
 */

export type Platform = "linkedin" | "instagram";

export interface NormalizedUrl {
  platform: Platform;
  canonicalUrl: string;
  handle: string;
}

export type UrlErrorCode =
  | "invalid_url"
  | "unsupported_scheme"
  | "credentials_in_url"
  | "port_not_allowed"
  | "unsupported_host"
  | "unsupported_path"
  | "invalid_handle";

export class UrlValidationError extends Error {
  readonly code: UrlErrorCode;
  constructor(code: UrlErrorCode, message: string) {
    super(message);
    this.name = "UrlValidationError";
    this.code = code;
  }
}

const LINKEDIN_HOSTS = new Set(["linkedin.com", "www.linkedin.com"]);
const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com"]);

const LINKEDIN_SLUG = /^[a-z0-9\-%]{3,100}$/i;
const INSTAGRAM_USERNAME = /^[a-z0-9._]{1,30}$/i;

// Instagram path segments that are never a user profile.
const INSTAGRAM_RESERVED = new Set([
  "p",
  "reel",
  "reels",
  "explore",
  "accounts",
  "about",
  "developer",
  "directory",
  "legal",
  "privacy",
  "tv",
  "stories",
  "direct",
]);

function parseUrl(input: string): URL {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new UrlValidationError("invalid_url", "URL is empty");
  }
  try {
    return new URL(trimmed);
  } catch {
    // Allow a scheme-less host like "linkedin.com/in/jane".
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      throw new UrlValidationError("invalid_url", "URL could not be parsed");
    }
  }
}

function segments(pathname: string): string[] {
  return pathname.split("/").filter(Boolean);
}

/** Validate + canonicalize a LinkedIn or Instagram profile URL. */
export function normalizeProfileUrl(input: string): NormalizedUrl {
  const url = parseUrl(input);

  if (url.protocol !== "https:") {
    throw new UrlValidationError("unsupported_scheme", "only https URLs are accepted");
  }
  if (url.username || url.password) {
    throw new UrlValidationError("credentials_in_url", "URLs must not contain credentials");
  }
  if (url.port) {
    throw new UrlValidationError("port_not_allowed", "custom ports are not allowed");
  }

  const host = url.hostname.toLowerCase();
  const parts = segments(url.pathname);

  if (LINKEDIN_HOSTS.has(host)) {
    if (parts.length < 2 || parts[0] !== "in") {
      throw new UrlValidationError(
        "unsupported_path",
        "LinkedIn URL must be a public profile of the form /in/<handle>",
      );
    }
    const slug = decodeURIComponent(parts[1] as string).toLowerCase();
    if (!LINKEDIN_SLUG.test(parts[1] as string)) {
      throw new UrlValidationError("invalid_handle", "LinkedIn handle is invalid");
    }
    return {
      platform: "linkedin",
      canonicalUrl: `https://www.linkedin.com/in/${slug}`,
      handle: slug,
    };
  }

  if (INSTAGRAM_HOSTS.has(host)) {
    if (parts.length !== 1) {
      throw new UrlValidationError(
        "unsupported_path",
        "Instagram URL must be a profile of the form /<username>",
      );
    }
    const username = (parts[0] as string).toLowerCase();
    if (INSTAGRAM_RESERVED.has(username)) {
      throw new UrlValidationError("unsupported_path", "that is not an Instagram profile URL");
    }
    if (!INSTAGRAM_USERNAME.test(username)) {
      throw new UrlValidationError("invalid_handle", "Instagram username is invalid");
    }
    return {
      platform: "instagram",
      canonicalUrl: `https://www.instagram.com/${username}`,
      handle: username,
    };
  }

  throw new UrlValidationError(
    "unsupported_host",
    "only linkedin.com and instagram.com profile URLs are supported",
  );
}

/** True if the input is a valid LinkedIn or Instagram profile URL. */
export function isSupportedProfileUrl(input: string): boolean {
  try {
    normalizeProfileUrl(input);
    return true;
  } catch {
    return false;
  }
}
