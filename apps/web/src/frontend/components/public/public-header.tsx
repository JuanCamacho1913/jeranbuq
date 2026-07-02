// Server Component — no "use client", no useSession, no getServerSession
import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gold-500/10 bg-[#050505]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link
          href="/inicio"
          className="flex items-center transition-opacity hover:opacity-80"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="JB Barber Studio"
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-contain"
          />
          <span className="ml-3 font-display text-sm font-semibold tracking-wide text-foreground">
            JB Barber Studio
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login/barbero"
            className="text-xs font-medium text-[#606060] transition-colors hover:text-[#A0A0A0]"
          >
            Acceso Admin
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gold-500/40 px-4 py-2 text-sm font-medium text-gold-400 transition-colors hover:bg-gold-500/10"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  );
}
