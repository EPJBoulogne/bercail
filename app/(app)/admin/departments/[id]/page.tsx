import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DepartmentDetailSection } from "./DepartmentDetailSection";
import { Breadcrumb } from "@/components/Breadcrumb";

export default async function DepartmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
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

  const { data: department } = await supabase
    .from("departments")
    .select("id, name, color, is_worship")
    .eq("id", id)
    .single();
  if (!department) notFound();

  const { data: memberRows } = await supabase
    .from("department_members")
    .select("user_id, profiles(id, name, system_role)")
    .eq("department_id", id);
  const members = (memberRows ?? [])
    .map((m: any) => ({
      id: m.profiles?.id,
      name: m.profiles?.name,
      role: m.profiles?.system_role,
    }))
    .filter((m) => m.id);

  const { data: roleRows } = await supabase
    .from("department_roles")
    .select("id, title, person_id, profiles(name)")
    .eq("department_id", id);
  const roles = (roleRows ?? []).map((r: any) => ({
    id: r.id,
    title: r.title,
    personName: r.profiles?.name ?? null,
  }));

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, name")
    .order("name");

  return (
    <div className="p-6 md:p-8">
      <Breadcrumb
        items={[
          { label: "Tableau de bord", href: "/" },
          { label: "Départements", href: "/admin/departments" },
          { label: department.name },
        ]}
      />
      <Link href="/admin/departments" className="text-sm text-gray-500 mb-4 inline-block">
        ‹ Retour aux départements
      </Link>
      <h1 className="font-display text-xl font-semibold mb-6">{department.name}</h1>

      <DepartmentDetailSection
        departmentId={department.id}
        name={department.name}
        color={department.color}
        isWorship={department.is_worship}
        members={members as any}
        roles={roles}
        allProfiles={allProfiles ?? []}
      />
    </div>
  );
}
