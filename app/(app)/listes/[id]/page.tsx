import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SetlistItemsEditor } from "../SetlistItemsEditor";
import { GenerateLyricsButton } from "@/components/GenerateLyricsButton";

export default async function SetlistDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: setlist } = await supabase
    .from("setlists")
    .select(
      "id, name, events(title, date), profiles!setlists_lead_id_fkey(name)"
    )
    .eq("id", id)
    .single();
  if (!setlist) notFound();

  const { data: items } = await supabase
    .from("setlist_items")
    .select("id, song_key, songs(id, title, lyrics)")
    .eq("setlist_id", id)
    .order("position");

  const event = (setlist as any).events;
  const lead = (setlist as any).profiles;
  const pdfItems = (items ?? []).map((i: any) => ({
    title: i.songs?.title ?? "",
    key: i.song_key,
    lyrics: i.songs?.lyrics ?? null,
  }));

  return (
    <div className="p-6 md:p-8 max-w-xl">
      <Link href="/listes" className="text-sm text-gray-500 mb-4 inline-block">
        ‹ Retour aux listes
      </Link>
      <h1 className="font-display text-xl font-semibold mb-4">{setlist.name}</h1>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-gray-500">
          {event ? `Rattachée à : ${event.title} — ${event.date}` : "Non rattachée à un événement"}
        </p>
        <p className="text-sm text-gray-500">
          Lead : {lead?.name ?? "Non renseigné"}
        </p>
      </div>

      <SetlistItemsEditor setlistId={setlist.id} initialItems={(items ?? []) as any} />

      <div className="mt-6">
        <GenerateLyricsButton setlistName={setlist.name} items={pdfItems} />
      </div>
    </div>
  );
}
