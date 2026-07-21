"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createDepartment(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const isWorship = formData.get("isWorship") === "on";

  const { error } = await supabase
    .from("departments")
    .insert({ name, color, is_worship: isWorship });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/departments");
}
