"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Scissors, Menu, X, CalendarDays, Home, LogOut } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Separator } from "@/frontend/components/ui/separator";
import { cn } from "@/frontend/lib/utils";

// ─── Nav config ───────────────────────────────────────────────────────────────

const navItems = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/mis-citas", label: "Mis Citas", icon: CalendarDays },
] as const;

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

// ─── ClientHeader ─────────────────────────────────────────────────────────────

/**
 * Responsive client navigation header.
 * - Desktop (md+): horizontal nav bar with links and logout button.
 * - Mobile (<md): hamburger menu that reveals a drawer-style nav.
 * UI labels are in Spanish per project conventions.
 */
export function ClientHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  function handleSignOut() {
    signOut({ callbackUrl: "/login" });
  }

  const userName = session?.user?.name ?? session?.user?.email ?? "";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      {/* Desktop header */}
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link
          href="/inicio"
          className="flex items-center gap-2 text-sm font-semibold"
        >
          <Scissors className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Barbería Jeranbuq</span>
        </Link>

        {/* Desktop nav links */}
        <nav aria-label="Navegación principal" className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isActive(item.href)}
            />
          ))}
        </nav>

        {/* Desktop: user info + logout */}
        <div className="hidden md:flex items-center gap-3">
          {userName && (
            <span className="text-sm text-muted-foreground truncate max-w-[160px]">
              {userName}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Abrir menú de navegación"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-4">
          <nav aria-label="Menú móvil" className="flex flex-col gap-1 pt-3">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isActive(item.href)}
                onClick={() => setMobileOpen(false)}
              />
            ))}
          </nav>
          <Separator className="my-3" />
          <div className="flex items-center justify-between">
            {userName && (
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                {userName}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="gap-2 ml-auto"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
