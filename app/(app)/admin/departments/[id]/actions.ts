"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateDepartment(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const isWorship = formData.get("isWorship") === "on";

  const { error } = await supabase
    .from("departments")
    .update({ name, color, is_worship: isWorship })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/departments/${id}`);
}

export async function addMember(formData: FormData) {
  const supabase = await createClient();
  const departmentId = formData.get("departmentId") as string;
  const userId = formData.get("userId") as string;
  if (!userId) return;

  const { error } = await supabase
    .from("department_members")
    .insert({ department_id: departmentId, user_id: userId });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/departments/${departmentId}`);
}

export async function removeMember(formData: FormData) {
  const supabase = await createClient();
  const departmentId = formData.get("departmentId") as string;
  const userId = formData.get("userId") as string;

  const { error } = await supabase
    .from("department_members")
    .delete()
    .eq("department_id", departmentId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/departments/${departmentId}`);
}

export async function addRole(formData: FormData) {
  const supabase = await createClient();
  const departmentId = formData.get("departmentId") as string;
  const title = formData.get("title") as string;
  const personId = formData.get("personId") as string;
  if (!title) return;

  const { error } = await supabase
    .from("department_roles")
    .insert({
      department_id: departmentId,
      title,
      person_id: personId || null,
    });

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/departments/${departmentId}`);
}

export async function removeRole(formData: FormData) {
  const supabase = await createClient();
  const departmentId = formData.get("departmentId") as string;
  const roleId = formData.get("roleId") as string;

  const { error } = await supabase.from("department_roles").delete().eq("id", roleId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/departments/${departmentId}`);
}
