"use client";

import { useEffect } from "react";

export function OctantToast({
  message,
  onDismiss,
  durationMs = 3200,
}: {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(t);
  }, [message, onDismiss, durationMs]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="octant-toast pointer-events-none fixed bottom-6 right-6 z-50 w-[min(92vw,24rem)]"
    >
      <div className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-white/95 px-4 py-3 shadow-[0_16px_40px_-20px_rgba(40,70,120,0.45)] backdrop-blur-md">
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, var(--cyan), var(--violet))" }}
          aria-hidden
        >
          i
        </span>
        <p className="flex-1 text-sm font-semibold leading-snug text-[var(--ink)]">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full px-2 text-sm font-bold text-[var(--muted)] hover:text-[var(--ink)]"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
