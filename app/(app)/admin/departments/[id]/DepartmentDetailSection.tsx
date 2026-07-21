"use client";

import { useState, useTransition } from "react";
import {
  updateDepartment,
  addMember,
  removeMember,
  addRole,
  removeRole,
} from "./actions";

const colorClasses: Record<string, string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};
const colorLabels: Record<string, string> = {
  accent: "Indigo",
  success: "Vert",
  warning: "Ambre",
  danger: "Rouge",
};

type Member = { id: string; name: string; role: string };
type Role = { id: string; title: string; personName: string | null };
type Profile = { id: string; name: string };

export function DepartmentDetailSection({
  departmentId,
  name,
  color,
  isWorship,
  members,
  roles,
  allProfiles,
}: {
  departmentId: string;
  name: string;
  color: string;
  isWorship: boolean;
  members: Member[];
  roles: Role[];
  allProfiles: Profile[];
}) {
  // Un seul état d'édition pour toute la page : tant qu'on n'a pas cliqué
  // "Modifier", rien n'est cliquable nulle part (infos, membres, rôles).
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState({ name, color, isWorship });

  const candidates = allProfiles.filter((p) => !members.some((m) => m.id === p.id));

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await updateDepartment(formData);
        setCurrent({
          name: formData.get("name") as string,
          color: formData.get("color") as string,
          isWorship: formData.get("isWorship") === "on",
        });
        setEditing(false);
      } catch (e: any) {
        setError(e.message ?? "Une erreur est survenue.");
      }
    });
  }

  function runMemberOrRole(action: (fd: FormData) => Promise<void>, fd: FormData) {
    startTransition(async () => {
      try {
        await action(fd);
      } catch (e: any) {
        setError(e.message ?? "Une erreur est survenue.");
      }
    });
  }

  const candidateSelectId = `add-member-${departmentId}`;
  const roleTitleId = `new-role-title-${departmentId}`;
  const rolePersonId = `new-role-person-${departmentId}`;

  return (
    <form action={handleSubmit} className="max-w-2xl space-y-4">
      <input type="hidden" name="id" value={departmentId} />

      {/* Un seul contrôle Modifier / Annuler / Enregistrer pour toute la page. */}
      <div className="flex items-center justify-end gap-2">
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="bg-accent text-white text-sm rounded-md px-3 py-1.5"
          >
            Modifier
          </button>
        ) : (
          <>
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
          </>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {/* ---- Informations ---- */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-3">Informations</h2>
        {!editing ? (
          <dl className="space-y-3">
            <div>
              <dt className="text-[10px] uppercase text-gray-400">Nom</dt>
              <dd className="text-sm flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${colorClasses[current.color]}`} />
                {current.name}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase text-gray-400">Couleur</dt>
              <dd className="text-sm">{colorLabels[current.color]}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase text-gray-400">Répertoire/Listes</dt>
              <dd className="text-sm">{current.isWorship ? "Débloqué pour ses membres" : "Non"}</dd>
            </div>
          </dl>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">Nom</label>
              <input
                name="name"
                defaultValue={current.name}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-1">Couleur</label>
              <select
                name="color"
                defaultValue={current.color}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {Object.entries(colorLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isWorship" defaultChecked={current.isWorship} />
              Débloque le Répertoire/Listes pour ses membres
            </label>
          </div>
        )}
      </div>

      {/* ---- Membres ---- */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-3">Membres</h2>
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-3">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>{m.name}</span>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("departmentId", departmentId);
                    fd.set("userId", m.id);
                    runMemberOrRole(removeMember, fd);
                  }}
                  disabled={pending}
                  className="text-xs text-danger border border-danger rounded-md px-2 py-1"
                >
                  Retirer
                </button>
              )}
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-gray-500 px-3 py-2">Aucun membre.</p>
          )}
        </div>
        {editing && candidates.length > 0 && (
          <div className="flex gap-2">
            <select id={candidateSelectId} className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm">
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const select = document.getElementById(candidateSelectId) as HTMLSelectElement;
                const fd = new FormData();
                fd.set("departmentId", departmentId);
                fd.set("userId", select.value);
                runMemberOrRole(addMember, fd);
              }}
              disabled={pending}
              className="text-sm border border-gray-300 rounded-md px-3 py-2"
            >
              Ajouter
            </button>
          </div>
        )}
      </div>

      {/* ---- Rôles ---- */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-3">Rôles</h2>
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-3">
          {roles.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>
                {r.title} — {r.personName ?? "Non assigné"}
              </span>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    const fd = new FormData();
                    fd.set("departmentId", departmentId);
                    fd.set("roleId", r.id);
                    runMemberOrRole(removeRole, fd);
                  }}
                  disabled={pending}
                  className="text-xs text-danger border border-danger rounded-md px-2 py-1"
                >
                  Retirer
                </button>
              )}
            </div>
          ))}
          {roles.length === 0 && (
            <p className="text-sm text-gray-500 px-3 py-2">Aucun rôle.</p>
          )}
        </div>
        {editing && (
          <div className="flex gap-2 flex-wrap">
            <input
              id={roleTitleId}
              placeholder="Intitulé du rôle"
              className="flex-1 min-w-[140px] rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              id={rolePersonId}
              defaultValue=""
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Ne pas assigner</option>
              {allProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const titleInput = document.getElementById(roleTitleId) as HTMLInputElement;
                const personSelect = document.getElementById(rolePersonId) as HTMLSelectElement;
                const fd = new FormData();
                fd.set("departmentId", departmentId);
                fd.set("title", titleInput.value);
                fd.set("personId", personSelect.value);
                runMemberOrRole(addRole, fd);
                titleInput.value = "";
              }}
              disabled={pending}
              className="text-sm border border-gray-300 rounded-md px-3 py-2"
            >
              Ajouter
            </button>
          </div>
        )}
      </div>
    </form>
  );
}