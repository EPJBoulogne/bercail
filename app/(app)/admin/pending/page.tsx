import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { approveUser, rejectUser } from "./actions";
import { Breadcrumb } from "@/components/Breadcrumb";

export default async function PendingUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("system_role")
    .eq("id", user.id)
    .single();
  if (me?.system_role !== "admin") redirect("/");

  const { data: pending } = await supabase
    .from("profiles")
    .select("id, name, email, phone, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  return (
    <main className="max-w-3xl mx-auto p-8">
      <Breadcrumb
        items={[{ label: "Tableau de bord", href: "/" }, { label: "Comptes en attente" }]}
      />
      <h1 className="font-display text-xl font-semibold mb-1">
        Comptes en attente
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        {pending?.length ?? 0} demande(s) à valider.
      </p>

      <div className="space-y-4">
        {pending?.map((p) => (
          <form
            key={p.id}
            action={approveUser}
            className="border border-gray-200 rounded-lg p-4 bg-white"
          >
            <input type="hidden" name="userId" value={p.id} />
            <div className="mb-3">
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-xs text-gray-500">
                {p.email}
                {p.phone ? ` · ${p.phone}` : ""}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <select
                name="systemRole"
                defaultValue="member"
                className="text-sm border border-gray-300 rounded-md px-2 py-1.5"
              >
                <option value="member">Membre</option>
                <option value="dept_manager">Responsable de département</option>
                <option value="admin">Administrateur</option>
              </select>

              <select
                name="departmentId"
                defaultValue=""
                className="text-sm border border-gray-300 rounded-md px-2 py-1.5"
              >
                <option value="">Aucun département</option>
                {departments?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="bg-accent text-white text-sm rounded-md px-3 py-1.5"
              >
                Approuver
              </button>
              <button
                type="submit"
                formAction={rejectUser}
                className="text-sm text-danger border border-danger rounded-md px-3 py-1.5"
              >
                Refuser
              </button>
            </div>
          </form>
        ))}

        {pending?.length === 0 && (
          <p className="text-sm text-gray-500">Aucune demande en attente.</p>
        )}
      </div>
    </main>
  );
}
