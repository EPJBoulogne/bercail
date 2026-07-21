"use client";

import { useState, useMemo } from "react";
import { SongViewButton } from "@/components/SongViewButton";
import { normalizeSearch } from "@/lib/normalizeSearch";

type Song = {
  id: string;
  title: string;
  song_key: string | null;
  chords: string | null;
  lyrics: string | null;
  reference_url: string | null;
};

function SongRow({ song }: { song: Song }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-sm">
        {song.title}
        {song.song_key && (
          <span className="text-gray-400 font-mono text-xs ml-2">— {song.song_key}</span>
        )}
      </span>
      <SongViewButton
        title={song.title}
        chords={song.chords}
        referenceUrl={song.reference_url}
      />
    </div>
  );
}

export function SongList({ songs }: { songs: Song[] }) {
  const [search, setSearch] = useState("");

  const { titleMatches, lyricsMatches } = useMemo(() => {
    const q = normalizeSearch(search);
    if (!q) return { titleMatches: songs, lyricsMatches: [] as Song[] };

    const titleMatches = songs.filter((s) => normalizeSearch(s.title).includes(q));
    const titleMatchIds = new Set(titleMatches.map((s) => s.id));
    // Une phrase distinctive retrouve le bon chant ; un mot isolé trop
    // courant ("Dieu", "gloire"...) noierait les résultats — on ne
    // cherche donc dans les paroles qu'à partir de quelques mots,
    // jamais sur un seul mot très fréquent dans ce type de répertoire.
    const lyricsMatches =
      q.trim().split(/\s+/).length >= 2
        ? songs.filter(
            (s) => !titleMatchIds.has(s.id) && s.lyrics && normalizeSearch(s.lyrics).includes(q)
          )
        : [];

    return { titleMatches, lyricsMatches };
  }, [songs, search]);

  return (
    <>
      <div className="relative w-full max-w-sm mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un chant, ou une phrase des paroles…"
          className="w-full rounded-md border border-gray-300 px-3 py-2 pr-8 text-sm"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Effacer la recherche"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {titleMatches.map((s) => (
          <SongRow key={s.id} song={s} />
        ))}
        {titleMatches.length === 0 && lyricsMatches.length === 0 && (
          <p className="text-sm text-gray-500 px-4 py-3">Aucun chant trouvé.</p>
        )}
      </div>

      {lyricsMatches.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase text-gray-400 mb-2">
            Aussi trouvé dans les paroles de…
          </p>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
            {lyricsMatches.map((s) => (
              <SongRow key={s.id} song={s} />
            ))}
          </div>
        </div>
      )}
    </>
  );
}
