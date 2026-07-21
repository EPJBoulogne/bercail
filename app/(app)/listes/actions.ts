"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createSetlist(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const name = formData.get("name") as string;
  const eventId = (formData.get("eventId") as string) || null;
  const leadId = (formData.get("leadId") as string) || null;
  const songIds = formData.getAll("songIds") as string[];

  if (!name || songIds.length === 0) {
    throw new Error("Le nom et au moins un chant sont requis.");
  }

  const { data: setlist, error } = await supabase
    .from("setlists")
    .insert({ name, event_id: eventId, lead_id: leadId, created_by: user.id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { data: songs } = await supabase
    .from("songs")
    .select("id, song_key")
    .in("id", songIds);
  const keyMap = new Map((songs ?? []).map((s) => [s.id, s.song_key]));

  const items = songIds.map((songId, i) => ({
    setlist_id: setlist.id,
    song_id: songId,
    position: i,
    song_key: keyMap.get(songId) || "C",
  }));
  const { error: itemsError } = await supabase.from("setlist_items").insert(items);
  if (itemsError) throw new Error(itemsError.message);

  revalidatePath("/listes");
  redirect(`/listes/${setlist.id}`);
}

export async function reorderSetlistItems(setlistId: string, orderedItemIds: string[]) {
  const supabase = await createClient();

  await Promise.all(
    orderedItemIds.map((id, i) =>
      supabase.from("setlist_items").update({ position: i }).eq("id", id)
    )
  );

  revalidatePath(`/listes/${setlistId}`);
}

export async function updateItemKey(itemId: string, setlistId: string, key: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("setlist_items")
    .update({ song_key: key })
    .eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/listes/${setlistId}`);
}
