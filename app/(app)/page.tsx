import { createClient } from "@/lib/supabase/server";
import { EventCard } from "./calendrier/EventCard";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // le layout gère déjà la redirection si non connecté

  const { data: me } = await supabase
    .from("profiles")
    .select("system_role")
    .eq("id", user.id)
    .single();
  const canManage = me?.system_role === "admin" || me?.system_role === "dept_manager";

  const today = new Date().toISOString().slice(0, 10);

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, date, department_id, departments(name, color), event_assignments(id, user_id, status, role_id, profiles(name))"
    )
    .gte("date", today)
    .order("date");

  const { data: departments } = await supabase
    .from("departments")
    .select("id, department_members(profiles(id, name)), department_roles(id, title)");
  const departmentsMap = new Map(
    (departments ?? []).map((d: any) => [
      d.id,
      {
        members: (d.department_members ?? []).map((m: any) => m.profiles).filter(Boolean),
        roles: d.department_roles ?? [],
      },
    ])
  );

  const { data: unavailability } = await supabase
    .from("unavailability")
    .select("user_id, start_date, end_date");

  const invited = (events ?? []).filter((e: any) =>
    e.event_assignments.some((a: any) => a.user_id === user.id && a.status === "invited")
  );
  const accepted = (events ?? []).filter((e: any) =>
    e.event_assignments.some((a: any) => a.user_id === user.id && a.status === "accepted")
  );
  const openEvents = (events ?? []).filter(
    (e: any) => !e.event_assignments.some((a: any) => a.user_id === user.id)
  );

  function renderList(list: any[], emptyText: string) {
    if (list.length === 0) return <p className="text-sm text-gray-500">{emptyText}</p>;
    return (
      <div className="space-y-3">
        {list.map((e: any) => (
          <EventCard
            key={e.id}
            event={e}
            currentUserId={user!.id}
            canManage={canManage}
            unavailability={unavailability ?? []}
            roles={departmentsMap.get(e.department_id)?.roles ?? []}
            members={departmentsMap.get(e.department_id)?.members ?? []}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-xl">
      <h1 className="font-display text-xl font-semibold mb-1">Tableau de bord</h1>
      <p className="text-sm text-gray-500 mb-6">
        Vos invitations, vos événements confirmés, et ceux ouverts à tous.
      </p>

      <p className="text-sm font-semibold mb-2">En attente de votre réponse</p>
      <div className="mb-8">{renderList(invited, "Aucune invitation en attente.")}</div>

      <p className="text-sm font-semibold mb-2">À venir, confirmés</p>
      <div className="mb-8">{renderList(accepted, "Aucun événement confirmé à venir.")}</div>

      <p className="text-sm font-semibold mb-2">Autres événements — proposez-vous</p>
      <div>{renderList(openEvents, "Rien de nouveau à proposer.")}</div>
    </div>
  );
}
