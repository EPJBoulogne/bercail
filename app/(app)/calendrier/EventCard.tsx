"use client";

import { useTransition } from "react";
import {
  respondToAssignment,
  proposeSelf,
  inviteMember,
  setAssignmentRole,
} from "./actions";

const colorClasses: Record<string, string> = {
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

const statusLabel: Record<string, string> = {
  invited: "Invité",
  accepted: "Accepté",
  declined: "Refusé",
  proposed: "Proposé",
};
const statusClass: Record<string, string> = {
  invited: "bg-warning/10 text-warning",
  accepted: "bg-success/10 text-success",
  declined: "bg-danger/10 text-danger",
  proposed: "bg-accent-soft text-accent",
};

type Assignment = {
  id: string;
  user_id: string;
  status: string;
  role_id: string | null;
  profiles: { name: string } | null;
};
type Role = { id: string; title: string };
type Member = { id: string; name: string };
type UnavailabilityRow = { user_id: string; start_date: string; end_date: string };

export function EventCard({
  event,
  currentUserId,
  canManage,
  roles,
  members,
  unavailability,
}: {
  event: {
    id: string;
    title: string;
    date: string;
    departments: { name: string; color: string } | null;
    event_assignments: Assignment[];
  };
  currentUserId: string;
  canManage: boolean;
  roles: Role[];
  members: Member[];
  unavailability: UnavailabilityRow[];
}) {
  const [pending, startTransition] = useTransition();
  const myAssignment = event.event_assignments.find((a) => a.user_id === currentUserId);
  const assignedIds = new Set(event.event_assignments.map((a) => a.user_id));
  const candidates = members.filter((m) => !assignedIds.has(m.id));

  function isUnavailable(userId: string) {
    return unavailability.some(
      (u) => u.user_id === userId && event.date >= u.start_date && event.date <= u.end_date
    );
  }

  function run(action: (fd: FormData) => Promise<void>, fd: FormData) {
    startTransition(async () => {
      await action(fd);
    });
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${colorClasses[event.departments?.color ?? "accent"]}`}
          />
          <strong className="text-sm">{event.title}</strong>
        </div>
        <span className="text-xs text-gray-500 font-mono">{event.date}</span>
      </div>

      <div className="divide-y divide-gray-100 mb-3">
        {event.event_assignments.map((a) => (
          <div key={a.id} className="flex items-center justify-between py-1.5 text-sm">
            <span>
              {a.profiles?.name}
              {isUnavailable(a.user_id) && (
                <span className="text-danger text-xs"> · indisponible</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              {canManage && roles.length > 0 && (
                <select
                  defaultValue={a.role_id ?? ""}
                  onChange={(e) => {
                    const fd = new FormData();
                    fd.set("assignmentId", a.id);
                    fd.set("roleId", e.target.value);
                    run(setAssignmentRole, fd);
                  }}
                  className="text-xs border border-gray-300 rounded-md px-1.5 py-1"
                >
                  <option value="">Aucun rôle</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              )}
              <span className={`text-[11px] rounded-full px-2 py-0.5 ${statusClass[a.status]}`}>
                {statusLabel[a.status]}
              </span>
            </div>
          </div>
        ))}
        {event.event_assignments.length === 0 && (
          <p className="text-xs text-gray-500 py-1.5">Personne assigné pour l&apos;instant.</p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {myAssignment?.status === "invited" && (
          <>
            <button
              disabled={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set("assignmentId", myAssignment.id);
                fd.set("status", "accepted");
                run(respondToAssignment, fd);
              }}
              className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5"
            >
              Accepter
            </button>
            <button
              disabled={pending}
              onClick={() => {
                const fd = new FormData();
                fd.set("assignmentId", myAssignment.id);
                fd.set("status", "declined");
                run(respondToAssignment, fd);
              }}
              className="text-xs border border-danger text-danger rounded-md px-2.5 py-1.5"
            >
              Refuser
            </button>
          </>
        )}
        {!myAssignment && (
          <button
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("eventId", event.id);
              run(proposeSelf, fd);
            }}
            className="text-xs border border-gray-300 rounded-md px-2.5 py-1.5"
          >
            Se proposer
          </button>
        )}
        {canManage && candidates.length > 0 && (
          <select
            defaultValue=""
            onChange={(e) => {
              const fd = new FormData();
              fd.set("eventId", event.id);
              fd.set("userId", e.target.value);
              run(inviteMember, fd);
            }}
            className="text-xs border border-gray-300 rounded-md px-2 py-1.5"
          >
            <option value="">Inviter un membre…</option>
            {candidates.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
