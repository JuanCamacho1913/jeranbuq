function JBLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="JB Barber Studio"
    >
      {/* Outer black circle */}
      <circle cx="100" cy="100" r="98" fill="#000" />
      {/* Outer ring */}
      <circle cx="100" cy="100" r="98" fill="none" stroke="#fff" strokeWidth="3" />
      {/* Inner ring */}
      <circle cx="100" cy="100" r="84" fill="none" stroke="#fff" strokeWidth="2" />
      {/* JB letters */}
      <text
        x="100"
        y="108"
        textAnchor="middle"
        fontFamily="Arial Black, Arial, sans-serif"
        fontWeight="900"
        fontSize="72"
        fill="#fff"
        letterSpacing="-4"
      >
        JB
      </text>
      {/* Horizontal divider */}
      <line x1="30" y1="128" x2="170" y2="128" stroke="#fff" strokeWidth="1.5" />
      {/* BARBER text */}
      <text
        x="100"
        y="150"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="700"
        fontSize="18"
        fill="#fff"
        letterSpacing="6"
      >
        BARBER
      </text>
      {/* STUDIO text */}
      <text
        x="100"
        y="169"
        textAnchor="middle"
        fontFamily="Arial, sans-serif"
        fontWeight="400"
        fontSize="13"
        fill="#fff"
        letterSpacing="8"
      >
        STUDIO
      </text>
    </svg>
  );
}

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <JBLogo className="h-28 w-28 drop-shadow-[0_0_20px_rgba(201,162,39,0.15)]" />
        </div>

        <div className="rounded-xl border border-gold-500/20 bg-surface-200 p-8 shadow-lg shadow-gold-500/5">
          {children}
        </div>
      </div>
    </div>
  );
}
