"use client";

import { useState, useTransition } from "react";
import { syncFromPortail } from "@/app/(app)/repertoire/actions";

export function SyncButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await syncFromPortail();
        setMessage(
          result.imported > 0
            ? `${result.imported} nouveau(x) chant(s) importé(s) depuis portail.yt (${result.skipped} déjà présents, ignorés).`
            : `Rien de nouveau — les ${result.skipped} chants du portail sont déjà dans Bercail.`
        );
      } catch (e: any) {
        setError(e.message ?? "Une erreur est survenue.");
      }
    });
  }

  return (
    <div className="mb-4">
      <button
        onClick={handleClick}
        disabled={pending}
        className="text-sm border border-gray-300 rounded-md px-3 py-2 disabled:opacity-60"
      >
        {pending ? "Synchronisation…" : "Synchroniser avec portail.yt"}
      </button>
      {message && <p className="text-sm text-success mt-2">{message}</p>}
      {error && <p className="text-sm text-danger mt-2">{error}</p>}
    </div>
  );
}
