"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createEvent(formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const departmentId = formData.get("departmentId") as string;
  const recurrence = formData.get("recurrence") as string;
  const inviteeIds = formData.getAll("inviteeIds") as string[];

  if (!title || !date || !departmentId) throw new Error("Champs requis manquants.");

  const stepDays: Record<string, number> = { weekly: 7, biweekly: 14, monthly: 30 };
  const occurrenceCount: Record<string, number> = {
    none: 1,
    weekly: 10,
    biweekly: 10,
    monthly: 6,
  };
  const count = occurrenceCount[recurrence] ?? 1;
  const recurGroup = recurrence !== "none" ? crypto.randomUUID() : null;

  let current = new Date(`${date}T00:00:00`);

  for (let i = 0; i < count; i++) {
    const iso = current.toISOString().slice(0, 10);

    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        title,
        date: iso,
        department_id: departmentId,
        recur_group: recurGroup,
      })
      .select("id")
      .single();

    if (eventError) throw new Error(eventError.message);

    if (inviteeIds.length > 0) {
      const rows = inviteeIds.map((userId) => ({
        event_id: event.id,
        user_id: userId,
        status: "invited",
        role_id: (formData.get(`role_${userId}`) as string) || null,
      }));
      const { error: assignError } = await supabase.from("event_assignments").insert(rows);
      if (assignError) throw new Error(assignError.message);
    }

    if (recurrence === "none") break;
    current.setDate(current.getDate() + stepDays[recurrence]);
  }

  revalidatePath("/calendrier");
  revalidatePath("/");
}

export async function respondToAssignment(formData: FormData) {
  const supabase = await createClient();
  const assignmentId = formData.get("assignmentId") as string;
  const status = formData.get("status") as string;

  const { error } = await supabase
    .from("event_assignments")
    .update({ status })
    .eq("id", assignmentId);

  if (error) throw new Error(error.message);
  revalidatePath("/calendrier");
  revalidatePath("/");
}

export async function proposeSelf(formData: FormData) {
  const supabase = await createClient();
  const eventId = formData.get("eventId") as string;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const { error } = await supabase
    .from("event_assignments")
    .insert({ event_id: eventId, user_id: user.id, status: "proposed" });

  if (error) throw new Error(error.message);
  revalidatePath("/calendrier");
  revalidatePath("/");
}

export async function inviteMember(formData: FormData) {
  const supabase = await createClient();
  const eventId = formData.get("eventId") as string;
  const userId = formData.get("userId") as string;
  if (!userId) return;

  const { error } = await supabase
    .from("event_assignments")
    .insert({ event_id: eventId, user_id: userId, status: "invited" });

  if (error) throw new Error(error.message);
  revalidatePath("/calendrier");
  revalidatePath("/");
}

export async function setAssignmentRole(formData: FormData) {
  const supabase = await createClient();
  const assignmentId = formData.get("assignmentId") as string;
  const roleId = formData.get("roleId") as string;

  const { error } = await supabase
    .from("event_assignments")
    .update({ role_id: roleId || null })
    .eq("id", assignmentId);

  if (error) throw new Error(error.message);
  revalidatePath("/calendrier");
  revalidatePath("/");
}