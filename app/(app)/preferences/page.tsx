import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountSection } from "./AccountSection";
import { PreferencesForm } from "./PreferencesForm";

export default async function PreferencesPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, phone, reminders_enabled, default_department_id")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("department_members")
    .select("departments(id, name)")
    .eq("user_id", user.id);
  const myDepartments = (memberships ?? [])
    .map((m: any) => m.departments)
    .filter(Boolean);

  const tab = searchParams.tab === "preferences" ? "preferences" : "account";

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-display text-xl font-semibold mb-1">Mon compte</h1>
      <p className="text-sm text-gray-500 mb-6">
        Vos informations et vos réglages personnels.
      </p>

      <div className="flex gap-2 mb-6">
        <Link
          href="/preferences?tab=account"
          className={`text-sm rounded-md px-3 py-1.5 ${
            tab === "account" ? "bg-accent text-white" : "border border-gray-300"
          }`}
        >
          Compte
        </Link>
        <Link
          href="/preferences?tab=preferences"
          className={`text-sm rounded-md px-3 py-1.5 ${
            tab === "preferences" ? "bg-accent text-white" : "border border-gray-300"
          }`}
        >
          Préférences
        </Link>
      </div>

      {tab === "account" && (
        <AccountSection
          name={profile?.name ?? ""}
          email={user.email ?? ""}
          phone={profile?.phone ?? null}
        />
      )}
      {tab === "preferences" && (
        <PreferencesForm
          remindersEnabled={profile?.reminders_enabled ?? true}
          defaultDepartmentId={profile?.default_department_id ?? null}
          departments={myDepartments}
        />
      )}
    </div>
  );
}
