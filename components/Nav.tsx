"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/zones", label: "Zones", icon: "◎" },
  { href: "/products", label: "Products", icon: "▤" },
  { href: "/orders", label: "Orders", icon: "➤" },
];

export default function Nav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <p className="mb-6 text-lg font-semibold">Delivery Manager</p>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                pathname === l.href ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="mr-2" aria-hidden>{l.icon}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        <p className="truncate text-xs text-slate-500">{email}</p>
        <form action={logout}>
          <button className="mt-2 w-full btn-secondary text-sm">Log out</button>
        </form>
      </aside>

      {/* Mobile top bar + bottom nav */}
      <header className="sticky top-0 z-[1000] flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <p className="font-semibold">Delivery Manager</p>
        <form action={logout}>
          <button className="text-sm font-medium text-slate-600">Log out</button>
        </form>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-[1000] grid grid-cols-4 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex flex-col items-center py-2 text-xs font-medium ${
              pathname === l.href ? "text-indigo-600" : "text-slate-500"
            }`}
          >
            <span className="text-lg" aria-hidden>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
