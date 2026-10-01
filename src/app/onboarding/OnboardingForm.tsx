"use client";

import { useState } from "react";
import Link from "next/link";
import { isSupportedProfileUrl, normalizeProfileUrl } from "@/domain/url";

type Status = "idle" | "submitting" | "success" | "error";

export function OnboardingForm() {
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    linkedinUrl: "",
    instagramUrl: "",
    adultConfirmed: false,
    consentDatingSim: false,
    consentPublicShowcase: false,
    identityConfirmed: false,
  });
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function safePlatform(url: string): string | null {
    try {
      return normalizeProfileUrl(url).platform;
    } catch {
      return null;
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!form.displayName.trim()) errs.displayName = "Required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errs.email = "Enter a valid email.";
    if (form.password.length < 8) errs.password = "At least 8 characters.";
    if (!isSupportedProfileUrl(form.linkedinUrl) || safePlatform(form.linkedinUrl) !== "linkedin")
      errs.linkedinUrl = "Enter a public LinkedIn profile URL (linkedin.com/in/…).";
    if (!isSupportedProfileUrl(form.instagramUrl) || safePlatform(form.instagramUrl) !== "instagram")
      errs.instagramUrl = "Enter a public Instagram profile URL (instagram.com/…).";
    if (!form.adultConfirmed) errs.adultConfirmed = "Required.";
    if (!form.consentDatingSim) errs.consentDatingSim = "Required.";
    if (!form.identityConfirmed) errs.identityConfirmed = "Required.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    setMessage("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (res.status === 201) {
        setStatus("success");
      } else if (res.status === 503) {
        setStatus("error");
        setMessage(
          data.message ??
            "Onboarding needs a configured database. The public showcase works without one.",
        );
      } else {
        setStatus("error");
        setMessage(data.message ?? data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="card p-6">
        <h2 className="text-xl font-bold text-navy">Agent queued</h2>
        <p className="mt-2 text-navy-muted">
          Your consent is recorded and both sources are queued for extraction. Once the background
          worker reads each source and you approve the extracted claims, your agent enters the
          simulation.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/showcase" className="btn-secondary">
            Explore the showcase meanwhile →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-5 p-6" noValidate>
      <Field label="Display name" error={fieldErrors.displayName}>
        <input
          className="input"
          value={form.displayName}
          onChange={(e) => update("displayName", e.target.value)}
          autoComplete="name"
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Email" error={fieldErrors.email}>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Password" error={fieldErrors.password}>
          <input
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            autoComplete="new-password"
          />
        </Field>
      </div>
      <Field label="Public LinkedIn URL" error={fieldErrors.linkedinUrl}>
        <input
          className="input"
          placeholder="https://www.linkedin.com/in/your-handle"
          value={form.linkedinUrl}
          onChange={(e) => update("linkedinUrl", e.target.value)}
        />
      </Field>
      <Field label="Public Instagram URL" error={fieldErrors.instagramUrl}>
        <input
          className="input"
          placeholder="https://www.instagram.com/your-handle"
          value={form.instagramUrl}
          onChange={(e) => update("instagramUrl", e.target.value)}
        />
      </Field>

      <fieldset className="space-y-3 rounded-xl border border-line p-4">
        <legend className="px-1 text-sm font-semibold text-navy">Eligibility &amp; consent</legend>
        <Check
          checked={form.adultConfirmed}
          onChange={(v) => update("adultConfirmed", v)}
          error={fieldErrors.adultConfirmed}
          label="I confirm I am an adult (18+)."
        />
        <Check
          checked={form.consentDatingSim}
          onChange={(v) => update("consentDatingSim", v)}
          error={fieldErrors.consentDatingSim}
          label="I consent to an AI agent being created from my two public profiles for this dating simulation."
        />
        <Check
          checked={form.identityConfirmed}
          onChange={(v) => update("identityConfirmed", v)}
          error={fieldErrors.identityConfirmed}
          label="I confirm these two links are my own official public profiles."
        />
        <Check
          checked={form.consentPublicShowcase}
          onChange={(v) => update("consentPublicShowcase", v)}
          label="(Optional) I consent to appear in the public showcase."
        />
      </fieldset>

      {status === "error" && message ? (
        <p role="alert" className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
          {message}
        </p>
      ) : null}

      <button type="submit" className="btn-primary w-full" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting…" : "Create my agent"}
      </button>
      <p className="text-xs text-navy-soft">
        Public availability is not consent. We only create an agent for you, from your own two public
        sources, after you confirm the above.
      </p>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-xs text-danger">{error}</span> : null}
    </label>
  );
}

function Check({
  checked,
  onChange,
  label,
  error,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  error?: string;
}) {
  return (
    <label className="flex items-start gap-3 text-sm text-navy">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-line text-coral focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet"
      />
      <span>
        {label}
        {error ? <span className="mt-0.5 block text-xs text-danger">{error}</span> : null}
      </span>
    </label>
  );
}
