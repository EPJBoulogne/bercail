"use client";

import { useState, useMemo, useTransition } from "react";
import { normalizeSearch } from "@/lib/normalizeSearch";

type Song = { id: string; title: string; song_key: string | null; lyrics: string | null };

export function AddSongsToSetlistModal({
  setlistId,
  allSongs,
  existingSongIds,
  open,
  onClose,
  onAdd,
}: {
  setlistId: string;
  allSongs: Song[];
  existingSongIds: string[];
  open: boolean;
  onClose: () => void;
  onAdd: (songIds: string[]) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  const availableSongs = useMemo(
    () => allSongs.filter((s) => !existingSongIds.includes(s.id)),
    [allSongs, existingSongIds]
  );

  const { titleMatches, lyricsMatches } = useMemo(() => {
    const q = normalizeSearch(search);
    if (!q) return { titleMatches: availableSongs, lyricsMatches: [] as Song[] };

    const titleMatches = availableSongs.filter((s) => normalizeSearch(s.title).includes(q));
    const titleMatchIds = new Set(titleMatches.map((s) => s.id));
    const lyricsMatches =
      q.trim().split(/\s+/).length >= 2
        ? availableSongs.filter(
            (s) => !titleMatchIds.has(s.id) && s.lyrics && normalizeSearch(s.lyrics).includes(q)
          )
        : [];

    return { titleMatches, lyricsMatches };
  }, [availableSongs, search]);

  function toggleSong(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    startTransition(async () => {
      await onAdd(selected);
      setSearch("");
      setSelected([]);
    });
  }

  function renderCheckbox(s: Song) {
    return (
      <label key={s.id} className="flex items-center gap-2 text-sm py-1">
        <input
          type="checkbox"
          checked={selected.includes(s.id)}
          onChange={() => toggleSong(s.id)}
        />
        {s.title}
        {s.song_key && (
          <span className="text-gray-400 font-mono text-xs">— {s.song_key}</span>
        )}
      </label>
    );
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={() => !pending && onClose()}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        <h2 className="font-display text-lg font-semibold mb-4">Ajouter des chants</h2>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un chant, ou une phrase des paroles…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
        />
        <div className="border border-gray-200 rounded-md p-2 max-h-56 overflow-y-auto space-y-1">
          {titleMatches.map(renderCheckbox)}
          {titleMatches.length === 0 && lyricsMatches.length === 0 && (
            <p className="text-xs text-gray-500">Aucun chant disponible.</p>
          )}
        </div>

        {lyricsMatches.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] uppercase text-gray-400 mb-1">
              Aussi trouvé dans les paroles de…
            </p>
            <div className="border border-gray-200 rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
              {lyricsMatches.map(renderCheckbox)}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <button
            onClick={onClose}
            className="text-sm border border-gray-300 rounded-md px-3 py-2"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={selected.length === 0 || pending}
            className="bg-accent text-white text-sm rounded-md px-3 py-2 disabled:opacity-60"
          >
            {pending ? "Ajout…" : `Ajouter (${selected.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}