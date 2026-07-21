"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createUserByAdmin(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const { data: me } = await supabase
    .from("profiles")
    .select("system_role")
    .eq("id", user.id)
    .single();
  if (me?.system_role !== "admin") throw new Error("Réservé aux administrateurs.");

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const systemRole = formData.get("systemRole") as string;
  const departmentId = formData.get("departmentId") as string;
  const tempPassword = crypto.randomUUID();

  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { name, phone, created_by_admin: true },
  });

  if (createError || !created.user) {
    throw new Error(createError?.message ?? "Création impossible.");
  }

  if (systemRole !== "member") {
    await supabase
      .from("profiles")
      .update({ system_role: systemRole })
      .eq("id", created.user.id);
  }

  if (departmentId) {
    await supabase
      .from("department_members")
      .insert({ department_id: departmentId, user_id: created.user.id });
  }

  await admin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  });

  revalidatePath("/admin/users");
}
