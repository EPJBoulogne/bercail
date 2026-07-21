"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const name = (formData.get("name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();

  if (!name) throw new Error("Le nom est requis.");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ name, phone: phone || null })
    .eq("id", user.id);
  if (profileError) throw new Error(profileError.message);

  // Un changement d'email passe par le flux sécurisé de Supabase : un
  // email de confirmation part vers la NOUVELLE adresse, et le
  // changement ne devient effectif qu'une fois ce lien cliqué. La copie
  // dans profiles.email n'est mise à jour qu'à ce moment-là (voir
  // /auth/callback), pas immédiatement ici.
  let emailChangeRequested = false;
  if (email && email !== user.email) {
    const { error: emailError } = await supabase.auth.updateUser({ email });
    if (emailError) throw new Error(emailError.message);
    emailChangeRequested = true;
  }

  revalidatePath("/preferences");
  return { emailChangeRequested };
}

export async function updatePreferences(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const remindersEnabled = formData.get("remindersEnabled") === "on";
  const defaultDepartmentId = (formData.get("defaultDepartmentId") as string) || null;

  const { error } = await supabase
    .from("profiles")
    .update({
      reminders_enabled: remindersEnabled,
      default_department_id: defaultDepartmentId,
    })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/preferences");
}
