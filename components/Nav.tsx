"use client";

import {
  ArrowRightFromSquare,
  Box,
  ChartColumn,
  ChevronsLeft,
  ChevronsRight,
  Gear,
  MapPin,
  ShoppingCart,
} from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/login/actions";
import { isNavCollapsed, setNavCollapsed } from "@/lib/theme";
import Logo from "./Logo";
import ThemeSwitch from "./ThemeSwitch";

const links = [
  { href: "/dashboard", label: "Dashboard", Icon: ChartColumn },
  { href: "/zones", label: "Zones", Icon: MapPin },
  { href: "/products", label: "Products", Icon: Box },
  { href: "/orders", label: "Orders", Icon: ShoppingCart },
  { href: "/settings", label: "Settings", Icon: Gear },
];

// Labels hide when <html data-nav="collapsed"> (set before paint), so there is no layout jump.
const hideWhenCollapsed = "nav-collapsed:hidden";

function LogoutButton({ iconOnly = false }: { iconOnly?: boolean }) {
  return (
    <form action={logout}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        isIconOnly={iconOnly}
        aria-label="Log out"
        fullWidth={!iconOnly}
        className="justify-start nav-collapsed:justify-center"
      >
        <ArrowRightFromSquare />
        {!iconOnly && <span className={hideWhenCollapsed}>Log out</span>}
      </Button>
    </form>
  );
}

export default function Nav({ email }: { email: string }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {/* Desktop sidebar: full width or icons only */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-separator bg-surface p-3 transition-[width] duration-200 nav-collapsed:w-18 md:flex">
        <div className="mb-6 flex items-center gap-2 px-1 pt-1">
          <Logo />
          <span className={`font-semibold whitespace-nowrap ${hideWhenCollapsed}`}>Delivery Manager</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {links.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              title={label}
              aria-current={isActive(href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition nav-collapsed:justify-center nav-collapsed:px-0 ${
                isActive(href) ? "bg-accent-soft text-accent-soft-foreground" : "text-muted hover:bg-default"
              }`}
            >
              <Icon width={18} height={18} className="shrink-0" />
              <span className={hideWhenCollapsed}>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-3 border-t border-separator pt-3 nav-collapsed:items-center">
          <ThemeSwitch className="nav-collapsed:flex-col" />
          <p className={`truncate px-1 text-xs text-muted ${hideWhenCollapsed}`}>{email}</p>
          <LogoutButton />
          <Button
            size="sm"
            variant="ghost"
            className="justify-start text-muted nav-collapsed:justify-center"
            aria-label="Collapse or expand sidebar"
            onPress={() => setNavCollapsed(!isNavCollapsed())}
          >
            <ChevronsLeft className="nav-collapsed:hidden" />
            <ChevronsRight className="hidden nav-collapsed:block" />
            <span className={hideWhenCollapsed}>Collapse</span>
          </Button>
        </div>
      </aside>

      {/* Mobile top bar + bottom nav */}
      <header className="sticky top-0 z-[1000] flex items-center justify-between border-b border-separator bg-surface/90 px-4 py-2 backdrop-blur md:hidden">
        <span className="flex items-center gap-2 font-semibold">
          <Logo size={28} />
          Delivery Manager
        </span>
        <div className="flex items-center gap-1">
          <ThemeSwitch />
          <LogoutButton iconOnly />
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-[1000] grid grid-cols-5 border-t border-separator bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {links.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(href) ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              isActive(href) ? "text-accent" : "text-muted"
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
