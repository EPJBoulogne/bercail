"use client";

import { useState, useTransition } from "react";
import { createDepartment } from "@/app/(app)/admin/departments/new/actions";

export function CreateDepartmentModal() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createDepartment(formData);
        setOpen(false);
      } catch (e: any) {
        setError(e.message ?? "Une erreur est survenue.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-accent text-white text-sm rounded-md px-4 py-2 h-fit"
      >
        + Créer un département
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 w-full max-w-sm"
          >
            <h2 className="font-display text-lg font-semibold mb-4">
              Créer un département
            </h2>

            <form action={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Nom
                </label>
                <input
                  name="name"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Couleur
                </label>
                <select
                  name="color"
                  defaultValue="accent"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="accent">Indigo</option>
                  <option value="success">Vert</option>
                  <option value="warning">Ambre</option>
                  <option value="danger">Rouge</option>
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="isWorship" />
                Débloque le Répertoire/Listes pour ses membres
              </label>

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
                  {pending ? "Création…" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
