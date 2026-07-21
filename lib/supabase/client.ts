import { createBrowserClient } from "@supabase/ssr";

/**
 * Client Supabase pour les composants React côté navigateur ("use client").
 * Utilise la clé publishable — sans danger à exposer tant que RLS est
 * activé sur toutes les tables avec les bonnes policies.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
