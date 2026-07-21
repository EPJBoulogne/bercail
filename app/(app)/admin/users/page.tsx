import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateUserModal } from "@/components/CreateUserModal";
import { Breadcrumb } from "@/components/Breadcrumb";

const roleLabel: Record<string, string> = {
  admin: "Administrateur",
  dept_manager: "Responsable de département",
  member: "Membre",
};

export default async function AdminUsersPage() {
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

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, system_role, status, department_members(departments(name))")
    .order("name");

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  return (
    <div className="p-6 md:p-8">
      <Breadcrumb items={[{ label: "Tableau de bord", href: "/" }, { label: "Utilisateurs" }]} />
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold mb-1">
            Gestion des utilisateurs
          </h1>
          <p className="text-sm text-gray-500">
            Droits, département, statut du compte.
          </p>
        </div>
        <CreateUserModal departments={departments ?? []} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {profiles?.map((p: any) => {
          const depts = (p.department_members ?? [])
            .map((m: any) => m.departments?.name)
            .filter(Boolean)
            .join(", ");
          const initials = p.name
            .split(" ")
            .map((s: string) => s[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();

          return (
            <Link
              key={p.id}
              href={`/admin/users/${p.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-accent-soft text-accent text-xs font-medium flex items-center justify-center">
                  {initials}
                </span>
                <div>
                  <p className="text-sm">{p.name}</p>
                  <p className="text-xs text-gray-500">
                    {depts || "Aucun département"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {p.status !== "active" && (
                  <span className="text-[10px] bg-warning/10 text-warning rounded-full px-2 py-0.5">
                    {p.status === "pending" ? "en attente" : "refusé"}
                  </span>
                )}
                <span className="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                  {roleLabel[p.system_role] ?? p.system_role}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
