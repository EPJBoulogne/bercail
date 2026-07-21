"use client";

import { useState, useTransition } from "react";
import { updatePreferences } from "./actions";

type Department = { id: string; name: string };

export function PreferencesForm({
  remindersEnabled,
  defaultDepartmentId,
  departments,
}: {
  remindersEnabled: boolean;
  defaultDepartmentId: string | null;
  departments: Department[];
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await updatePreferences(formData);
        setMessage("Enregistré.");
      } catch (e: any) {
        setError(e.message ?? "Une erreur est survenue.");
      }
    });
  }

  return (
    <form
      action={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-4 max-w-sm space-y-4"
    >
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="remindersEnabled"
          defaultChecked={remindersEnabled}
        />
        Recevoir un rappel avant mes événements
      </label>

      <div>
        <label className="block text-xs uppercase text-gray-500 mb-1">
          Département par défaut
        </label>
        <select
          name="defaultDepartmentId"
          defaultValue={defaultDepartmentId ?? ""}
          disabled={departments.length === 0}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm disabled:opacity-60"
        >
          <option value="">Aucune préférence</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        {departments.length === 0 && (
          <p className="text-[11px] text-gray-400 mt-1">
            Rejoignez un département pour activer ce réglage.
          </p>
        )}
      </div>

      {message && <p className="text-sm text-success">{message}</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="bg-accent text-white text-sm rounded-md px-4 py-2 disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}
