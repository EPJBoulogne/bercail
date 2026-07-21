"use client";

import { useState, useTransition } from "react";
import { updateAccount } from "./actions";

export function AccountForm({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await updateAccount(formData);
        setMessage(
          result?.emailChangeRequested
            ? "Enregistré. Un email de confirmation a été envoyé à la nouvelle adresse — le changement ne sera effectif qu'une fois le lien cliqué."
            : "Enregistré."
        );
      } catch (e: any) {
        setError(e.message ?? "Une erreur est survenue.");
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4 max-w-sm">
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
