"use client";

import { useState, useMemo } from "react";
import { normalizeSearch } from "@/lib/normalizeSearch";

type Row = {
  songTitle: string;
  key: string;
  listName: string;
  eventDate: string | null;
  leadName: string | null;
  leadId: string | null;
};

export function SongOccurrencesFilter({
  rows,
  keyOptions,
  leadOptions,
}: {
  rows: Row[];
  keyOptions: string[];
  leadOptions: [string, string][];
}) {
  const [search, setSearch] = useState("");
  const [keyFilter, setKeyFilter] = useState("");
  const [leadFilter, setLeadFilter] = useState("");

  const filtered = useMemo(() => {
    const q = normalizeSearch(search);
    return rows.filter((r) => {
      if (q && !normalizeSearch(r.songTitle).includes(q)) return false;
      if (keyFilter && r.key !== keyFilter) return false;
      if (leadFilter && r.leadId !== leadFilter) return false;
      return true;
    });
  }, [rows, search, keyFilter, leadFilter]);

  const hasFilters = search || keyFilter || leadFilter;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px] relative">
          <label className="block text-[10px] uppercase text-gray-500 mb-1">
            Recherche
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un chant…"
            className="w-full rounded-md border border-gray-300 px-2.5 py-1.5 pr-7 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-[26px] text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Gamme</label>
          <select
            value={keyFilter}
            onChange={(e) => setKeyFilter(e.target.value)}
            className="rounded-md border border-gray-300 px-2.5 py-1.5 text-sm"
          >
            <option value="">Toutes les gammes</option>
            {keyOptions.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Lead</label>
          <select
            value={leadFilter}
            onChange={(e) => setLeadFilter(e.target.value)}
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
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setKeyFilter("");
              setLeadFilter("");
            }}
            className="text-sm text-accent"
          >
            Réinitialiser
          </button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {filtered.map((r, i) => (
          <div key={i} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm">{r.songTitle}</span>
            <div className="flex items-center gap-3">
              <span className="text-[11px] bg-accent-soft text-accent rounded-full px-2 py-0.5">
                {r.key}
              </span>
              <span className="text-xs text-gray-500">
                {r.listName}
                {r.eventDate ? ` · ${r.eventDate}` : ""}
                {r.leadName ? ` · Lead : ${r.leadName}` : ""}
              </span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-500 px-4 py-3">Aucun résultat pour ces critères.</p>
        )}
      </div>
    </>
  );
}
