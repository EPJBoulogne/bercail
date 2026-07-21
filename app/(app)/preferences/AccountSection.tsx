"use client";

import { useState, useTransition } from "react";
import { updateAccount } from "./actions";

export function AccountSection({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const result = await updateAccount(formData);
        setMessage(
          result?.emailChangeRequested
            ? "Enregistré. Un email de confirmation a été envoyé à la nouvelle adresse — le changement ne sera effectif qu'une fois le lien cliqué."
            : "Enregistré."
        );
        setEditing(false);
      } catch (e: any) {
        setError(e.message ?? "Une erreur est survenue.");
      }
    });
  }

  if (!editing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Informations</h2>
          <button
            onClick={() => {
              setMessage(null);
              setEditing(true);
            }}
            className="bg-accent text-white text-sm rounded-md px-3 py-1.5"
          >
            Modifier
          </button>
        </div>
        <dl className="space-y-3">
          <div>
            <dt className="text-[10px] uppercase text-gray-400">Nom complet</dt>
            <dd className="text-sm">{name}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-gray-400">Email</dt>
            <dd className="text-sm">{email}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-gray-400">Téléphone</dt>
            <dd className="text-sm">{phone || "—"}</dd>
          </div>
        </dl>
        {message && <p className="text-sm text-success mt-3">{message}</p>}
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold">Informations</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={pending}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={pending}
            className="bg-accent text-white text-sm rounded-md px-3 py-1.5 disabled:opacity-60"
          >
            {pending ? "…" : "Enregistrer"}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1">
            Nom complet
          </label>
          <input
            name="name"
            defaultValue={name}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={email}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Changer cette adresse envoie un email de confirmation avant que ce soit effectif.
          </p>
        </div>
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1">Téléphone</label>
          <input
            name="phone"
            type="tel"
            defaultValue={phone ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </form>
  );
}
