"use client";

import { useState, useTransition, useRef } from "react";
import { reorderSetlistItems, updateItemKey, deleteSetlistItem, addSongsToSetlist } from "./actions";
import { SongViewButton } from "@/components/SongViewButton";
import { AddSongsToSetlistModal } from "./AddSongsToSetlistModal";

const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const UNDO_DELAY = 5000;

type Item = {
  id: string;
  song_key: string;
  songs: { id: string; title: string; chords: string | null; reference_url: string | null; portail_ref: number | null } | null;
};

type AllSong = {
  id: string;
  title: string;
  song_key: string | null;
  lyrics: string | null;
  chords: string | null;
  reference_url: string | null;
  portail_ref: number | null;
};

export function SetlistItemsEditor({
  setlistId,
  initialItems,
  allSongs,
}: {
  setlistId: string;
  initialItems: Item[];
  allSongs: AllSong[];
}) {
  const [items, setItems] = useState(initialItems);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [, startTransition] = useTransition();

  const [pendingDelete, setPendingDelete] = useState<{ item: Item; index: number } | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) return;
    const next = [...items];
    const fromIndex = next.findIndex((i) => i.id === draggedId);
    const toIndex = next.findIndex((i) => i.id === targetId);
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    setItems(next);
    setDraggedId(null);
    startTransition(() => {
      reorderSetlistItems(setlistId, next.map((i) => i.id));
    });
  }

  function handleKeyChange(itemId: string, key: string) {
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, song_key: key } : i)));
    startTransition(() => {
      updateItemKey(itemId, setlistId, key);
    });
  }

  function handleDeleteClick(item: Item) {
    const index = items.findIndex((i) => i.id === item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    setPendingDelete({ item, index });

    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    deleteTimerRef.current = setTimeout(() => {
      startTransition(() => {
        deleteSetlistItem(item.id, setlistId);
      });
      setPendingDelete(null);
    }, UNDO_DELAY);
  }

  function handleUndo() {
    if (!pendingDelete) return;
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    setItems((prev) => {
      const next = [...prev];
      next.splice(pendingDelete.index, 0, pendingDelete.item);
      return next;
    });
    setPendingDelete(null);
  }

  async function handleAddSongs(songIds: string[]) {
    const inserted = await addSongsToSetlist(setlistId, songIds);
    const newItems: Item[] = inserted.map((row: any) => {
      const song = allSongs.find((s) => s.id === row.song_id);
      return {
        id: row.id,
        song_key: row.song_key,
        songs: song
          ? {
              id: song.id,
              title: song.title,
              chords: song.chords,
              reference_url: song.reference_url,
              portail_ref: song.portail_ref,
            }
          : null,
      };
    });
    setItems((prev) => [...prev, ...newItems]);
    setAddModalOpen(false);
  }

  const existingSongIds = items.map((i) => i.songs?.id).filter(Boolean) as string[];

  return (
    <div>
      <p className="text-xs text-gray-400 mb-2">Glisser pour réordonner</p>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 mb-6 overflow-hidden">
        {items.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDraggedId(item.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(item.id)}
            className="flex items-center gap-2 px-3 py-2.5 cursor-grab"
          >
            <span className="text-gray-300 text-sm flex-shrink-0">⠿</span>
            <span className="text-sm min-w-0 flex-1 truncate">{item.songs?.title}</span>
            <select
              value={item.song_key}
              onChange={(e) => handleKeyChange(item.id, e.target.value)}
              className="text-xs border border-gray-300 rounded-md px-1.5 py-1 font-mono flex-shrink-0"
            >
              {keys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
            {item.songs?.chords && (
              <SongViewButton
                songId={item.songs.id}
                title={item.songs.title}
                chords={item.songs.chords}
                referenceUrl={item.songs.reference_url}
                portailRef={item.songs.portail_ref}
              />
            )}
            <button
              onClick={() => handleDeleteClick(item)}
              aria-label="Retirer ce chant"
              title="Retirer ce chant"
              className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-danger flex-shrink-0"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          onClick={() => setAddModalOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-gold-dark bg-gold-soft hover:bg-gold-soft/80"
        >
          <span className="w-5 h-5 rounded border border-dashed border-gold flex items-center justify-center text-gold-dark flex-shrink-0">
            +
          </span>
          Ajouter un chant
        </button>
      </div>

      {pendingDelete && (
        <div className="mb-6 flex items-center justify-between bg-gray-800 text-white text-sm rounded-md px-3 py-2 -mt-3">
          <span>« {pendingDelete.item.songs?.title} » retiré</span>
          <button onClick={handleUndo} className="underline text-accent-soft">
            Annuler
          </button>
        </div>
      )}

      <AddSongsToSetlistModal
        setlistId={setlistId}
        allSongs={allSongs}
        existingSongIds={existingSongIds}
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddSongs}
      />
    </div>
  );
}