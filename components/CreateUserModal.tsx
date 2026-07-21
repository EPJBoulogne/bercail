"use client";

import { useState, useTransition } from "react";
import { createUserByAdmin } from "@/app/(app)/admin/create-user/actions";

export function CreateUserModal({
  departments,
}: {
  departments: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createUserByAdmin(formData);
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
        + Créer un utilisateur
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => !pending && setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 w-full max-w-sm max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-display text-lg font-semibold mb-1">
              Créer un utilisateur
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Compte actif immédiatement, sans passer par la validation.
            </p>

            <form action={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Nom complet
                </label>
                <input
                  name="name"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Téléphone (optionnel)
                </label>
                <input
                  name="phone"
                  type="tel"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Rôle système
                </label>
                <select
                  name="systemRole"
                  defaultValue="member"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="member">Membre</option>
                  <option value="dept_manager">Responsable de département</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Département
                </label>
                <select
                  name="departmentId"
                  defaultValue=""
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Aucun département</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
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
                  {pending ? "Création…" : "Créer le compte"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
