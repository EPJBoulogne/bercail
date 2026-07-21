"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { stripChordPro } from "@/lib/chordpro";
import { convertPortailTextToChordPro } from "@/lib/portailSync";

export async function createSong(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const title = formData.get("title") as string;
  const songKey = (formData.get("songKey") as string) || null;
  const chords = (formData.get("chords") as string) || "";
  const referenceUrl = (formData.get("referenceUrl") as string) || null;

  if (!title) throw new Error("Le titre est requis.");

  const lyrics = stripChordPro(chords).trim() || null;

  const { error } = await supabase.from("songs").insert({
    title,
    song_key: songKey,
    chords: chords || null,
    lyrics,
    reference_url: referenceUrl,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/repertoire");
}

export async function updateReferenceUrl(formData: FormData) {
  const supabase = await createClient();
  const songId = formData.get("songId") as string;
  const referenceUrl = (formData.get("referenceUrl") as string) || null;

  const { error } = await supabase
    .from("songs")
    .update({ reference_url: referenceUrl })
    .eq("id", songId);

  if (error) throw new Error(error.message);
  revalidatePath("/repertoire");
}

type PortailSong = {
  ref: string | number;
  name: string;
  note: string | null;
  text: string;
};

export async function syncFromPortail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté.");

  const url = process.env.PORTAIL_API_URL;
  const token = process.env.PORTAIL_API_TOKEN;
  if (!url || !token) {
    throw new Error(
      "Synchronisation non configurée (PORTAIL_API_URL / PORTAIL_API_TOKEN manquants)."
    );
  }

  let response: Response;
  try {
    response = await fetch(`${url}?token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
  } catch {
    throw new Error("Impossible de contacter portail.yt.");
  }
  if (!response.ok) {
    throw new Error(`portail.yt a répondu une erreur (${response.status}).`);
  }

  const data: { songs: PortailSong[] } = await response.json();

  // On ne modifie jamais un chant déjà présent (identifié par son
  // portail_ref) : seuls les chants encore inconnus sont importés,
  // pour ne jamais écraser une édition faite localement dans Bercail.
  const { data: existing } = await supabase
    .from("songs")
    .select("portail_ref")
    .not("portail_ref", "is", null);
  const knownRefs = new Set((existing ?? []).map((s) => s.portail_ref));

  const toInsert = data.songs
    .filter((s) => !knownRefs.has(Number(s.ref)))
    .map((s) => {
      const chords = convertPortailTextToChordPro(s.text);
      return {
        title: s.name,
        song_key: s.note || null,
        chords,
        lyrics: stripChordPro(chords).trim() || null,
        portail_ref: Number(s.ref),
        created_by: user.id,
      };
    });

  if (toInsert.length > 0) {
    const { error } = await supabase.from("songs").insert(toInsert);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/repertoire");
  return { imported: toInsert.length, skipped: data.songs.length - toInsert.length };
}
