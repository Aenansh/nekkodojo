"use client";

import Link from "next/link";
import { BookMarked, Library, ArrowRight } from "lucide-react";

export default function BookmarksHub() {
  return (
    <div className="relative w-full overflow-hidden">
      <Seigaiha />

      <div className="relative mx-auto w-full max-w-5xl space-y-10 p-6 md:py-14">
        {/* ---------- Header ---------- */}
        <header className="animate-in fade-in slide-in-from-top-4 space-y-4 text-center duration-700">
          <div className="mx-auto flex size-14 items-center justify-center rounded-md border border-[#d4af37]/40 bg-[#2c1810] text-[#d4af37] shadow-[0_0_0_3px_#120c0a,0_0_0_4px_rgba(212,175,55,0.2)]">
            <CatMark className="size-8" />
          </div>

          <div className="flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-[#d4af37]/30" />
            <span className="font-serif text-sm tracking-[0.5em] text-[#d4af37]/80">書庫</span>
            <span className="h-px w-12 bg-[#d4af37]/30" />
          </div>

          <h1 className="font-serif text-4xl font-bold tracking-wide text-[#d4af37] md:text-5xl">
            The Archives
          </h1>
          <p className="text-[#a1887f]">
            Select a collection to view your saved techniques and scrolls.
          </p>
        </header>

        {/* ---------- Cards ---------- */}
        <div className="grid gap-6 md:grid-cols-2">
          <ArchiveCard
            href="/archives/shelf"
            scene={<ShelfScene />}
            icon={<Library className="size-6" />}
            title="The Shelf"
            description="Your personal library of coding katas. Revisit stuck problems, practice important patterns, and review saved challenges."
            cta="Open Shelf"
            watermark="棚"
            delay={150}
          />
          <ArchiveCard
            href="/archives/bookmarks"
            scene={<ScrollScene />}
            icon={<BookMarked className="size-6" />}
            title="Saved Scrolls"
            description="Bookmarked discussions and wisdom from the community. Keep track of insightful threads and valuable comments."
            cta="View Bookmarks"
            watermark="巻"
            delay={300}
          />
        </div>

        {/* ---------- Paw trail ---------- */}
        <div className="flex items-center justify-center gap-6 pt-2" aria-hidden="true">
          <span className="h-px w-20 bg-linear-to-r from-transparent to-[#3e2723]" />
          <div className="flex items-center gap-3 text-[#d4af37]">
            <Paw className="size-4 -rotate-12 opacity-20" />
            <Paw className="size-4 rotate-12 opacity-35" />
            <Paw className="size-4 -rotate-12 opacity-55" />
          </div>
          <span className="h-px w-20 bg-linear-to-l from-transparent to-[#3e2723]" />
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   Card: an illustrated panel on top, text below
   ================================================================ */
function ArchiveCard({
  href,
  scene,
  icon,
  title,
  description,
  cta,
  watermark,
  delay,
}: {
  href: string;
  scene: React.ReactNode;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  watermark: string;
  delay: number;
}) {
  return (
    <Link
      href={href}
      className="group animate-in fade-in slide-in-from-bottom-4 block rounded-xl duration-700 [animation-fill-mode:both] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
      style={{ animationDelay: `${delay}ms` }}
    >
      <article className="relative flex h-full flex-col overflow-hidden rounded-xl border border-[#3e2723] bg-[#14100d] transition-all duration-500 group-hover:-translate-y-1 group-hover:border-[#d4af37]/60 group-hover:shadow-[0_24px_48px_-24px_rgba(212,175,55,0.25)]">
        {/* gold line drawn from the centre of the top edge */}
        <span
          aria-hidden="true"
          className="absolute inset-x-6 top-0 z-20 h-0.5 origin-center scale-x-0 bg-[#d4af37] transition-transform duration-500 ease-out group-hover:scale-x-100"
        />

        {/* illustration */}
        <div className="relative h-52 overflow-hidden border-b border-[#3e2723] bg-linear-to-b from-[#2c1810] to-[#14100d]">
          <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
            {scene}
          </div>
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#14100d]/70 via-transparent to-transparent" />
        </div>

        {/* text */}
        <div className="relative flex flex-1 flex-col p-7">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-4 right-3 select-none font-serif text-9xl leading-none text-[#d4af37]/4 transition-colors duration-500 group-hover:text-[#d4af37]/9"
          >
            {watermark}
          </span>

          <div className="relative flex flex-1 flex-col">
            <div className="-mt-14 mb-5 flex size-12 items-center justify-center rounded-md border border-[#d4af37]/40 bg-[#2c1810] text-[#d4af37] shadow-[0_0_0_3px_#14100d] transition-colors duration-300 group-hover:bg-[#d4af37] group-hover:text-[#1a110d]">
              {icon}
            </div>

            <h2 className="mb-2 font-serif text-2xl font-bold text-[#eaddcf] transition-colors group-hover:text-[#d4af37]">
              {title}
            </h2>
            <p className="mb-8 leading-relaxed text-[#a1887f]">{description}</p>

            <div className="mt-auto flex items-center gap-2 text-sm font-bold text-[#d4af37]">
              {cta}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

/* ================================================================
   Scene 1: a shelf of scrolls with a cat keeping watch
   ================================================================ */
function ShelfScene() {
  const heights = [70, 62, 72, 58, 68, 64, 70, 60];
  const fills = ["#3e2723", "#5d4037", "#2c1810", "#6d4c41"];

  return (
    <svg
      viewBox="0 0 400 220"
      className="size-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="shelfGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#d4af37" stopOpacity="0.16" />
          <stop offset="1" stopColor="#d4af37" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="110" r="160" fill="url(#shelfGlow)" />

      {/* back panels */}
      <rect x="64" y="38" width="272" height="76" fill="#0f0b0a" opacity="0.65" />
      <rect x="64" y="121" width="272" height="77" fill="#0f0b0a" opacity="0.65" />

      {/* frame */}
      <g fill="#4a2f25" stroke="#3e2723" strokeWidth="1">
        <rect x="56" y="34" width="8" height="172" />
        <rect x="336" y="34" width="8" height="172" />
        <rect x="50" y="30" width="300" height="8" rx="1" />
        <rect x="50" y="114" width="300" height="7" rx="1" />
        <rect x="50" y="198" width="300" height="8" rx="1" />
      </g>

      {/* lower shelf: standing scrolls */}
      {heights.map((h, i) => {
        const x = 80 + i * 22;
        const y = 198 - h;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width="16"
              height={h}
              rx="3"
              fill={fills[i % fills.length]}
              stroke="#5d4037"
              strokeWidth="1"
            />
            <rect x={x} y={y + h * 0.35} width="16" height="4" fill="#d4af37" opacity="0.8" />
          </g>
        );
      })}

      {/* lower shelf: scrolls lying down */}
      <rect x="262" y="182" width="66" height="16" rx="8" fill="#4a2f25" stroke="#5d4037" />
      <rect x="268" y="166" width="54" height="16" rx="8" fill="#6d4c41" stroke="#5d4037" />
      <rect x="292" y="182" width="4" height="16" fill="#d4af37" opacity="0.8" />
      <rect x="292" y="166" width="4" height="16" fill="#d4af37" opacity="0.8" />

      {/* upper shelf: scrolls lying down */}
      <rect x="80" y="100" width="80" height="14" rx="7" fill="#5d4037" stroke="#3e2723" />
      <rect x="86" y="86" width="64" height="14" rx="7" fill="#4a2f25" stroke="#5d4037" />
      <rect x="116" y="100" width="4" height="14" fill="#d4af37" opacity="0.8" />
      <rect x="112" y="86" width="4" height="14" fill="#d4af37" opacity="0.8" />

      {/* the cat */}
      <path
        d="M290 112 C 318 112, 322 84, 304 78"
        fill="none"
        stroke="#5d4037"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M290 112 C 318 112, 322 84, 304 78"
        fill="none"
        stroke="#1a110d"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <ellipse cx="272" cy="92" rx="20" ry="22" fill="#1a110d" stroke="#5d4037" strokeWidth="2" />
      <polygon
        points="259,56 260,40 271,50"
        fill="#1a110d"
        stroke="#5d4037"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <polygon
        points="285,56 284,40 273,50"
        fill="#1a110d"
        stroke="#5d4037"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <ellipse cx="272" cy="62" rx="15" ry="13" fill="#1a110d" stroke="#5d4037" strokeWidth="2" />
      {[266, 278].map((cx) => (
        <ellipse key={cx} cx={cx} cy="62" rx="3" ry="3.6" fill="#d4af37">
          <animate
            attributeName="ry"
            values="3.6;3.6;0.4;3.6;3.6"
            keyTimes="0;0.9;0.94;0.98;1"
            dur="5s"
            repeatCount="indefinite"
          />
        </ellipse>
      ))}
      <ellipse cx="262" cy="112" rx="6" ry="3.5" fill="#2c1810" />
      <ellipse cx="282" cy="112" rx="6" ry="3.5" fill="#2c1810" />
    </svg>
  );
}

/* ================================================================
   Scene 2: a hanging scroll with a bookmark ribbon, cat tail and paw prints
   ================================================================ */
function ScrollScene() {
  return (
    <svg
      viewBox="0 0 400 220"
      className="size-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="scrollGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#d4af37" stopOpacity="0.16" />
          <stop offset="1" stopColor="#d4af37" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="200" cy="110" r="160" fill="url(#scrollGlow)" />

      {/* paw prints walking toward the scroll */}
      <g fill="#d4af37" opacity="0.22">
        <PawShape x={62} y={188} r={-15} s={1.1} />
        <PawShape x={92} y={158} r={10} s={1.1} />
        <PawShape x={64} y={128} r={-15} s={1.1} />
        <PawShape x={96} y={98} r={10} s={1.1} />
      </g>

      {/* the cat's tail, curling out from behind the scroll */}
      <path
        d="M254 196 C 300 196, 312 150, 294 128"
        fill="none"
        stroke="#5d4037"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M254 196 C 300 196, 312 150, 294 128"
        fill="none"
        stroke="#1a110d"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* hanging cord */}
      <path d="M150 26 L200 4 L250 26" fill="none" stroke="#8d6e63" strokeWidth="1.5" />
      <circle cx="200" cy="4" r="3" fill="#d4af37" />

      {/* top rod, mounting, paper */}
      <rect x="140" y="22" width="120" height="8" rx="4" fill="#5d4037" />
      <rect x="148" y="30" width="104" height="160" fill="#3e2723" stroke="#5d4037" />
      <rect
        x="160"
        y="46"
        width="80"
        height="126"
        fill="#14100d"
        stroke="#d4af37"
        strokeOpacity="0.3"
      />

      {/* brushed columns of text */}
      <g
        stroke="#d4af37"
        strokeOpacity="0.45"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="7 5"
      >
        <line x1="180" y1="58" x2="180" y2="150" />
        <line x1="200" y1="58" x2="200" y2="132" />
        <line x1="220" y1="58" x2="220" y2="124" />
      </g>

      {/* hanko seal */}
      <rect x="212" y="146" width="18" height="18" rx="2" fill="#d4af37" />
      <text x="221" y="159.5" textAnchor="middle" fontSize="13" fill="#1a110d" fontFamily="serif">
        猫
      </text>

      {/* bottom roller */}
      <rect x="140" y="190" width="120" height="8" rx="4" fill="#5d4037" />
      <circle cx="140" cy="194" r="6" fill="#d4af37" stroke="#5d4037" />
      <circle cx="260" cy="194" r="6" fill="#d4af37" stroke="#5d4037" />

      {/* bookmark ribbon */}
      <polygon points="228,30 240,30 240,74 234,67 228,74" fill="#d4af37" opacity="0.95" />
    </svg>
  );
}

/* ================================================================
   Shared graphics
   ================================================================ */
function Seigaiha() {
  const mask = "linear-gradient(to bottom, black 0%, transparent 100%)";
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-80 w-full"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <defs>
        <pattern id="archives-seigaiha" width="48" height="24" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#d4af37" strokeOpacity="0.1" strokeWidth="1">
            {[22, 16, 10, 4].map((r) => (
              <g key={r}>
                <circle cx="0" cy="24" r={r} />
                <circle cx="48" cy="24" r={r} />
                <circle cx="24" cy="12" r={r} />
              </g>
            ))}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#archives-seigaiha)" />
    </svg>
  );
}

function CatMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 12 L7 4 L13 9 Q16 8.5 19 9 L25 4 L26 12 Q28 15 28 18 Q28 26 16 26 Q4 26 4 18 Q4 15 6 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17" r="1.3" fill="currentColor" />
      <circle cx="20" cy="17" r="1.3" fill="currentColor" />
      <path d="M15 20.5 L17 20.5 L16 21.8 Z" fill="currentColor" />
      <path
        d="M3 19 L9 20 M3 22.5 L9 21.5 M29 19 L23 20 M29 22.5 L23 21.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Paw({ className }: { className?: string }) {
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

/* A paw print placed inside another SVG, centred on (x, y) */
function PawShape({ x, y, r, s }: { x: number; y: number; r: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s}) translate(-12 -12)`}>
      <ellipse cx="12" cy="16" rx="5" ry="4" />
      <circle cx="5" cy="10" r="2.2" />
      <circle cx="9.5" cy="5.5" r="2.2" />
      <circle cx="14.5" cy="5.5" r="2.2" />
      <circle cx="19" cy="10" r="2.2" />
    </g>
  );
}
