"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    });

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-accent via-[#F3897F] to-gold">
        <div className="w-full max-w-sm text-center bg-white rounded-2xl p-8 shadow-sm">
          <h1 className="font-display text-2xl font-semibold mb-4">
            Bercail<span className="text-accent">.</span>
          </h1>
          <p className="text-sm text-gray-600">
            Si un compte existe avec cet email, un lien pour réinitialiser
            le mot de passe vient d&apos;être envoyé.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-accent via-[#F3897F] to-gold">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold text-center mb-2">
          Bercail<span className="text-accent">.</span>
        </h1>
        <p className="text-center text-sm text-gray-500 mb-8">
          Mot de passe oublié
        </p>

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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Envoi…" : "Envoyer le lien"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-accent underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}