"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeading, CatSeal } from "./Profileornaments";

// Types
interface CategoryStat {
  name: string;
  solved: number;
  total: number;
}

interface CompanyStat {
  id: string;
  name: string;
  logo: string;
  solved: number;
  total: number;
}

interface DifficultyStat {
  name: string;
  value: number;
  color: string;
}

interface ActivityPoint {
  date: string;
  count: number;
}

interface ProfileChartsProps {
  difficultyStats: DifficultyStat[];
  categoryStats: CategoryStat[];
  totalSolved: number;
  companyStats: CompanyStat[];
  activityData?: ActivityPoint[];
  isCurrentUser: boolean;
}

export default function ProfileCharts({
  difficultyStats,
  categoryStats,
  totalSolved,
  companyStats,
  activityData = [],
  isCurrentUser,
}: ProfileChartsProps) {
  const [expandCategories, setExpandCategories] = useState(false);
  const [expandCompanies, setExpandCompanies] = useState(false);

  const visibleCategories = expandCategories ? categoryStats : categoryStats.slice(0, 6);
  const visibleCompanies = expandCompanies ? companyStats : companyStats.slice(0, 6);

  // --- EMPTY STATE ---
  if (totalSolved <= 0) {
    return (
      <div className="space-y-16 md:space-y-20">
        <section className="flex flex-col items-center border-y border-[#3e2723] px-4 py-16 text-center">
          <CatSeal className="size-12 text-[#5d4037]" />
          {isCurrentUser ? (
            <>
              <h2 className="mt-6 font-serif text-2xl text-[#eaddcf]">No problems solved yet</h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#a1887f]">
                Solve your first problem to start earning belts and filling in your training log.
              </p>
              <Button
                asChild
                className="mt-6 rounded-full bg-[#d4af37] px-6 text-[#0f0b0a] hover:bg-[#b5952f]"
              >
                <Link href="/problems">Start practicing</Link>
              </Button>
            </>
          ) : (
            <h2 className="mt-6 font-serif text-xl text-[#a1887f]">No problems solved yet</h2>
          )}
        </section>
        {activityData.length > 0 && (
          <section aria-labelledby="log-heading">
            <SectionHeading id="log-heading" title="Training log" kanji="稽古" />
            <TrainingLog data={activityData} />
          </section>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-16 md:space-y-20">
      {/* --- DIFFICULTY --- */}
      <section aria-labelledby="difficulty-heading">
        <SectionHeading id="difficulty-heading" title="Difficulty" kanji="難易度" />

        <div className="mt-8 grid gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:items-end md:gap-16">
          <div>
            <p className="font-serif text-6xl tabular-nums leading-none text-[#eaddcf]">
              {totalSolved}
            </p>
            <p className="mt-2 text-sm text-[#a1887f]">problems solved</p>
          </div>

          <div>
            <div
              role="img"
              aria-label={difficultyStats.map((s) => `${s.name}: ${s.value}`).join(", ")}
              className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full bg-[#3e2723]"
            >
              {difficultyStats
                .filter((s) => s.value > 0)
                .map((s) => (
                  <span
                    key={s.name}
                    style={{
                      width: `${(s.value / totalSolved) * 100}%`,
                      backgroundColor: s.color,
                    }}
                  />
                ))}
            </div>

            <dl className="mt-5 grid grid-cols-3 gap-4">
              {difficultyStats.map((s) => (
                <div key={s.name}>
                  <dt className="flex items-center gap-2 text-sm text-[#a1887f]">
                    <span
                      aria-hidden
                      className="size-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </dt>
                  <dd className="mt-1 font-serif text-2xl tabular-nums text-[#eaddcf]">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* --- TRAINING LOG --- */}
      {activityData.length > 0 && (
        <section aria-labelledby="log-heading">
          <SectionHeading id="log-heading" title="Training log" kanji="稽古" />
          <TrainingLog data={activityData} />
        </section>
      )}

      {/* --- CATEGORIES --- */}
      {categoryStats.length > 0 && (
        <section aria-labelledby="category-heading">
          <SectionHeading id="category-heading" title="Categories" kanji="分野" />
          <ul className="mt-2 grid md:grid-cols-2 md:gap-x-16">
            {visibleCategories.map((cat) => (
              <LedgerRow key={cat.name} label={cat.name} solved={cat.solved} total={cat.total} />
            ))}
          </ul>
          {categoryStats.length > 6 && (
            <ToggleButton
              expanded={expandCategories}
              count={categoryStats.length}
              onClick={() => setExpandCategories((v) => !v)}
            />
          )}
        </section>
      )}

      {/* --- COMPANIES --- */}
      {companyStats.length > 0 && (
        <section aria-labelledby="company-heading">
          <SectionHeading id="company-heading" title="Companies" kanji="企業" />
          <ul className="mt-2 grid md:grid-cols-2 md:gap-x-16">
            {visibleCompanies.map((company) => (
              <LedgerRow
                key={company.id}
                label={company.name}
                solved={company.solved}
                total={company.total}
                leading={
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={company.logo}
                    alt=""
                    className="size-5 shrink-0 rounded-full bg-[#eaddcf]/10 object-contain"
                  />
                }
              />
            ))}
          </ul>
          {companyStats.length > 6 && (
            <ToggleButton
              expanded={expandCompanies}
              count={companyStats.length}
              onClick={() => setExpandCompanies((v) => !v)}
            />
          )}
        </section>
      )}
    </div>
  );
}

// --- LEDGER ROW: label, count, one thin line ---

function LedgerRow({
  label,
  solved,
  total,
  leading,
}: {
  label: string;
  solved: number;
  total: number;
  leading?: ReactNode;
}) {
  const pct = total > 0 ? Math.round((solved / total) * 100) : 0;

  return (
    <li className="border-b border-[#3e2723]/70 py-4">
      <div className="flex items-center justify-between gap-4">
        <span className="flex min-w-0 items-center gap-3 text-[#eaddcf]">
          {leading}
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 text-sm tabular-nums text-[#a1887f]">
          {solved} of {total}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} progress`}
        className="mt-3 h-[3px] rounded-full bg-[#3e2723]"
      >
        <div className="h-full rounded-full bg-[#d4af37]" style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

function ToggleButton({
  expanded,
  count,
  onClick,
}: {
  expanded: boolean;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className="mt-4 text-sm text-[#d4af37] underline-offset-4 hover:underline"
    >
      {expanded ? "Show fewer" : `Show all ${count}`}
    </button>
  );
}

// --- TRAINING LOG (last 26 weeks) ---

const WEEKS = 26;
const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

function levelClass(count: number) {
  if (count <= 0) return "bg-[#3e2723]/50";
  if (count === 1) return "bg-[#d4af37]/30";
  if (count <= 3) return "bg-[#d4af37]/60";
  return "bg-[#d4af37]";
}

function TrainingLog({ data }: { data: ActivityPoint[] }) {
  const { cells, sum } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const point of data) {
      const k = point.date.slice(0, 10);
      counts.set(k, (counts.get(k) ?? 0) + point.count);
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setUTCDate(today.getUTCDate() - today.getUTCDay() - (WEEKS - 1) * 7);

    let sum = 0;
    const cells: ({ key: string; count: number } | null)[] = [];
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setUTCDate(start.getUTCDate() + w * 7 + d);
        if (date > today) {
          cells.push(null);
          continue;
        }
        const key = dayKey(date);
        const count = counts.get(key) ?? 0;
        sum += count;
        cells.push({ key, count });
      }
    }
    return { cells, sum };
  }, [data]);

  return (
    <div className="mt-6">
      <p className="text-sm text-[#a1887f]">
        <span className="tabular-nums text-[#eaddcf]">{sum}</span> {sum === 1 ? "solve" : "solves"}{" "}
        in the past six months
      </p>

      <div className="mt-4 overflow-x-auto pb-2">
        <div className="grid w-max grid-flow-col grid-rows-7 gap-1">
          {cells.map((cell, i) =>
            cell ? (
              <span
                key={cell.key}
                title={`${cell.count} ${cell.count === 1 ? "solve" : "solves"} on ${cell.key}`}
                role="img"
                aria-label={`${cell.count} ${cell.count === 1 ? "solve" : "solves"} on ${cell.key}`}
                className={`size-3 rounded-[2px] ${levelClass(cell.count)}`}
              />
            ) : (
              <span key={`empty-${i}`} className="size-3" aria-hidden />
            )
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-xs text-[#8d6e63]" aria-hidden>
        Fewer
        {[0, 1, 2, 4].map((n) => (
          <span key={n} className={`size-3 rounded-[2px] ${levelClass(n)}`} />
        ))}
        More
      </div>
    </div>
  );
}
