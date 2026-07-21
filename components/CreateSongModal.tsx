"use client";

import { useState, useTransition } from "react";
import { createSong } from "@/app/(app)/repertoire/actions";
import { ChordProView } from "@/components/ChordProView";

const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function CreateSongModal() {
  const [open, setOpen] = useState(false);
  const [chords, setChords] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createSong(formData);
        setOpen(false);
        setChords("");
      } catch (e: any) {
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
        + Ajouter un chant
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
            <h2 className="font-display text-lg font-semibold mb-4">
              Ajouter un chant
            </h2>

            <form action={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Titre
                </label>
                <input
                  name="title"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Gamme
                </label>
                <select
                  name="songKey"
                  defaultValue=""
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Gamme (optionnel)</option>
                  {keys.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs uppercase text-gray-500">
                    Paroles et accords
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Ex. : [G]Ta grâce me [D]suffit
                  </span>
                </div>
                <textarea
                  name="chords"
                  value={chords}
                  onChange={(e) => setChords(e.target.value)}
                  placeholder="[G]Ta grâce me [D]suffit"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm min-h-[110px] font-mono"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Les accords entre crochets sont optionnels — vous pouvez aussi ne
                  taper que les paroles.
                </p>
                {chords.trim() && (
                  <div className="mt-2 bg-gray-50 rounded-md p-3 overflow-x-auto">
                    <p className="text-[10px] uppercase text-gray-400 mb-1">Aperçu</p>
                    <ChordProView text={chords} />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Lien de référence
                </label>
                <input
                  name="referenceUrl"
                  placeholder="https://www.youtube.com/watch?v=…"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Reste uniquement dans Bercail.
                </p>
              </div>

              {error && <p className="text-sm text-danger">{error}</p>}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="text-sm border border-gray-300 rounded-md px-3 py-2"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="bg-accent text-white text-sm rounded-md px-3 py-2 disabled:opacity-60"
                >
                  {pending ? "Ajout…" : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
