import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase "admin" — utilise la SECRET KEY, contourne RLS.
 *
 * ⚠️ Ne JAMAIS importer ce fichier dans un composant "use client" ou
 * exposer son résultat au navigateur. Réservé aux Server Actions et
 * Route Handlers (création de compte par un admin, synchro portail.yt).
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
