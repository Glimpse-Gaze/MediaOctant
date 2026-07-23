import Link from "next/link";

export function SiteHeader({ admin }: { admin: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-white/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="group flex items-baseline gap-2">
          <span
            className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight"
            style={{ letterSpacing: "-0.03em" }}
          >
            Media Forms
            <span className="ml-1 bg-gradient-to-r from-[var(--cyan)] via-[var(--violet)] to-[var(--coral)] bg-clip-text text-transparent">
              Atlas
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold">
          <Link
            href="/"
            className="rounded-full px-3 py-1.5 text-[var(--muted)] transition hover:bg-white hover:text-[var(--ink)]"
          >
            Atlas
          </Link>
          <Link
            href="/forms"
            className="rounded-full px-3 py-1.5 text-[var(--muted)] transition hover:bg-white hover:text-[var(--ink)]"
          >
            Browse
          </Link>
          {admin ? (
            <>
              <Link
                href="/admin"
                className="rounded-full bg-[var(--ink)] px-3 py-1.5 text-white transition hover:opacity-90"
              >
                Admin
              </Link>
            </>
          ) : (
            <Link
              href="/admin/login"
              className="rounded-full border border-[var(--line)] bg-white/80 px-3 py-1.5 text-[var(--muted)] transition hover:text-[var(--ink)]"
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
