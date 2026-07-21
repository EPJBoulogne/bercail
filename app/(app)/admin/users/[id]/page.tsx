import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { UserDetailSection } from "./UserDetailSection";
import { Breadcrumb } from "@/components/Breadcrumb";

export default async function UserDetailPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, phone, system_role, status")
    .eq("id", id)
    .single();
  if (!profile) notFound();

  const { data: memberships } = await supabase
    .from("department_members")
    .select("department_id")
    .eq("user_id", id);
  const memberDeptIds = (memberships ?? []).map((m) => m.department_id);

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  return (
    <div className="p-6 md:p-8">
      <Breadcrumb
        items={[
          { label: "Tableau de bord", href: "/" },
          { label: "Utilisateurs", href: "/admin/users" },
          { label: profile.name },
        ]}
      />
      <Link href="/admin/users" className="text-sm text-gray-500 mb-4 inline-block">
        ‹ Retour aux utilisateurs
      </Link>
      <h1 className="font-display text-xl font-semibold mb-6">{profile.name}</h1>

      <UserDetailSection
        userId={profile.id}
        name={profile.name}
        email={profile.email}
        phone={profile.phone}
        systemRole={profile.system_role}
        status={profile.status}
        departments={departments ?? []}
        memberDeptIds={memberDeptIds}
      />
    </div>
  );
}
