import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateSetlistWizard } from "@/components/CreateSetlistWizard";

export default async function ListesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: allSetlists } = await supabase
    .from("setlists")
    .select("id, name, events(title, date), profiles!setlists_lead_id_fkey(name), setlist_items(count)")
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const setlists = (allSetlists ?? []).filter((s: any) => !s.events || s.events.date >= today);

  const { data: songs } = await supabase
    .from("songs")
    .select("id, title, song_key, lyrics, chords, reference_url, portail_ref")
    .order("title");
    
  const { data: events } = await supabase
    .from("events")
    .select("id, title, date")
    .gte("date", new Date().toISOString().slice(0, 10))
    .order("date");

  const { data: worshipDepts } = await supabase
    .from("departments")
    .select("id")
    .eq("is_worship", true);
  const worshipDeptIds = (worshipDepts ?? []).map((d) => d.id);

  const { data: memberRows } = await supabase
    .from("department_members")
    .select("profiles(id, name)")
    .in("department_id", worshipDeptIds.length ? worshipDeptIds : ["00000000-0000-0000-0000-000000000000"]);
  const members = (memberRows ?? []).map((m: any) => m.profiles).filter(Boolean);

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold mb-1">Listes</h1>
          <p className="text-sm text-gray-500">Vos listes de louange.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/listes/archives"
            className="text-sm border border-gray-300 rounded-md px-4 py-2 h-fit"
          >
            Voir les archives ›
          </Link>
          <CreateSetlistWizard songs={songs ?? []} events={events ?? []} members={members} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {setlists?.map((s: any) => (
          <Link
            key={s.id}
            href={`/listes/${s.id}`}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-accent"
          >
            <strong className="text-sm">{s.name}</strong>
            <p className="text-xs text-gray-500 mt-2">
              {s.setlist_items?.[0]?.count ?? 0} chant(s)
              {s.events && ` · ${s.events.title} — ${s.events.date}`}
              {s.profiles && ` · Lead : ${s.profiles.name}`}
            </p>
          </Link>
        ))}
        {setlists?.length === 0 && (
          <p className="text-sm text-gray-500">Aucune liste créée pour l&apos;instant.</p>
        )}
      </div>
    </div>
  );
}
