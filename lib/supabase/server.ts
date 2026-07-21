import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase pour les Server Components et Route Handlers.
 * Toujours créé à la demande (jamais réutilisé entre requêtes) car il lit
 * les cookies de la requête en cours pour connaître l'utilisateur connecté.
 *
 * Utilise toujours la clé PUBLISHABLE ici, pas la secret key — ce client
 * représente l'utilisateur courant et reste soumis aux policies RLS.
 * La secret key (qui contourne RLS) ne doit servir que dans du code
 * d'administration explicite (ex: la synchro portail.yt), jamais ici.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component : ignorable si un
            // middleware se charge déjà de rafraîchir la session.
          }
        },
      },
    }
  );
}
