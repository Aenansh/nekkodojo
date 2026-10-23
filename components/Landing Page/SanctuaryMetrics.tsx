"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { animate, motion, useInView } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Grain, LanternGlow, Paw } from "./DojoGraphics";
import type { Belt, MetricsResponse } from "@/types/metrics";

const BELT_COLOR: Record<Belt, string> = {
  White: "#eaddcf",
  Yellow: "#d4af37",
  Orange: "#d97736",
  Green: "#6b8f4e",
  Blue: "#5685b8",
  Purple: "#8b6aac",
  Brown: "#8d6e63",
  Black: "#0b0807",
};

const NUMERALS = ["一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
const EMPTY_STATS = {
  problemsPracticedToday: 0,
  activeNow: 0,
  katasCompleted: 0,
  hourly: Array.from({ length: 24 }, () => 0),
};

function isMetricsResponse(value: unknown): value is MetricsResponse {
  if (typeof value !== "object" || value === null || !("stats" in value) || !("sensei" in value)) {
    return false;
  }

  const stats = value.stats;
  const sensei = value.sensei;
  const belts: Belt[] = ["White", "Yellow", "Orange", "Green", "Blue", "Purple", "Brown", "Black"];

  return (
    typeof stats === "object" &&
    stats !== null &&
    "problemsPracticedToday" in stats &&
    typeof stats.problemsPracticedToday === "number" &&
    "activeNow" in stats &&
    typeof stats.activeNow === "number" &&
    "katasCompleted" in stats &&
    typeof stats.katasCompleted === "number" &&
    "hourly" in stats &&
    Array.isArray(stats.hourly) &&
    stats.hourly.length === 24 &&
    stats.hourly.every((count) => typeof count === "number") &&
    Array.isArray(sensei) &&
    sensei.every(
      (member) =>
        typeof member === "object" &&
        member !== null &&
        "name" in member &&
        typeof member.name === "string" &&
        "belt" in member &&
        typeof member.belt === "string" &&
        belts.some((belt) => belt === member.belt) &&
        "solved" in member &&
        typeof member.solved === "number"
    )
  );
}

export default function SanctuaryMetrics() {
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const loadMetrics = async () => {
      try {
        const response = await fetch("/api/metrics", { signal: controller.signal });
        if (!response.ok) throw new Error(`Metrics request failed (${response.status})`);

        const data: unknown = await response.json();
        if (!isMetricsResponse(data)) throw new Error("Metrics response has an invalid format");

        setMetrics(data);
        setLoadError(false);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        console.error("[SANCTUARY_METRICS_LOAD]", error);
        setLoadError(true);
      }
    };

    void loadMetrics();
    const interval = window.setInterval(() => void loadMetrics(), 60_000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, []);

  const stats = metrics?.stats ?? EMPTY_STATS;
  const sensei = metrics?.sensei ?? [];
  const peak = Math.max(...stats.hourly, 1);

  return (
    <section id="sanctuary" className="relative w-full overflow-hidden bg-[#0f0b0a] px-6 py-32">
      <Grain variant="tatami" strength={0.6} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-[#120d0a] to-transparent" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-16 max-w-xl"
        >
          <span className="font-serif text-sm tracking-[0.5em] text-[#d4af37]/80">道場の今</span>
          <h2 className="mt-4 font-serif text-4xl font-bold tracking-wide text-[#eaddcf] md:text-5xl">
            Sanctuary <span className="text-[#d4af37]">Metrics</span>
          </h2>
          <p className="mt-5 text-lg font-light leading-relaxed text-[#a1887f]">
            A quiet look at the dojo right now: who is training, and who has been training longest.
          </p>
        </motion.div>

        <div className="grid items-start gap-8 lg:grid-cols-12">
          {                                     }
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden rounded-lg border border-[#5c3d21] bg-[#18120e] p-8 lg:col-span-5"
          >
            <LanternGlow className="-left-24 -top-24 size-96" />
            <Grain variant="washi" strength={0.8} />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#5c3d21] bg-[#120d0a] px-3 py-1 text-xs text-[#a1887f]">
                <span className="relative flex size-2">
                {metrics && !loadError && (
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                )}
                <span
                  className={`relative inline-flex size-2 rounded-full ${
                    metrics && !loadError ? "bg-emerald-500" : "bg-[#8d6e63]"
                  }`}
                />
                </span>
                {loadError ? "Metrics unavailable" : metrics ? "Live dojo metrics" : "Loading metrics"}
              </span>

              <p className="mt-8 text-sm text-[#8d6e63]">Problems practiced today</p>
              <p className="mt-1 font-serif text-6xl font-bold tabular-nums text-[#d4af37] drop-shadow-[0_0_18px_rgba(212,175,55,0.25)] md:text-7xl">
                {metrics ? <CountUp to={stats.problemsPracticedToday} /> : "—"}
              </p>

              <div className="mt-8" aria-label="Practice activity by hour">
                <div className="flex h-20 items-end gap-[3px]">
                  {stats.hourly.map((v, i) => (
                    <motion.span
                      key={i}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.6, delay: 0.3 + i * 0.025, ease: "easeOut" }}
                      style={{ height: `${v === 0 ? 0 : Math.max((v / peak) * 100, 6)}%`, originY: 1 }}
                      className="flex-1 rounded-t-[2px] bg-linear-to-t from-[#5c3d21] to-[#d4af37]/80"
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[10px] tabular-nums text-[#5d4037]">
                  <span>00</span>
                  <span>06</span>
                  <span>12</span>
                  <span>18</span>
                  <span>24</span>
                </div>
              </div>

              <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-[#3a2318] pt-6">
                <div>
                  <dt className="text-xs text-[#8d6e63]">Active (last 15 min)</dt>
                  <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums text-[#eaddcf]">
                    {metrics ? <CountUp to={stats.activeNow} /> : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[#8d6e63]">Katas completed</dt>
                  <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums text-[#eaddcf]">
                    {metrics ? <CountUp to={stats.katasCompleted} /> : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </motion.div>

          {                                                 }
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="relative lg:col-span-7 lg:mt-12"
          >
            {                                }
            <span className="absolute -top-8 left-12 h-8 w-px bg-[#5c3d21]" aria-hidden="true" />
            <span className="absolute -top-8 right-12 h-8 w-px bg-[#5c3d21]" aria-hidden="true" />

            <div className="relative overflow-hidden rounded-md border border-[#5c3d21] bg-[#2b1a12] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
              <Grain variant="hinoki" strength={1} />

              {              }
              <div className="relative flex items-center justify-between border-b border-[#5c3d21] bg-[#3a2318] px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-xl text-[#d4af37]">師範</span>
                  <span className="h-4 w-px bg-[#5c3d21]" />
                  <span className="text-sm text-[#a1887f]">Top sensei</span>
                </div>
                <Paw className="size-5 -rotate-12 text-[#d4af37]/60" />
              </div>

              {               }
              <ol className="relative space-y-2.5 p-4 sm:p-5">
                {sensei.length === 0 && (
                  <li className="rounded-[3px] border border-[#5c3d21] bg-[#3a2318]/60 px-4 py-3 text-sm text-[#8d6e63]">
                    {loadError ? "The roster is temporarily unavailable." : "No completed katas yet."}
                  </li>
                )}
                {sensei.slice(0, NUMERALS.length).map((s, i) => (
                  <motion.li
                    key={s.name}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                    className={`group relative flex items-center gap-4 rounded-[3px] border py-3 pl-9 pr-4 transition-colors duration-300 ${
                      i === 0
                        ? "border-[#d4af37]/60 bg-[#3a2318]"
                        : "border-[#5c3d21] bg-[#3a2318]/60 hover:border-[#d4af37]/40 hover:bg-[#3a2318]"
                    }`}
                  >
                    {                                      }
                    <span
                      aria-hidden="true"
                      className="absolute left-3 top-1/2 size-2.5 -translate-y-1/2 rounded-full border border-[#5c3d21] bg-[#120d0a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]"
                    />

                    <span
                      className={`flex size-9 shrink-0 items-center justify-center rounded-[3px] border font-serif text-lg ${
                        i === 0
                          ? "border-[#d4af37] bg-[#d4af37] text-[#1a110d]"
                          : "border-[#5c3d21] bg-[#18120e] text-[#d4af37]"
                      }`}
                    >
                      {NUMERALS[i]}
                    </span>

                    <span className="min-w-0 flex-1 truncate font-semibold text-[#eaddcf]">
                      {s.name}
                    </span>

                    <span className="hidden items-center gap-2 text-xs text-[#a1887f] sm:flex">
                      <span
                        className="h-1.5 w-4 rounded-full border border-[#5c3d21]"
                        style={{ background: BELT_COLOR[s.belt] }}
                      />
                      {s.belt}
                    </span>

                    <span className="w-16 text-right font-mono text-sm tabular-nums text-[#d4af37]">
                      {s.solved}
                    </span>
                  </motion.li>
                ))}
              </ol>

              <div className="relative border-t border-[#5c3d21] px-6 py-4">
                <Link
                  href="/leaderboard"
                  className="group/link inline-flex items-center gap-2 text-sm font-semibold text-[#d4af37] transition-colors hover:text-[#eaddcf]"
                >
                  View the full roster
                  <ArrowRight className="size-4 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CountUp({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.8,
      ease: "easeOut",
      onUpdate: (latest) => setValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, to]);

  return <span ref={ref}>{value.toLocaleString("en-US")}</span>;
}
