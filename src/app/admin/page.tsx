import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { isAdminAuthenticated } from "@/lib/auth";
import { listForms } from "@/lib/forms";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const forms = await listForms();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
            Admin
          </h1>
          <p className="mt-1 text-[var(--muted)]">Manage media forms and examples</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/forms/new"
            className="rounded-full bg-gradient-to-r from-[var(--cyan)] to-[var(--violet)] px-4 py-2 text-sm font-bold text-white"
          >
            Add form
          </Link>
          <LogoutButton />
        </div>
      </div>

      <ul className="mt-8 space-y-2">
        {forms.map((form) => (
          <li
            key={form.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-white/70 px-4 py-3"
          >
            <div>
              <Link
                href={`/forms/${form.slug}`}
                className="font-[family-name:var(--font-display)] font-bold hover:text-[var(--violet)]"
              >
                {form.name}
              </Link>
              <p className="text-xs text-[var(--muted)]">{form.slug}</p>
            </div>
            <Link
              href={`/admin/forms/${form.id}`}
              className="rounded-full border border-[var(--line)] bg-white px-3 py-1.5 text-sm font-semibold"
            >
              Edit
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
