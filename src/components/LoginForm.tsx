"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (!res.ok) {
      setError("Wrong password");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto mt-16 w-full max-w-sm rounded-3xl border border-[var(--line)] bg-white/80 p-6 shadow-sm"
    >
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Admin login</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Only the site admin can add or edit media forms.
      </p>
      <label className="mt-5 block text-sm font-semibold">
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 outline-none ring-[var(--violet)] focus:ring-2"
          autoFocus
        />
      </label>
      {error ? <p className="mt-2 text-sm text-[var(--coral)]">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-full bg-[var(--ink)] py-2.5 text-sm font-bold text-white disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
