"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Menu, X, CalendarDays, Home, LogOut } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { cn } from "@/frontend/lib/utils";

const navItems = [
  { href: "/inicio", label: "Inicio", icon: Home },
  { href: "/mis-citas", label: "Mis Citas", icon: CalendarDays },
] as const;

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
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
        active
          ? "text-gold-400"
          : "text-[#A0A0A0] hover:text-gold-400"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

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
    <header className="sticky top-0 z-40 border-b border-gold-500/15 bg-[#0A0A0A]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link
          href="/inicio"
          className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-80"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="JB Barber Studio"
            width={40}
            height={40}
            className="h-9 w-9 rounded-full object-contain"
          />
          <span className="hidden font-display text-sm font-semibold tracking-wide text-foreground sm:inline">
            JB Barber Studio
          </span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-1 md:flex">
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

        <div className="hidden items-center gap-3 md:flex">
          {userName && (
            <span className="max-w-[160px] truncate text-sm text-[#A0A0A0]">
              {userName}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="gap-2 text-[#A0A0A0] transition-colors duration-200 hover:bg-gold-500/10 hover:text-gold-400"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>

        <button
          className="rounded-md p-2 text-[#A0A0A0] transition-colors duration-200 hover:bg-gold-500/10 hover:text-gold-400 md:hidden"
          aria-label="Abrir menú de navegación"
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gold-500/10 bg-[#0A0A0A] px-4 pb-4 md:hidden">
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
          <div className="my-3 h-px bg-gold-500/10" />
          <div className="flex items-center justify-between">
            {userName && (
              <span className="max-w-[200px] truncate text-sm text-[#A0A0A0]">
                {userName}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="ml-auto gap-2 text-[#A0A0A0] hover:bg-gold-500/10 hover:text-gold-400"
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
