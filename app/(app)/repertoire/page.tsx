import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateSongModal } from "@/components/CreateSongModal";
import { SyncButton } from "@/components/SyncButton";
import { SongList } from "./SongList";

export default async function RepertoirePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: me } = await supabase
    .from("profiles")
    .select("system_role")
    .eq("id", user.id)
    .single();
  const canSync = me?.system_role === "admin";

  const { data: songs } = await supabase
    .from("songs")
    .select("id, title, song_key, chords, lyrics, reference_url")
    .order("title");

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold mb-1">Répertoire</h1>
          <p className="text-sm text-gray-500">Réservé aux membres du département Louange.</p>
        </div>
        <CreateSongModal />
      </div>

      {canSync && <SyncButton />}

      <SongList songs={songs ?? []} />
    </div>
  );
}
