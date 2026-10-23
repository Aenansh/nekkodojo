import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Grain, LanternGlow, Paw } from "@/components/Landing Page/DojoGraphics";

export const metadata: Metadata = {
  title: "Wall of Fame",
  description: "Members whose discipline the dojo remembers.",
};

const HONOURS = [
  {
    mark: "黒",
    honour: "First Black Belt",
    name: "Kenji_M",
    note: "Cleared every kata on the path.",
    tilt: -2,
  },
  {
    mark: "継",
    honour: "Unbroken Streak",
    name: "SoraCodes",
    note: "Practised every day for a full year.",
    tilt: 1.5,
  },
  {
    mark: "師",
    honour: "Most Helpful Sensei",
    name: "tanuki_dev",
    note: "Answered hundreds of questions kindly.",
    tilt: -1,
  },
  {
    mark: "速",
    honour: "Swiftest Paw",
    name: "mochi.exe",
    note: "Fastest clean solve on the hardest kata.",
    tilt: 2,
  },
  {
    mark: "友",
    honour: "Sparring Partner",
    name: "ronin_rae",
    note: "Hosted the most friendly arena sessions.",
    tilt: -1.5,
  },
  {
    mark: "新",
    honour: "Rising Student",
    name: "haru_codes",
    note: "Climbed three belts in a single season.",
    tilt: 1,
  },
];

export default function WallOfFamePage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#120d0a] px-6 pb-28 pt-40 text-[#eaddcf]">
      <Grain variant="hinoki" strength={0.9} />
      <LanternGlow className="left-1/2 top-40 size-[900px] -translate-x-1/2" />

      {                                     }
      <style>{`
        @keyframes ema-swing {
          0%, 100% { transform: rotate(var(--tilt)); }
          25% { transform: rotate(calc(var(--tilt) + 4deg)); }
          75% { transform: rotate(calc(var(--tilt) - 3deg)); }
        }
        .ema { transform: rotate(var(--tilt)); transform-origin: 50% -28px; }
        .ema:hover { animation: ema-swing 1.6s ease-in-out; }
        @media (prefers-reduced-motion: reduce) { .ema:hover { animation: none; } }
      `}</style>

      <div className="relative mx-auto max-w-6xl">
        <header className="mb-24 text-center">
          <span className="font-serif text-sm tracking-[0.5em] text-[#d4af37]/80">殿堂</span>
          <h1 className="mt-4 font-serif text-4xl font-bold tracking-wide md:text-6xl">
            Wall of <span className="text-[#d4af37]">Fame</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg font-light leading-relaxed text-[#a1887f]">
            At a shrine, wishes are written on small wooden plaques and left to hang. Here, we hang
            the names of those who earned them.
          </p>
        </header>

        {                                    }
        <div className="relative">
          {              }
          <div className="absolute inset-x-0 -top-3 h-4 rounded-sm border border-[#5c3d21] bg-linear-to-b from-[#4a2f25] to-[#2b1a12] shadow-[0_10px_20px_-8px_rgba(0,0,0,0.9)]" />

          <ul className="grid gap-x-8 gap-y-20 pt-16 sm:grid-cols-2 lg:grid-cols-3">
            {HONOURS.map((h) => (
              <li key={h.name} className="flex justify-center">
                <Ema {...h} />
              </li>
            ))}
          </ul>
        </div>

        {                                      }
        <div className="mt-28 flex flex-col items-center gap-5 text-center">
          <Paw className="size-6 -rotate-12 text-[#d4af37]/50" />
          <p className="max-w-md font-serif text-xl italic text-[#a1887f]">
            There is always room on the rack for one more plaque.
          </p>
          <Link
            href="/problems"
            className="group inline-flex items-center gap-2 rounded-sm border border-[#5c3d21] bg-[#2b1a12] px-6 py-3 text-sm font-semibold text-[#d4af37] transition-all duration-300 hover:border-[#d4af37] hover:bg-[#3a2318]"
          >
            Begin your training
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </main>
  );
}

const EMA_SHAPE = "polygon(50% 0, 100% 15%, 100% 100%, 0 100%, 0 15%)";

function Ema({
  mark,
  honour,
  name,
  note,
  tilt,
}: {
  mark: string;
  honour: string;
  name: string;
  note: string;
  tilt: number;
}) {
  return (
    <article
      className="ema relative w-full max-w-[280px]"
      style={{ ["--tilt" as string]: `${tilt}deg` }}
    >
      {                          }
      <span className="absolute -top-12 left-1/2 h-12 w-px -translate-x-[9px] bg-[#8d6e63]" />
      <span className="absolute -top-12 left-1/2 h-12 w-px translate-x-[9px] bg-[#8d6e63]" />
      <span className="absolute -top-[3px] left-1/2 size-2.5 -translate-x-1/2 rounded-full bg-[#d4af37]" />

      <div
        className="bg-[#5c3d21] p-0.5 drop-shadow-[0_18px_24px_rgba(0,0,0,0.6)]"
        style={{ clipPath: EMA_SHAPE }}
      >
        <div
          className="relative flex min-h-[340px] flex-col items-center bg-[#2b1a12] px-6 pb-7 pt-14 text-center"
          style={{ clipPath: EMA_SHAPE }}
        >
          <Grain variant="hinoki" strength={1} />

          {                  }
          <span className="relative font-serif text-5xl text-[#d4af37] drop-shadow-[0_0_12px_rgba(212,175,55,0.3)]">
            {mark}
          </span>
          <span className="relative mt-3 h-px w-12 bg-[#5c3d21]" />

          <h2 className="relative mt-4 font-serif text-xl font-semibold text-[#eaddcf]">
            {honour}
          </h2>
          <p className="relative mt-1 font-semibold text-[#d4af37]">{name}</p>
          <p className="relative mt-4 text-sm leading-snug text-[#a1887f]">{note}</p>

          <Paw className="relative mt-auto size-5 rotate-12 pt-1 text-[#d4af37]/40" />
        </div>
      </div>
    </article>
  );
}
