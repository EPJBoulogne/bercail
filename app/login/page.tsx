"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    // On vérifie le statut du compte avant de laisser entrer — un compte
    // en attente ne doit pas atterrir sur le tableau de bord.
    const { data: profile } = await supabase
      .from("profiles")
      .select("status")
      .eq("id", data.user.id)
      .single();

    if (profile?.status === "pending") {
      router.push("/en-attente");
      return;
    }
    if (profile?.status === "rejected") {
      await supabase.auth.signOut();
      setError("Cette demande de compte n'a pas été validée. Contactez un administrateur.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-accent via-[#F3897F] to-gold">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-center mb-8">
          Bercail<span className="text-accent">.</span>
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs uppercase text-gray-500 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="text-right mt-1">
              <Link href="/forgot-password" className="text-xs text-accent underline">
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Pas encore de compte ?{" "}
          <Link href="/signup" className="text-accent underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </main>
  );
}