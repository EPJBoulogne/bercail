"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, phone },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      console.error("Signup error:", signUpError);
      if (signUpError.message.toLowerCase().includes("already registered")) {
        setError("Un compte existe déjà avec cet email.");
      } else if (signUpError.message.toLowerCase().includes("captcha")) {
        setError(
          "Le CAPTCHA est encore activé côté Supabase mais aucun n'est affiché ici — désactivez-le dans Authentication → Attack Protection, ou dites-le-moi pour qu'on l'intègre correctement."
        );
      } else {
        setError(`Erreur : ${signUpError.message}`);
      }
      setLoading(false);
      return;
    }

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
            Vérifiez votre boîte mail pour confirmer votre adresse. Une fois
            confirmé, votre compte reste <strong>en attente de validation</strong>{" "}
            par un administrateur avant de pouvoir accéder à l&apos;application.
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
          Créer un compte
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 mb-1">
              Nom complet
            </label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
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
              Téléphone (optionnel)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white rounded-md py-2 text-sm font-medium disabled:opacity-60"
          >
            {loading ? "Création…" : "Créer mon compte"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-accent underline">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}