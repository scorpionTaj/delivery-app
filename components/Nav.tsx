"use client";

import { ArrowRightFromSquare, Box, ChartColumn, Gear, MapPin, ShoppingCart } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import ThemeSwitch from "./ThemeSwitch";

const links = [
  { href: "/dashboard", label: "Dashboard", Icon: ChartColumn },
  { href: "/zones", label: "Zones", Icon: MapPin },
  { href: "/products", label: "Products", Icon: Box },
  { href: "/orders", label: "Orders", Icon: ShoppingCart },
  { href: "/settings", label: "Settings", Icon: Gear },
];

function Brand() {
  return (
    <span className="flex items-center gap-2 font-semibold">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-accent-foreground">
        <ShoppingCart />
      </span>
      Delivery Manager
    </span>
  );
}

function LogoutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    <form action={logout}>
      <Button type="submit" variant="ghost" size="sm" isIconOnly={iconOnly} aria-label="Log out" fullWidth={!iconOnly}>
        <ArrowRightFromSquare />
        {!iconOnly && "Log out"}
      </Button>
    </form>
  );
}

export default function Nav({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-separator bg-surface p-4 md:flex">
        <div className="mb-8 px-2">
          <Brand />
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${
                pathname === href ? "bg-accent-soft text-accent-soft-foreground" : "text-muted hover:bg-default"
              }`}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </nav>
        <div className="space-y-3 border-t border-separator pt-4">
          <ThemeSwitch compact />
          <p className="truncate px-1 text-xs text-muted">{email}</p>
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile top bar + bottom nav */}
      <header className="sticky top-0 z-[1000] flex items-center justify-between border-b border-separator bg-surface/90 px-4 py-2 backdrop-blur md:hidden">
        <Brand />
        <div className="flex items-center gap-1">
          <ThemeSwitch compact />
          <LogoutButton iconOnly />
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-[1000] grid grid-cols-5 border-t border-separator bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {links.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              pathname === href ? "text-accent" : "text-muted"
            }`}
          >
            <Icon width={20} height={20} />
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
