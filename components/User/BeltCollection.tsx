"use client";

import { cn } from "@/lib/utils";
import { SectionHeading } from "./Profileornaments";
import { BELTS } from "@/constants/belts";

export function getBeltVisual(name: string) {
  const key = name.toLowerCase().split(" ")[0];
  const belt = BELTS.find((b) => b.name.toLowerCase().startsWith(key));
  return { hex: belt?.hex ?? "#d4af37", kanji: belt?.kanji ?? "" };
}

export function BeltProgress({ totalSolved }: { totalSolved: number }) {
  const currentIndex = Math.max(
    0,
    BELTS.findLastIndex((belt) => totalSolved >= belt.minSolved)
  );

  const current = BELTS[currentIndex];
  const next = BELTS[currentIndex + 1];
  const remaining = next ? next.minSolved - totalSolved : 0;

  const progress = next
    ? Math.min(
        100,
        Math.round(((totalSolved - current.minSolved) / (next.minSolved - current.minSolved)) * 100)
      )
    : 100;

  return (
    <section aria-labelledby="belt-heading">
      <SectionHeading id="belt-heading" title="Belt" kanji="帯" />

      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] md:items-end">
        <div>
          <p className="text-sm text-[#a1887f]">Current belt</p>
          <p className="mt-2 flex items-baseline gap-3 font-serif text-4xl text-[#eaddcf]">
            {current.name}
            <span lang="ja" className="text-xl text-[#8d6e63]">
              {current.kanji}
            </span>
          </p>
        </div>

        <div>
          {next ? (
            <>
              <div className="flex items-baseline justify-between gap-4 text-sm">
                <p className="text-[#a1887f]">
                  <span className="tabular-nums text-[#eaddcf]">{remaining}</span> more{" "}
                  {remaining === 1 ? "solve" : "solves"} to reach {next.name}
                </p>
                <p className="tabular-nums text-[#8d6e63]">{progress}%</p>
              </div>
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progress to ${next.name}`}
                className="mt-3 h-[3px] w-full rounded-full bg-[#3e2723]"
              >
                <div
                  className="h-full rounded-full bg-[#d4af37] transition-[width] duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-[#a1887f]">You have reached the highest belt.</p>
          )}
        </div>
      </div>

      <ol className="mt-10 grid grid-cols-4 gap-x-4 gap-y-8 md:grid-cols-8">
        {BELTS.map((belt, index) => {
          const unlocked = totalSolved >= belt.minSolved;
          const active = index === currentIndex;

          return (
            <li key={belt.name} aria-current={active ? "step" : undefined} className="min-w-0">
              <span
                className={cn(
                  "block h-2 rounded-full border",
                  unlocked ? "border-white/10" : "border-[#3e2723]",
                  active && "ring-1 ring-[#d4af37] ring-offset-2 ring-offset-[#0f0b0a]"
                )}
                style={{ backgroundColor: unlocked ? belt.hex : "transparent" }}
              />
              <p className={cn("mt-4 text-sm", unlocked ? "text-[#eaddcf]" : "text-[#8d6e63]")}>
                {belt.name.replace(" Belt", "")}{" "}
                <span lang="ja" className="text-[#8d6e63]">
                  {belt.kanji}
                </span>
              </p>
              <p className="mt-0.5 text-xs tabular-nums text-[#8d6e63]">
                {belt.minSolved === 0 ? "Starting belt" : `${belt.minSolved} solved`}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
