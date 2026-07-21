import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { AccountMenu } from "@/components/AccountMenu";
import { PageBanner } from "@/components/PageBanner";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, system_role, status")
    .eq("id", user.id)
    .single();
  if (!profile || profile.status !== "active") redirect("/en-attente");
  const { data: memberships } = await supabase
    .from("department_members")
    .select("departments(is_worship)")
    .eq("user_id", user.id);
  const isWorshipMember =
    profile.system_role === "admin" ||
    (memberships ?? []).some((m: any) => m.departments?.is_worship);
  return (
    <>
      <PageBanner />
      <div className="min-h-screen flex flex-col md:flex-row">
        <Sidebar isWorshipMember={isWorshipMember} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="flex items-center justify-end gap-3 px-6 py-3 border-b border-gray-200 bg-white">
            <AccountMenu name={profile.name} role={profile.system_role} />
          </header>
          <main className="flex-1 pb-16 md:pb-0">{children}</main>
        </div>
        <MobileNav isWorshipMember={isWorshipMember} />
      </div>
    </>
  );
}