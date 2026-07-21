import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateDepartmentModal } from "@/components/CreateDepartmentModal";
import { Breadcrumb } from "@/components/Breadcrumb";

const colorClasses: Record<string, string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

export default async function AdminDepartmentsPage() {
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

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, color, is_worship, department_members(count), department_roles(count)")
    .order("name");

  return (
    <div className="p-6 md:p-8">
      <Breadcrumb items={[{ label: "Tableau de bord", href: "/" }, { label: "Départements" }]} />
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold mb-1">
            Gestion des départements
          </h1>
          <p className="text-sm text-gray-500">
            Membres et rôles, un niveau pour l&apos;instant.
          </p>
        </div>
        <CreateDepartmentModal />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {departments?.map((d: any) => (
          <Link
            key={d.id}
            href={`/admin/departments/${d.id}`}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-accent"
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`w-3 h-3 rounded-full ${colorClasses[d.color] ?? "bg-accent"}`}
              />
              <strong className="text-sm">{d.name}</strong>
              {d.is_worship && (
                <span className="text-[10px] bg-accent-soft text-accent rounded-full px-2 py-0.5">
                  Louange
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {d.department_roles?.[0]?.count ?? 0} rôle(s) ·{" "}
              {d.department_members?.[0]?.count ?? 0} membre(s)
            </p>
          </Link>
        ))}
        {departments?.length === 0 && (
          <p className="text-sm text-gray-500">Aucun département créé.</p>
        )}
      </div>
    </div>
  );
}
