import type { Metadata } from "next";
import { Grain } from "@/components/Landing Page/DojoGraphics";

export const metadata: Metadata = {
  title: "System Status",
  description: "Is the dojo open? Live status of every service.",
};

type Status = "operational" | "degraded" | "outage";

const SERVICES: { name: string; note: string; status: Status; uptime: number; seed: number }[] = [
  { name: "Website", note: "Pages and navigation", status: "operational", uptime: 99.98, seed: 3 },
  {
    name: "Code Execution",
    note: "Running your solutions",
    status: "operational",
    uptime: 99.82,
    seed: 11,
  },
  { name: "NekkoChat", note: "Real-time sparring", status: "operational", uptime: 99.91, seed: 23 },
  {
    name: "Authentication",
    note: "Sign in and sign up",
    status: "operational",
    uptime: 99.99,
    seed: 37,
  },
];

const INCIDENTS: { date: string; title: string; detail: string; resolved: boolean }[] = [
  {
    date: "Past 90 days",
    title: "No major incidents",
    detail: "The dojo has stayed open. Small blips are shown in the bars above.",
    resolved: true,
  },
];

const STATUS_STYLE: Record<
  Status,
  { label: string; text: string; glow: string; bar: string; lantern: string }
> = {
  operational: {
    label: "Operational",
    text: "text-emerald-400",
    glow: "rgba(52,211,153,0.35)",
    bar: "bg-emerald-500/80",
    lantern: "#34d399",
  },
  degraded: {
    label: "Degraded",
    text: "text-amber-400",
    glow: "rgba(251,191,36,0.35)",
    bar: "bg-amber-500/80",
    lantern: "#fbbf24",
  },
  outage: {
    label: "Outage",
    text: "text-red-400",
    glow: "rgba(248,113,113,0.35)",
    bar: "bg-red-500/80",
    lantern: "#f87171",
  },
};

function history(seed: number): Status[] {
  let a = seed;
  const rand = () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: 90 }, () => {
    const r = rand();
    if (r > 0.985) return "outage";
    if (r > 0.95) return "degraded";
    return "operational";
  });
}

export default function StatusPage() {
  const worst: Status = SERVICES.some((s) => s.status === "outage")
    ? "outage"
    : SERVICES.some((s) => s.status === "degraded")
      ? "degraded"
      : "operational";

  const headline =
    worst === "operational"
      ? "The dojo is open"
      : worst === "degraded"
        ? "Some training is slower than usual"
        : "Part of the dojo is closed";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0807] px-6 pb-28 pt-40 text-[#eaddcf]">
      <Grain variant="tatami" strength={0.5} />

      <div className="relative mx-auto max-w-5xl">
        {                                    }
        <header className="text-center">
          <span className="font-serif text-sm tracking-[0.5em] text-[#d4af37]/80">状態</span>
          <h1 className="mt-4 font-serif text-4xl font-bold tracking-wide md:text-5xl">
            System <span className="text-[#d4af37]">Status</span>
          </h1>
        </header>

        <div className="relative mt-16">
          {                                     }
          <div className="absolute inset-x-6 top-0 h-px bg-[#5c3d21]" />
          <ul className="grid grid-cols-2 gap-y-10 md:grid-cols-4">
            {SERVICES.map((s) => (
              <li key={s.name} className="flex flex-col items-center">
                <Lantern
                  color={STATUS_STYLE[s.status].lantern}
                  glow={STATUS_STYLE[s.status].glow}
                />
                <p className="mt-3 font-serif text-lg font-semibold">{s.name}</p>
                <p className={`text-sm ${STATUS_STYLE[s.status].text}`}>
                  {STATUS_STYLE[s.status].label}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {                                          }
        <section
          aria-live="polite"
          className="mt-16 flex items-center gap-5 rounded-md border border-[#5c3d21] bg-[#18120e] px-6 py-5"
          style={{ boxShadow: `0 0 40px -18px ${STATUS_STYLE[worst].glow}` }}
        >
          <span className="relative flex size-3 shrink-0">
            <span
              className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${STATUS_STYLE[worst].bar}`}
            />
            <span
              className={`relative inline-flex size-3 rounded-full ${STATUS_STYLE[worst].bar}`}
            />
          </span>
          <div>
            <h2 className="font-serif text-xl font-semibold">{headline}</h2>
            <p className="text-sm text-[#8d6e63]">
              Every service is checked continuously and shown below.
            </p>
          </div>
        </section>

        {                                           }
        <section className="mt-10 space-y-4">
          {SERVICES.map((s) => {
            const days = history(s.seed);
            return (
              <article
                key={s.name}
                className="rounded-md border border-[#3a2318] bg-[#120d0a] p-5 transition-colors hover:border-[#5c3d21]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{s.name}</h3>
                    <p className="text-xs text-[#8d6e63]">{s.note}</p>
                  </div>
                  <p className="font-mono text-sm tabular-nums text-[#a1887f]">
                    {s.uptime.toFixed(2)}% <span className="text-[#5d4037]">uptime</span>
                  </p>
                </div>

                <div
                  className="mt-4 flex h-9 items-end gap-0.5"
                  role="img"
                  aria-label={`${s.name} status over the past 90 days`}
                >
                  {days.map((d, i) => (
                    <span
                      key={i}
                      title={`${90 - i} days ago: ${STATUS_STYLE[d].label}`}
                      className={`flex-1 rounded-[1px] ${STATUS_STYLE[d].bar} ${
                        d === "operational" ? "h-full" : d === "degraded" ? "h-3/5" : "h-1/3"
                      } transition-opacity hover:opacity-70`}
                    />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-[#5d4037]">
                  <span>90 days ago</span>
                  <span>Today</span>
                </div>
              </article>
            );
          })}
        </section>

        {                                     }
        <section className="mt-16">
          <h2 className="mb-5 font-serif text-2xl font-semibold text-[#d4af37]">Past incidents</h2>
          <ul className="space-y-3">
            {INCIDENTS.map((inc) => (
              <li
                key={inc.title}
                className="rounded-md border border-[#3a2318] bg-[#120d0a] px-5 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{inc.title}</p>
                  <span className="text-xs text-[#8d6e63]">{inc.date}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#a1887f]">{inc.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        {            }
        <ul className="mt-10 flex flex-wrap items-center justify-center gap-5 text-xs text-[#8d6e63]">
          {(Object.keys(STATUS_STYLE) as Status[]).map((k) => (
            <li key={k} className="flex items-center gap-2">
              <span className={`size-2.5 rounded-[2px] ${STATUS_STYLE[k].bar}`} />
              {STATUS_STYLE[k].label}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function Lantern({ color, glow }: { color: string; glow: string }) {
  return (
    <svg viewBox="0 0 80 110" className="h-28 w-20" aria-hidden="true">
      <circle cx="40" cy="62" r="40" fill={glow} opacity="0.55" />
      <line x1="40" y1="0" x2="40" y2="16" stroke="#8d6e63" strokeWidth="1.5" />
      {          }
      <rect x="26" y="16" width="28" height="6" rx="2" fill="#2b1a12" stroke="#5c3d21" />
      <rect x="26" y="102" width="28" height="6" rx="2" fill="#2b1a12" stroke="#5c3d21" />
      {          }
      <ellipse
        cx="40"
        cy="62"
        rx="24"
        ry="40"
        fill={color}
        fillOpacity="0.28"
        stroke="#5c3d21"
        strokeWidth="1.5"
      />
      {          }
      <g stroke="#5c3d21" strokeWidth="1" fill="none">
        <ellipse cx="40" cy="62" rx="24" ry="10" />
        <ellipse cx="40" cy="46" rx="21" ry="8" />
        <ellipse cx="40" cy="78" rx="21" ry="8" />
      </g>
      {           }
      <ellipse cx="40" cy="62" rx="6" ry="9" fill={color} opacity="0.9" />
    </svg>
  );
}
