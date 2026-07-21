"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function approveUser(formData: FormData) {
  const supabase = await createClient();
  const userId = formData.get("userId") as string;
  const systemRole = formData.get("systemRole") as string;
  const departmentId = formData.get("departmentId") as string;

  // La policy RLS vérifie déjà que l'appelant est admin ; ceci échouera
  // silencieusement (0 ligne affectée) si ce n'est pas le cas.
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ status: "active", system_role: systemRole })
    .eq("id", userId);

  if (updateError) throw new Error(updateError.message);

  if (departmentId) {
    const { error: deptError } = await supabase
      .from("department_members")
      .insert({ department_id: departmentId, user_id: userId });
    if (deptError) throw new Error(deptError.message);
  }

  revalidatePath("/admin/pending");
}

export async function rejectUser(formData: FormData) {
  const supabase = await createClient();
  const userId = formData.get("userId") as string;

  const { error } = await supabase
    .from("profiles")
    .update({ status: "rejected" })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/pending");
}
