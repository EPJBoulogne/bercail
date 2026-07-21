"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateUser(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string;
  const systemRole = formData.get("systemRole") as string;
  const departmentIds = formData.getAll("departmentIds") as string[];

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ name, phone: phone || null, system_role: systemRole })
    .eq("id", id);
  if (updateError) throw new Error(updateError.message);

  // On repart de zéro sur les appartenances : plus simple et fiable que
  // de calculer un diff, pour un formulaire à cases à cocher.
  const { error: deleteError } = await supabase
    .from("department_members")
    .delete()
    .eq("user_id", id);
  if (deleteError) throw new Error(deleteError.message);

  if (departmentIds.length > 0) {
    const { error: insertError } = await supabase.from("department_members").insert(
      departmentIds.map((departmentId) => ({ department_id: departmentId, user_id: id }))
    );
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath(`/admin/users/${id}`);
  revalidatePath("/admin/users");
}
