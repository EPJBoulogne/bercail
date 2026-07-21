"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addUnavailability(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  if (!startDate || !endDate) throw new Error("Les deux dates sont requises.");
  if (endDate < startDate) throw new Error("La date de fin doit être après la date de début.");

  const { error } = await supabase.from("unavailability").insert({
    user_id: user.id,
    start_date: startDate,
    end_date: endDate,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/disponibilite");
}

export async function deleteUnavailability(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase.from("unavailability").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/disponibilite");
}
