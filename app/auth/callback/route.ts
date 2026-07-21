import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const next =
    type === "recovery"
      ? "/reset-password"
      : type === "email_change"
      ? "/preferences"
      : "/en-attente";
  const response = NextResponse.redirect(`${origin}${next}`);

  // Client dédié à cette route : on attache les cookies directement sur
  // `response`, plutôt que de passer par le createClient() partagé
  // (basé sur next/headers cookies()), qui ne garantit pas de modifier
  // CETTE réponse précise dans un Route Handler qui redirige lui-même.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (token_hash && type) {
    await supabase.auth.verifyOtp({ token_hash, type });
  }

  // Une fois un changement d'email confirmé, synchronise la copie
  // dénormalisée dans profiles (utilisée pour l'affichage/recherche)
  // avec la vraie adresse désormais active côté auth.
  if (type === "email_change") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      await supabase.from("profiles").update({ email: user.email }).eq("id", user.id);
    }
  }

  return response;
}
