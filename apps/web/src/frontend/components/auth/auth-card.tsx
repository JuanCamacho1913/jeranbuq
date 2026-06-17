export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="JB Barber Studio"
            width={120}
            height={120}
            className="h-28 w-28 rounded-full object-contain"
          />
        </div>

        <div className="rounded-xl border border-gold-500/20 bg-surface-200 p-8 shadow-lg shadow-gold-500/5">
          {children}
        </div>
      </div>
    </div>
  );
}
