"use client";

import { useState, useTransition, useMemo } from "react";
import { createEvent } from "@/app/(app)/calendrier/actions";

type Member = { id: string; name: string };
type Role = { id: string; title: string };
type Department = { id: string; name: string; members: Member[]; roles: Role[] };

export function CreateEventModal({
  departments,
  defaultDate,
}: {
  departments: Department[];
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const department = departments.find((d) => d.id === departmentId);
  const filteredMembers = useMemo(() => {
    if (!department) return [];
    return department.members.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [department, search]);

  function toggleAll(state: boolean) {
    if (!department) return;
    setChecked(state ? new Set(department.members.map((m) => m.id)) : new Set());
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createEvent(formData);
        setOpen(false);
        setChecked(new Set());
        setSearch("");
      } catch (e: any) {
        setError(e.message ?? "Une erreur est survenue.");
      }
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-accent text-white text-sm rounded-md px-4 py-2"
      >
        + Créer un événement
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
            <h2 className="font-display text-lg font-semibold mb-4">
              Créer un événement
            </h2>

            <form action={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Titre
                </label>
                <input
                  name="title"
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Date
                </label>
                <input
                  name="date"
                  type="date"
                  defaultValue={defaultDate}
                  required
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Département
                </label>
                <select
                  name="departmentId"
                  value={departmentId}
                  onChange={(e) => {
                    setDepartmentId(e.target.value);
                    setChecked(new Set());
                  }}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">
                  Récurrence
                </label>
                <select
                  name="recurrence"
                  defaultValue="none"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="none">Ne se répète pas</option>
                  <option value="weekly">Toutes les semaines</option>
                  <option value="biweekly">Toutes les 2 semaines</option>
                  <option value="monthly">Tous les mois</option>
                </select>
              </div>

              <div>
                <p className="text-xs uppercase text-gray-500 mb-1">
                  Participants (membres du département)
                </p>
                <input
                  placeholder="Rechercher un nom…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-2"
                />
                <label className="flex items-center gap-2 text-xs mb-2">
                  <input
                    type="checkbox"
                    checked={department ? checked.size === department.members.length && department.members.length > 0 : false}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                  Tout sélectionner / désélectionner
                </label>
                <div className="border border-gray-200 rounded-md p-2 max-h-40 overflow-y-auto space-y-1">
                  {filteredMembers.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm flex-1">
                        <input
                          type="checkbox"
                          name="inviteeIds"
                          value={m.id}
                          checked={checked.has(m.id)}
                          onChange={(e) => {
                            const next = new Set(checked);
                            if (e.target.checked) next.add(m.id);
                            else next.delete(m.id);
                            setChecked(next);
                          }}
                        />
                        {m.name}
                      </label>
                      {checked.has(m.id) && department && department.roles.length > 0 && (
                        <select
                          name={`role_${m.id}`}
                          defaultValue=""
                          className="text-xs border border-gray-300 rounded-md px-1.5 py-1"
                        >
                          <option value="">Aucun rôle</option>
                          {department.roles.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.title}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                  {filteredMembers.length === 0 && (
                    <p className="text-xs text-gray-500">Aucun membre.</p>
                  )}
                </div>
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