import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addUnavailability, deleteUnavailability } from "./actions";


export default async function DisponibilitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: mine } = await supabase
    .from("unavailability")
    .select("id, start_date, end_date")
    .eq("user_id", user.id)
    .order("start_date");
  const { data: team } = await supabase
    .from("unavailability")
    .select("id, start_date, end_date, profiles(name)")
    .order("start_date");
  return (
      <div className="p-6 md:p-8 max-w-lg">
        <h1 className="font-display text-xl font-semibold mb-1">Disponibilité</h1>
        <p className="text-sm text-gray-500 mb-6">
          Déclarez une période, modifiable à tout moment. Visible par toute l&apos;équipe.
        </p>
        <form
          action={addUnavailability}
          className="bg-white border border-gray-200 rounded-lg p-4 mb-6 flex flex-wrap gap-3 items-end"
        >
          <div>
            <label className="block text-[10px] uppercase text-gray-500 mb-1">Du</label>
            <input
              type="date"
              name="startDate"
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase text-gray-500 mb-1">Au</label>
            <input
              type="date"
              name="endDate"
              required
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <button className="bg-accent text-white text-sm rounded-md px-4 py-2">
            Enregistrer
          </button>
        </form>
        <p className="text-sm font-semibold mb-2">Mes indisponibilités</p>
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 mb-8">
          {mine?.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm font-mono">
                {u.start_date} → {u.end_date}
              </span>
              <form action={deleteUnavailability}>
                <input type="hidden" name="id" value={u.id} />
                <button className="text-xs text-danger border border-danger rounded-md px-2 py-1">
                  Supprimer
                </button>
              </form>
            </div>
          ))}
          {mine?.length === 0 && (
            <p className="text-sm text-gray-500 px-4 py-2.5">
              Aucune indisponibilité déclarée.
            </p>
          )}
        </div>
        <p className="text-sm font-semibold mb-2">Indisponibilités de l&apos;équipe</p>
        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
          {team?.map((u: any) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm">{u.profiles?.name}</span>
              <span className="text-xs text-gray-500 font-mono">
                {u.start_date} → {u.end_date}
              </span>
            </div>
          ))}
          {team?.length === 0 && (
            <p className="text-sm text-gray-500 px-4 py-2.5">
              Personne n&apos;a déclaré d&apos;indisponibilité.
            </p>
          )}
        </div>
      </div>
  );
}