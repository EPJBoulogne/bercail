"use client";

import { useState, useTransition } from "react";
import { reorderSetlistItems, updateItemKey } from "./actions";

const keys = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

type Item = {
  id: string;
  song_key: string;
  songs: { id: string; title: string } | null;
};

export function SetlistItemsEditor({
  setlistId,
  initialItems,
}: {
  setlistId: string;
  initialItems: Item[];
}) {
  const [items, setItems] = useState(initialItems);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

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

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">
        Glissez-déposez pour réordonner — la gamme est propre à cette liste.
      </p>
      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {items.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDraggedId(item.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(item.id)}
            className="flex items-center justify-between px-3 py-2.5 cursor-grab"
          >
            <span className="text-sm">⠿ {item.songs?.title}</span>
            <select
              value={item.song_key}
              onChange={(e) => handleKeyChange(item.id, e.target.value)}
              className="text-xs border border-gray-300 rounded-md px-1.5 py-1 font-mono"
            >
              {keys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-gray-500 px-3 py-2.5">Aucun chant dans cette liste.</p>
        )}
      </div>
    </div>
  );
}
