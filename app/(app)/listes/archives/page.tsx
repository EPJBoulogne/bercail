import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SongOccurrencesFilter } from "./SongOccurrencesFilter";

export default async function ArchivesPage({
  searchParams,
}: {
  searchParams: {
    tab?: string;
    dateFrom?: string;
    dateTo?: string;
    lead?: string;
    q?: string;
    key?: string;
  };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tab = searchParams.tab === "songs" ? "songs" : "lists";

  const { data: allSetlists } = await supabase
    .from("setlists")
    .select(
      "id, name, event_id, events(title, date), lead_id, profiles!setlists_lead_id_fkey(name), setlist_items(id, song_key, songs(title))"
    )
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);
  const archived = (allSetlists ?? []).filter((s: any) => s.events && s.events.date < today);

  // ---- Onglet "Par liste" ----
  const dateFrom = searchParams.dateFrom ?? "";
  const dateTo = searchParams.dateTo ?? "";
  const leadFilter = searchParams.lead ?? "";

  const leadOptions = Array.from(
    new Map(
      archived
        .filter((s: any) => s.lead_id)
        .map((s: any) => [s.lead_id, s.profiles?.name])
    ).entries()
  );

  const filteredLists = archived.filter((s: any) => {
    if (dateFrom && s.events.date < dateFrom) return false;
    if (dateTo && s.events.date > dateTo) return false;
    if (leadFilter && s.lead_id !== leadFilter) return false;
    return true;
  });

  // ---- Onglet "Par chant" ----
  const songRows = archived.flatMap((s: any) =>
    (s.setlist_items ?? []).map((item: any) => ({
      songTitle: item.songs?.title ?? "",
      key: item.song_key,
      listName: s.name,
      eventDate: s.events?.date,
      leadName: s.profiles?.name ?? null,
      leadId: s.lead_id,
    }))
  );

  const keyOptions = Array.from(new Set(songRows.map((r) => r.key))).sort();

  function tabHref(t: string) {
    return `/listes/archives?tab=${t}`;
  }

  return (
    <div className="p-6 md:p-8">
      <Breadcrumb
        items={[
          { label: "Tableau de bord", href: "/" },
          { label: "Listes", href: "/listes" },
          { label: "Archives" },
        ]}
      />
      <Link href="/listes" className="text-sm text-gray-500 mb-4 inline-block">
        ‹ Retour aux listes
      </Link>
      <h1 className="font-display text-xl font-semibold mb-1">Archives</h1>
      <p className="text-sm text-gray-500 mb-6">
        Parcourez par culte, ou cherchez un chant précis à travers l&apos;historique.
      </p>

      <div className="flex gap-2 mb-6">
        <Link
          href={tabHref("lists")}
          className={`text-sm rounded-md px-3 py-1.5 ${
            tab === "lists" ? "bg-accent text-white" : "border border-gray-300"
          }`}
        >
          Par liste
        </Link>
        <Link
          href={tabHref("songs")}
          className={`text-sm rounded-md px-3 py-1.5 ${
            tab === "songs" ? "bg-accent text-white" : "border border-gray-300"
          }`}
        >
          Par chant
        </Link>
      </div>

      {tab === "lists" && (
        <>
          <form className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
            <input type="hidden" name="tab" value="lists" />
            <div>
              <label className="block text-[10px] uppercase text-gray-500 mb-1">Du</label>
              <input
                type="date"
                name="dateFrom"
                defaultValue={dateFrom}
                className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-gray-500 mb-1">Au</label>
              <input
                type="date"
                name="dateTo"
                defaultValue={dateTo}
                className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-gray-500 mb-1">Lead</label>
              <select
                name="lead"
                defaultValue={leadFilter}
                className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
              >
                <option value="">Tous les leads</option>
                {leadOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <button className="text-sm border border-gray-300 rounded-md px-3 py-1.5">
              Filtrer
            </button>
            <Link href={tabHref("lists")} className="text-sm text-accent">
              Réinitialiser
            </Link>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredLists.map((s: any) => (
              <Link
                key={s.id}
                href={`/listes/${s.id}`}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:border-accent"
              >
                <strong className="text-sm">{s.name}</strong>
                <p className="text-xs text-gray-500 mt-2">
                  {s.setlist_items?.length ?? 0} chant(s) · {s.events.title} — {s.events.date}
                  {s.profiles && ` · Lead : ${s.profiles.name}`}
                </p>
              </Link>
            ))}
            {filteredLists.length === 0 && (
              <p className="text-sm text-gray-500">Aucune liste ne correspond à ces critères.</p>
            )}
          </div>
        </>
      )}

      {tab === "songs" && (
        <SongOccurrencesFilter rows={songRows} keyOptions={keyOptions} leadOptions={leadOptions} />
      )}
    </div>
  );
}
