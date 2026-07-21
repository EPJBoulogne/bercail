"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const roleLabel: Record<string, string> = {
  admin: "Administrateur",
  dept_manager: "Responsable de département",
  member: "Membre",
};

export function AccountMenu({
  name,
  role,
}: {
  name: string;
  role: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative" ref={wrapRef}>
      <span className="text-sm text-gray-500 mr-2 hidden sm:inline">{name}</span>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-full bg-accent-soft text-accent font-medium text-xs inline-flex items-center justify-center"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+10px)] w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 z-50">
          <div className="px-2.5 pt-1 pb-3 mb-1.5 border-b border-gray-200">
            <p className="text-sm font-medium">{name}</p>
            <span className="text-[11px] bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
              {roleLabel[role] ?? role}
            </span>
          </div>

          <Link
            href="/preferences"
            onClick={() => setOpen(false)}
            className="block text-sm px-2.5 py-2 rounded-md hover:bg-gray-50"
          >
            Mon compte
          </Link>

          {role === "admin" && (
            <>
              <Link
                href="/admin/users"
                onClick={() => setOpen(false)}
                className="block text-sm px-2.5 py-2 rounded-md hover:bg-gray-50"
              >
                Gestion des utilisateurs
              </Link>
              <Link
                href="/admin/departments"
                onClick={() => setOpen(false)}
                className="block text-sm px-2.5 py-2 rounded-md hover:bg-gray-50"
              >
                Gestion des départements
              </Link>
              <Link
                href="/admin/pending"
                onClick={() => setOpen(false)}
                className="block text-sm px-2.5 py-2 rounded-md hover:bg-gray-50"
              >
                Comptes en attente
              </Link>
            </>
          )}

          <button
            onClick={handleSignOut}
            className="w-full text-left text-sm px-2.5 py-2 rounded-md hover:bg-red-50 text-danger mt-1"
          >
            Se déconnecter
          </button>
        </div>
      )}
    </div>
  );
}
