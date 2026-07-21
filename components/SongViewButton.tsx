"use client";

import { useState } from "react";
import { ChordProView } from "@/components/ChordProView";

export function SongViewButton({
  title,
  chords,
  referenceUrl,
}: {
  title: string;
  chords: string | null;
  referenceUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  if (!chords) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5"
      >
        Voir les accords
      </button>
      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 overflow-y-auto">
              <h2 className="font-display text-lg font-semibold mb-4">{title}</h2>
              <div className="bg-gray-50 rounded-md p-3 mb-4 overflow-x-auto">
                <ChordProView text={chords} />
              </div>
              <div className="flex justify-end gap-2">
                {referenceUrl && (
                  <a href={referenceUrl} target="_blank" rel="noopener noreferrer">
                    <button className="text-sm border border-gray-300 rounded-md px-3 py-2">
                      Ouvrir la référence ↗
                    </button>
                  </a>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="bg-accent text-white text-sm rounded-md px-3 py-2"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
