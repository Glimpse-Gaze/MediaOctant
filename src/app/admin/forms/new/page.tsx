import { redirect } from "next/navigation";
import { FormEditor } from "@/components/FormEditor";
import { isAdminAuthenticated } from "@/lib/auth";
import { getTraitDefinitions } from "@/lib/forms";

export const dynamic = "force-dynamic";

export default async function NewFormPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  const traits = await getTraitDefinitions();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
        Add media form
      </h1>
      <FormEditor key="new" traits={traits} />
    </div>
  );
}
