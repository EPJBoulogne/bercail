"use client";

import { useState, useTransition } from "react";
import { updateUser } from "./actions";

const roleLabel: Record<string, string> = {
  admin: "Administrateur",
  dept_manager: "Responsable de département",
  member: "Membre",
};

type Department = { id: string; name: string };

export function UserDetailSection({
  userId,
  name,
  email,
  phone,
  systemRole,
  status,
  departments,
  memberDeptIds,
}: {
  userId: string;
  name: string;
  email: string;
  phone: string | null;
  systemRole: string;
  status: string;
  departments: Department[];
  memberDeptIds: string[];
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // État local pour que la vue en lecture reflète tout de suite le
  // dernier enregistrement, sans attendre un rechargement complet.
  const [current, setCurrent] = useState({ name, phone, systemRole, memberDeptIds });

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateUser(formData);
        setCurrent({
          name: formData.get("name") as string,
          phone: (formData.get("phone") as string) || null,
          systemRole: formData.get("systemRole") as string,
          memberDeptIds: formData.getAll("departmentIds") as string[],
        });
        setEditing(false);
      } catch (e: any) {
        setError(e.message ?? "Une erreur est survenue.");
      }
    });
  }

  if (!editing) {
    const currentDepts = departments.filter((d) => current.memberDeptIds.includes(d.id));
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Informations</h2>
          <button
            onClick={() => setEditing(true)}
            className="bg-accent text-white text-sm rounded-md px-3 py-1.5"
          >
            Modifier
          </button>
        </div>
        <dl className="space-y-3">
          <div>
            <dt className="text-[10px] uppercase text-gray-400">Nom complet</dt>
            <dd className="text-sm">{current.name}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-gray-400">Email</dt>
            <dd className="text-sm">{email}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-gray-400">Téléphone</dt>
            <dd className="text-sm">{current.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-gray-400">Rôle système</dt>
            <dd className="text-sm">
              <span className="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                {roleLabel[current.systemRole] ?? current.systemRole}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase text-gray-400">Départements</dt>
            <dd className="text-sm">
              {currentDepts.length > 0
                ? currentDepts.map((d) => d.name).join(", ")
                : "Aucun"}
            </dd>
          </div>
        </dl>
        {status !== "active" && (
          <p className="text-xs text-warning mt-3">
            Statut actuel : {status === "pending" ? "en attente" : "refusé"} — passez
            par « Comptes en attente » pour l&apos;activer.
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 max-w-lg">
      <input type="hidden" name="id" value={userId} />
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
            defaultValue={current.name}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1">
            Téléphone
          </label>
          <input
            name="phone"
            defaultValue={current.phone ?? ""}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1">
            Rôle système
          </label>
          <select
            name="systemRole"
            defaultValue={current.systemRole}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="member">Membre</option>
            <option value="dept_manager">Responsable de département</option>
            <option value="admin">Administrateur</option>
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-2">
            Départements
          </label>
          <div className="border border-gray-200 rounded-lg p-2 space-y-1">
            {departments.map((d) => (
              <label key={d.id} className="flex items-center gap-2 text-sm px-1 py-1">
                <input
                  type="checkbox"
                  name="departmentIds"
                  value={d.id}
                  defaultChecked={current.memberDeptIds.includes(d.id)}
                />
                {d.name}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </form>
  );
}
