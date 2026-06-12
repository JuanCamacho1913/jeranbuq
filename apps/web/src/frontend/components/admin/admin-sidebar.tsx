"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Scissors, Calendar, Menu } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/frontend/components/ui/sheet";
import { Separator } from "@/frontend/components/ui/separator";
import { cn } from "@/frontend/lib/utils";

// ─── Nav config ───────────────────────────────────────────────────────────────

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/servicios", label: "Servicios", icon: Scissors },
  { href: "/admin/disponibilidad", label: "Disponibilidad", icon: Calendar },
] as const;

// ─── NavLink ─────────────────────────────────────────────────────────────────

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
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}

// ─── Sidebar Nav content (shared between desktop and mobile) ─────────────────

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  // Exact match for dashboard, prefix match for sub-routes
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

// ─── AdminSidebar ─────────────────────────────────────────────────────────────

/**
 * Responsive admin sidebar.
 * - Desktop (md+): fixed left sidebar always visible.
 * - Mobile (<md): hidden by default, opens via hamburger into a Sheet drawer.
 */
export function AdminSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-14 items-center px-4">
          <span className="text-sm font-semibold text-sidebar-foreground">
            Barbería Jeranbuq
          </span>
        </div>
        <Separator />
        <SidebarNav />
      </aside>

      {/* Mobile hamburger + Sheet drawer */}
      <div className="flex md:hidden h-14 items-center border-b border-border px-4">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open navigation menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-56 p-0 bg-sidebar">
            <div className="flex h-14 items-center px-4">
              <span className="text-sm font-semibold text-sidebar-foreground">
                Barbería Jeranbuq
              </span>
            </div>
            <Separator />
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
