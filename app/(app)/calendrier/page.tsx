import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateEventModal } from "@/components/CreateEventModal";
import { EventCard } from "./EventCard";

const monthNames = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export default async function CalendrierPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string };
}) {
  const today = new Date();
  const month = parseInt(searchParams.month ?? String(today.getMonth() + 1), 10);
  const year = parseInt(searchParams.year ?? String(today.getFullYear()), 10);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: me } = await supabase
    .from("profiles")
    .select("system_role")
    .eq("id", user!.id)
    .single();
  const canManage = me?.system_role === "admin" || me?.system_role === "dept_manager";

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDateObj = new Date(year, month, 0); // dernier jour du mois
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(endDateObj.getDate()).padStart(2, "0")}`;

  const { data: events } = await supabase
    .from("events")
    .select(
      "id, title, date, department_id, departments(name, color), event_assignments(id, user_id, status, role_id, profiles(name))"
    )
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date");

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, color, department_members(profiles(id, name)), department_roles(id, title)");

  const { data: unavailability } = await supabase
    .from("unavailability")
    .select("user_id, start_date, end_date");

  const departmentsForModal = (departments ?? []).map((d: any) => ({
    id: d.id,
    name: d.name,
    members: (d.department_members ?? []).map((m: any) => m.profiles).filter(Boolean),
    roles: d.department_roles ?? [],
  }));

  // Grille du mois
  const daysInMonth = endDateObj.getDate();
  let firstWeekday = new Date(year, month - 1, 1).getDay();
  firstWeekday = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const eventDates = new Set((events ?? []).map((e) => e.date));

  function monthLink(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    return `/calendrier?month=${m}&year=${y}`;
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold mb-1">Calendrier</h1>
          <p className="text-sm text-gray-500">Le calendrier partagé de l&apos;église.</p>
        </div>
        {canManage && (
          <CreateEventModal departments={departmentsForModal} defaultDate={startDate} />
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <Link href={monthLink(-1)} className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5">
          ‹
        </Link>
        <strong className="text-sm font-mono">
          {monthNames[month - 1]} {year}
        </strong>
        <Link href={monthLink(1)} className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5">
          ›
        </Link>
      </div>

      <div className="grid grid-cols-7 gap-1 max-w-xs mb-8">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
          <div key={i} className="text-center text-[10px] text-gray-400 py-1">
            {d}
          </div>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const hasEvent = eventDates.has(dateStr);
          return (
            <div
              key={day}
              className={`aspect-square rounded-md border text-xs flex items-center justify-center ${
                hasEvent
                  ? "bg-accent-soft border-accent text-accent font-medium"
                  : "bg-white border-gray-200"
              }`}
            >
              {day}
            </div>
          );
        })}
      </div>

      <div className="space-y-3 max-w-xl">
        {events?.map((e: any) => (
          <EventCard
            key={e.id}
            event={e}
            currentUserId={user!.id}
            canManage={canManage}
            unavailability={unavailability ?? []}
            roles={
              departmentsForModal.find((d) => d.id === e.department_id)?.roles ?? []
            }
            members={
              departmentsForModal.find((d) => d.id === e.department_id)?.members ?? []
            }
          />
        ))}
        {events?.length === 0 && (
          <p className="text-sm text-gray-500">Aucun événement ce mois-ci.</p>
        )}
      </div>
    </div>
  );
}
