"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Scissors, Calendar, CalendarDays, Menu, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/frontend/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/frontend/components/ui/sheet";
import { cn } from "@/frontend/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/admin/servicios", label: "Servicios", icon: Scissors },
  { href: "/admin/disponibilidad", label: "Disponibilidad", icon: Calendar },
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
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200",
        active
          ? "bg-gold-500/12 text-gold-400"
          : "text-[#A0A0A0] hover:bg-gold-500/8 hover:text-gold-400"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  return (
    <nav className="flex flex-col gap-1 p-4">
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          href={item.href}
          label={item.label}
          icon={item.icon}
          active={isActive(item.href)}
          onClick={onNavigate}
        />
      ))}
    </nav>
  );
}

function SidebarHeader() {
  return (
    <div className="flex h-16 items-center gap-3 px-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="JB Barber Studio"
        width={36}
        height={36}
        className="h-8 w-8 rounded-full object-contain"
      />
      <span className="font-display text-sm font-semibold tracking-wide text-foreground">
        JB Barber Studio
      </span>
    </div>
  );
}

export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        aria-label="Navegación de administrador"
        className="hidden h-screen w-56 shrink-0 flex-col border-r border-gold-500/15 bg-[#0A0A0A] md:flex"
      >
        <SidebarHeader />
        <div className="h-px bg-gold-500/10" />
        <div className="flex-1">
          <SidebarNav />
        </div>
        <div className="h-px bg-gold-500/10" />
        <div className="p-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-3 text-[#A0A0A0] transition-colors duration-200 hover:bg-gold-500/8 hover:text-gold-400"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {/* Mobile hamburger + Sheet drawer */}
      <div className="flex h-14 items-center border-b border-gold-500/15 bg-[#0A0A0A] px-4 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation menu"
              className="text-[#A0A0A0] hover:bg-gold-500/10 hover:text-gold-400"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-56 flex-col border-r border-gold-500/15 bg-[#0A0A0A] p-0">
            <SidebarHeader />
            <div className="h-px bg-gold-500/10" />
            <div className="flex-1">
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="h-px bg-gold-500/10" />
            <div className="p-4">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-3 text-[#A0A0A0] hover:bg-gold-500/8 hover:text-gold-400"
                onClick={() => signOut({ callbackUrl: "/login" })}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Cerrar sesión
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
