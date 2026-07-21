"use client";

import { useState, useTransition, useMemo } from "react";
import { createSetlist } from "@/app/(app)/listes/actions";

type Song = { id: string; title: string; song_key: string | null };
type EventOption = { id: string; title: string; date: string };
type Member = { id: string; name: string };

export function CreateSetlistWizard({
  songs,
  events,
  members,
}: {
  songs: Song[];
  events: EventOption[];
  members: Member[];
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]); // ordre de sélection
  const [eventId, setEventId] = useState("");
  const [leadId, setLeadId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filteredSongs = useMemo(
    () => songs.filter((s) => s.title.toLowerCase().includes(search.toLowerCase())),
    [songs, search]
  );

  function toggleSong(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function reset() {
    setStep(1);
    setName("");
    setSearch("");
    setSelected([]);
    setEventId("");
    setLeadId("");
    setError(null);
  }

  function handleSubmit() {
    setError(null);
    const formData = new FormData();
    formData.set("name", name || "Liste sans titre");
    formData.set("eventId", eventId);
    formData.set("leadId", leadId);
    selected.forEach((id) => formData.append("songIds", id));

    startTransition(async () => {
      try {
        await createSetlist(formData);
        setOpen(false);
        reset();
      } catch (e: any) {
        if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e;
        setError(e.message ?? "Une erreur est survenue.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-accent text-white text-sm rounded-md px-4 py-2"
      >
        + Créer une liste
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
            {step === 1 && (
              <>
                <h2 className="font-display text-lg font-semibold mb-1">
                  Créer une liste — étape 1/2
                </h2>
                <p className="text-xs text-gray-500 mb-4">Choisissez les chants.</p>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom de la liste"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-3"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un chant…"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
                />
                <div className="border border-gray-200 rounded-md p-2 max-h-56 overflow-y-auto space-y-1">
                  {filteredSongs.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm py-1">
                      <input
                        type="checkbox"
                        checked={selected.includes(s.id)}
                        onChange={() => toggleSong(s.id)}
                      />
                      {s.title}
                      {s.song_key && (
                        <span className="text-gray-400 font-mono text-xs">
                          — {s.song_key}
                        </span>
                      )}
                    </label>
                  ))}
                  {filteredSongs.length === 0 && (
                    <p className="text-xs text-gray-500">Aucun chant.</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => setOpen(false)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-2"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => selected.length > 0 && setStep(2)}
                    disabled={selected.length === 0}
                    className="bg-accent text-white text-sm rounded-md px-3 py-2 disabled:opacity-60"
                  >
                    Suivant ({selected.length})
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-display text-lg font-semibold mb-1">
                  Créer une liste — étape 2/2
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  Rattacher à un événement et désigner un lead (facultatifs).
                </p>

                <div className="mb-3">
                  <label className="block text-xs uppercase text-gray-500 mb-1">
                    Événement
                  </label>
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Aucun événement</option>
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} — {ev.date}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-xs uppercase text-gray-500 mb-1">
                    Lead
                  </label>
                  <select
                    value={leadId}
                    onChange={(e) => setLeadId(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">Aucun lead assigné</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                {error && <p className="text-sm text-danger mb-2">{error}</p>}

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-2"
                  >
                    ‹ Précédent
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={pending}
                    className="bg-accent text-white text-sm rounded-md px-3 py-2 disabled:opacity-60"
                  >
                    {pending ? "Création…" : "Créer la liste"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
