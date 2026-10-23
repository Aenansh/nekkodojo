import type { CSSProperties } from "react";

const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

const PATTERNS: Record<"hinoki" | "washi" | "tatami", CSSProperties> = {
  hinoki: {
    backgroundImage:
      "repeating-linear-gradient(90deg, rgba(92,61,33,0.18) 0px, rgba(92,61,33,0.18) 1px, transparent 1px, transparent 7px), repeating-linear-gradient(90deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 23px)",
  },
  washi: {
    backgroundImage:
      "repeating-linear-gradient(45deg, rgba(234,221,207,0.035) 0px, rgba(234,221,207,0.035) 1px, transparent 1px, transparent 6px), repeating-linear-gradient(-45deg, rgba(234,221,207,0.025) 0px, rgba(234,221,207,0.025) 1px, transparent 1px, transparent 9px)",
  },
  tatami: {
    backgroundImage:
      "repeating-linear-gradient(0deg, rgba(234,221,207,0.045) 0px, rgba(234,221,207,0.045) 1px, transparent 1px, transparent 4px), linear-gradient(90deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.3) 2px, transparent 2px)",
    backgroundSize: "auto, 240px 100%",
  },
};

export function Grain({
  variant = "hinoki",
  strength = 1,
  className = "",
}: {
  variant?: "hinoki" | "washi" | "tatami";
  strength?: number;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 ${className}`}>
      <div className="absolute inset-0" style={{ ...PATTERNS[variant], opacity: strength }} />
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{ backgroundImage: NOISE, opacity: 0.07 * strength }}
      />
    </div>
  );
}

export function LanternGlow({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.16)_0%,rgba(212,175,55,0.05)_40%,transparent_70%)] ${className}`}
    />
  );
}

export function Paw({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <ellipse cx="12" cy="16" rx="5" ry="4" />
      <circle cx="5" cy="10" r="2.2" />
      <circle cx="9.5" cy="5.5" r="2.2" />
      <circle cx="14.5" cy="5.5" r="2.2" />
      <circle cx="19" cy="10" r="2.2" />
    </svg>
  );
}

export function EnsoCat({ className }: { className?: string }) {
  const enso =
    "M62 10 C 92 8, 114 32, 112 62 C 110 92, 84 114, 54 110 C 26 106, 8 82, 12 54 C 15 36, 26 24, 40 17";
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden="true">
      <path
        d={enso}
        stroke="#d4af37"
        strokeOpacity="0.85"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d={enso}
        stroke="#eaddcf"
        strokeOpacity="0.25"
        strokeWidth="1.2"
        strokeLinecap="round"
        transform="translate(1.2 1.2)"
      />
      <g stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M49 44 L48 33 L56 39 Q60 38 64 39 L72 33 L71 44 Q73 47 73 50 Q73 58 60 58 Q47 58 47 50 Q47 47 49 44Z" />
        <path d="M50 62 C 44 76, 46 92, 60 92 C 74 92, 76 76, 70 62" />
        <path d="M70 88 C 86 88, 88 74, 80 68" />
      </g>
      <circle cx="55" cy="50" r="1.2" fill="#d4af37" />
      <circle cx="65" cy="50" r="1.2" fill="#d4af37" />
    </svg>
  );
}

export function Hanko({ char = "猫", className = "" }: { char?: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 -rotate-3 items-center justify-center rounded-[3px] border-2 border-[#d4af37]/70 bg-[#2b1a12] font-serif text-[#d4af37] shadow-[inset_0_0_0_2px_#18120e,inset_0_0_0_3px_rgba(212,175,55,0.3)] ${className}`}
    >
      {char}
    </span>
  );
}

export function EnsoDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-5 ${className}`} aria-hidden="true">
      <span className="h-px w-20 bg-linear-to-r from-transparent to-[#5c3d21]" />
      <EnsoCat className="size-14 opacity-70" />
      <span className="h-px w-20 bg-linear-to-l from-transparent to-[#5c3d21]" />
    </div>
  );
}

export function SleepingCat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 110" fill="none" className={className} aria-hidden="true">
      <g stroke="#d4af37" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {                    }
        <path d="M24 72 C 14 44, 40 20, 72 20 C 104 20, 126 44, 118 72 C 112 92, 84 100, 56 96" />
        {                }
        <path d="M40 74 C 36 56, 52 40, 72 40 C 92 40, 104 54, 100 70 C 97 82, 80 86, 66 84" />
        {                                    }
        <path d="M118 72 C 124 92, 96 104, 60 100 C 50 99, 44 96, 42 92" />
        {                   }
        <ellipse cx="36" cy="84" rx="16" ry="13" />
        <path d="M24 74 L22 61 L34 70" />
        <path d="M46 72 L52 60 L56 74" />
        {                 }
        <path d="M28 84 Q31 87 34 84" />
        <path d="M40 84 Q43 87 46 84" />
      </g>
      <path d="M34 90 L38 90 L36 92 Z" fill="#d4af37" />
      <text
        x="72"
        y="67"
        textAnchor="middle"
        fontSize="17"
        fill="#d4af37"
        fontFamily="ui-monospace, monospace"
      >
        {"</>"}
      </text>
      <text x="108" y="20" fontSize="10" fill="#d4af37" opacity="0.6" fontFamily="serif">
        z
      </text>
      <text x="121" y="11" fontSize="7" fill="#d4af37" opacity="0.4" fontFamily="serif">
        z
      </text>
    </svg>
  );
}
