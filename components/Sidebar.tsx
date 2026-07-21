"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseNav = [
  { href: "/", label: "Tableau de bord" },
  { href: "/calendrier", label: "Calendrier" },
  { href: "/disponibilite", label: "Disponibilité" },
];

const worshipNav = [
  { href: "/repertoire", label: "Répertoire" },
  { href: "/listes", label: "Listes" },
];

export function Sidebar({ isWorshipMember }: { isWorshipMember: boolean }) {
  const pathname = usePathname();
  const items = isWorshipMember ? [...baseNav, ...worshipNav] : baseNav;

  return (
    <nav className="hidden md:flex w-56 shrink-0 bg-ink text-white flex-col py-5">
      <div className="px-5 pb-5 mb-3 border-b border-white/10 font-display text-lg font-semibold">
        Bercail<span className="text-accent">.</span>
      </div>
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-5 py-2.5 text-sm border-l-[3px] ${
              active
                ? "border-accent bg-white/5 text-white"
                : "border-transparent text-white/60 hover:text-white hover:bg-white/5"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}