import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EnAttentePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, name")
    .eq("id", user.id)
    .single();

  if (profile?.status === "active") redirect("/");

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="font-display text-2xl font-semibold mb-4">
          Bercail<span className="text-accent">.</span>
        </h1>
        <p className="text-sm text-gray-600">
          Merci {profile?.name ? profile.name.split(" ")[0] : ""}, votre email
          est confirmé. Votre compte est <strong>en attente de validation</strong>{" "}
          par un administrateur — vous recevrez un accès dès qu&apos;il aura
          vérifié votre demande.
        </p>
      </div>
    </main>
  );
}
