"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseNav = [
  { href: "/", label: "Accueil" },
  { href: "/calendrier", label: "Calendrier" },
  { href: "/disponibilite", label: "Dispo" },
];

const worshipNav = [
  { href: "/repertoire", label: "Répertoire" },
  { href: "/listes", label: "Listes" },
];

export function MobileNav({ isWorshipMember }: { isWorshipMember: boolean }) {
  const pathname = usePathname();
  const items = isWorshipMember ? [...baseNav, ...worshipNav] : baseNav;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-ink flex justify-center overflow-x-auto z-40 border-t border-white/10">
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2.5 text-[10.5px] border-t-[3px] whitespace-nowrap ${
              active ? "border-accent text-white" : "border-transparent text-white/60"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}