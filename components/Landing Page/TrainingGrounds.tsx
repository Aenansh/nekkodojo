"use client";

import { motion } from "framer-motion";
import { ScrollText } from "lucide-react";
import { EnsoDivider, Grain, LanternGlow, Paw } from "./DojoGraphics";

const BELTS = [
  { name: "White", color: "#eaddcf", topic: "Array traversal" },
  { name: "Yellow", color: "#d4af37", topic: "Two pointers" },
  { name: "Green", color: "#6b8f4e", topic: "Trees & graphs" },
  { name: "Brown", color: "#8d6e63", topic: "Backtracking" },
  { name: "Black", color: "#0b0807", topic: "Dynamic programming" },
];

const COMPLEXITY = [
  { label: "Time", value: "O(n log n)" },
  { label: "Space", value: "O(1)" },
  { label: "Time", value: "O(n)" },
];

export default function TrainingGrounds() {
  return (
    <section
      id="training-grounds"
      className="relative w-full overflow-hidden bg-[#120d0a] px-6 py-32"
    >
      <Grain variant="hinoki" strength={0.7} />
      <LanternGlow className="left-1/2 top-24 size-[780px] -translate-x-1/2" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-[#0f0b0a] to-transparent" />

      <div className="relative z-10 mx-auto max-w-6xl">
        {                                   }
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="mb-20 text-center"
        >
          <EnsoDivider className="mb-8" />
          <span className="font-serif text-sm tracking-[0.5em] text-[#d4af37]/80">修練</span>
          <h2 className="mt-4 font-serif text-4xl font-bold tracking-wide text-[#eaddcf] md:text-5xl">
            The Training <span className="text-[#d4af37]">Grounds</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-light leading-relaxed text-[#a1887f]">
            Mastery is not a sprint through a problem list. It is a discipline: one kata, repeated
            with attention, until the pattern becomes instinct.
          </p>
        </motion.div>

        {                                 }
        <div className="grid gap-5 lg:grid-cols-5">
          {                 }
          <Card className="lg:col-span-3" watermark="型" delay={0}>
            <div className="flex items-start gap-4">
              <IconTile>
                <Paw className="size-6" />
              </IconTile>
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#eaddcf]">Ranked Kata</h3>
                <p className="text-sm text-[#8d6e63]">DSA practice</p>
              </div>
            </div>
            <p className="mt-5 max-w-lg leading-relaxed text-[#a1887f]">
              Problem sets are laid out as belts. Start with the plainest forms, walk the array,
              then climb toward the patterns that take years to see clearly.
            </p>

            <ol className="mt-8 grid grid-cols-5 gap-2 sm:gap-3">
              {BELTS.map((belt, i) => (
                <li key={belt.name} className="space-y-2">
                  <span
                    className="block h-2.5 rounded-full border border-[#5c3d21]"
                    style={{ background: belt.color, opacity: 0.55 + i * 0.1 }}
                  />
                  <p className="text-xs font-semibold text-[#eaddcf]">{belt.name}</p>
                  <p className="text-[11px] leading-snug text-[#8d6e63]">{belt.topic}</p>
                </li>
              ))}
            </ol>
          </Card>

          {               }
          <Card className="lg:col-span-2" watermark="稽古" delay={0.15}>
            <div className="flex items-start gap-4">
              <IconTile>
                <CrossedBlades className="size-6" />
              </IconTile>
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#eaddcf]">
                  NekkoChat &amp; Sparring
                </h3>
                <p className="text-sm text-[#8d6e63]">Real-time, peer to peer (Under development)</p>
              </div>
            </div>
            <p className="mt-5 leading-relaxed text-[#a1887f]">
              Pair up in a shared arena. Write together, run the code live, and see the result the
              moment it lands.
            </p>

            {                                        }
            <div className="mt-6 rounded-md border border-[#5c3d21] bg-[#18120e] p-3 font-mono text-xs">
              <div className="mb-3 flex items-center justify-between text-[#8d6e63]">
                <span className="flex items-center gap-2">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#d4af37] opacity-60" />
                    <span className="relative inline-flex size-2 rounded-full bg-[#d4af37]" />
                  </span>
                  live
                </span>
                <span>2 sparring</span>
              </div>
              <div className="space-y-1.5">
                <span className="block h-1.5 w-3/4 rounded-full bg-[#3a2318]" />
                <span className="block h-1.5 w-1/2 rounded-full bg-[#3a2318]" />
                <span className="block h-1.5 w-2/3 rounded-full bg-[#d4af37]/30" />
              </div>
              <p className="mt-3 text-[#d4af37]">3 / 3 tests passed</p>
            </div>
          </Card>

          {                     }
          <Card className="lg:col-span-5" watermark="巻物" delay={0.3}>
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <div className="flex items-start gap-4">
                  <IconTile>
                    <ScrollText className="size-6" />
                  </IconTile>
                  <div>
                    <h3 className="font-serif text-2xl font-bold text-[#eaddcf]">
                      The Scroll Archives
                    </h3>
                    <p className="text-sm text-[#8d6e63]">Solutions worth studying</p>
                  </div>
                </div>
                <p className="mt-5 max-w-md leading-relaxed text-[#a1887f]">
                  Curated solutions with the reasoning left in. Every scroll comes with a plain
                  breakdown of its time and space cost, so you learn why it works, not just that it
                  does.
                </p>
              </div>

              {                                         }
              <div className="flex flex-wrap items-center justify-start gap-3 md:justify-end">
                {COMPLEXITY.map((c, i) => (
                  <div
                    key={i}
                    className="relative rounded-md border border-[#5c3d21] bg-[#18120e] px-5 py-3 text-center"
                  >
                    <span className="absolute inset-x-3 top-1.5 h-px bg-[#d4af37]/40" />
                    <span className="absolute inset-x-3 bottom-1.5 h-px bg-[#d4af37]/40" />
                    <p className="text-[10px] uppercase tracking-widest text-[#8d6e63]">
                      {c.label}
                    </p>
                    <p className="mt-0.5 font-mono text-base text-[#d4af37]">{c.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function Card({
  children,
  className = "",
  watermark,
  delay,
}: {
  children: React.ReactNode;
  className?: string;
  watermark: string;
  delay: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay }}
      className={`group relative overflow-hidden rounded-lg border border-[#5c3d21] bg-[#2b1a12] p-7 transition-colors duration-500 hover:border-[#d4af37]/60 sm:p-8 ${className}`}
    >
      <Grain variant="washi" strength={0.9} />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 -top-4 select-none font-serif text-8xl leading-none text-[#d4af37]/6 transition-colors duration-500 group-hover:text-[#d4af37]/12"
      >
        {watermark}
      </span>
      {                                                     }
      <span
        aria-hidden="true"
        className="absolute inset-x-8 top-0 h-px origin-center scale-x-0 bg-[#d4af37] transition-transform duration-500 ease-out group-hover:scale-x-100"
      />
      <div className="relative">{children}</div>
    </motion.article>
  );
}

function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-[#5c3d21] bg-[#18120e] text-[#d4af37] transition-colors duration-300 group-hover:border-[#d4af37]/50">
      {children}
    </span>
  );
}

function CrossedBlades({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4 4 L17 17 M20 4 L7 17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M16 15.5 L18.5 18 M8 15.5 L5.5 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="12" cy="10.5" r="2.2" fill="currentColor" />
    </svg>
  );
}
