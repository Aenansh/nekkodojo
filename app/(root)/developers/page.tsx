import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Mail } from "lucide-react";
import { EnsoCat, Grain, Hanko, LanternGlow } from "@/components/Landing Page/DojoGraphics";

export const metadata: Metadata = {
  title: "About the Developer",
  description: "The person behind the dojo.",
};

const DEVELOPER = {
  name: "Aenansh Mittal",
  initials: "AM",
  role: "Full-stack developer",
  intro:
    "I build tools that make hard things feel calm. NekkoDojo is my attempt at a place to practise algorithms without the noise.",
  story: [
    "NekkoDojo began with a simple frustration: most practice sites feel like a pile of problems, with no path through them. I wanted something with a shape, where each kata leads to the next and progress is something you can see.",
    "The design borrows from the Japanese dojo, quiet, disciplined and a little bit playful, with cats because every good practice space needs one watching over it.",
  ],
  links: {
    github: "https://github.com/Aenansh",
    email: "nekkodojo@gmail.com",
  },
};

const STACK = [
  "Next.js",
  "React",
  "TypeScript",
  "Tailwind CSS",
  "Clerk",
  "Framer Motion",
  "Docker",
  "Zustand",
  "Neondb",
  "PostgreSQL",
  "Prisma",
];

const PRINCIPLES = [
  {
    kanji: "簡",
    title: "Keep it simple",
    text: "Remove everything that does not help someone learn.",
  },
  { kanji: "継", title: "Keep it going", text: "Small daily practice beats occasional heroics." },
  {
    kanji: "心",
    title: "Keep it kind",
    text: "A learning space should feel safe to get things wrong in.",
  },
];

export default function AboutDeveloperPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#120d0a] px-6 pb-28 pt-40 text-[#eaddcf]">
      {                                                                      }
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(92,61,33,0.35) 2px, transparent 2px), linear-gradient(to bottom, rgba(92,61,33,0.35) 2px, transparent 2px)",
          backgroundSize: "96px 96px",
          maskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 70%)",
        }}
      />
      <Grain variant="washi" strength={0.7} />
      <LanternGlow className="-right-40 top-20 size-[700px]" />

      <div className="relative mx-auto max-w-5xl">
        {                                   }
        <div className="grid items-center gap-12 md:grid-cols-[320px_1fr]">
          {                    }
          <div className="relative mx-auto w-full max-w-[320px]">
            <div className="relative aspect-4/5 overflow-hidden rounded-sm border-[6px] border-[#2b1a12] bg-[#18120e] shadow-[0_0_0_1px_#5c3d21,0_30px_60px_-30px_rgba(0,0,0,0.9)]">
              <Grain variant="hinoki" strength={0.6} />
              <div className="absolute inset-0 flex items-center justify-center">
                <EnsoCat className="size-52 opacity-60" />
              </div>
              {                                                                           }
              <span className="absolute bottom-4 left-4 font-serif text-3xl text-[#d4af37]">
                {DEVELOPER.initials}
              </span>
            </div>
            <Hanko char="作" className="absolute -bottom-5 -right-4 size-14 text-2xl" />
          </div>

          <div>
            <span className="font-serif text-sm tracking-[0.5em] text-[#d4af37]/80">作者</span>
            <h1 className="mt-4 font-serif text-4xl font-bold leading-tight tracking-wide md:text-6xl">
              About the <span className="text-[#d4af37]">Developer</span>
            </h1>
            <p className="mt-6 font-serif text-2xl italic leading-snug text-[#eaddcf]/90">
              {DEVELOPER.name}
            </p>
            <p className="mt-1 text-[#8d6e63]">{DEVELOPER.role}</p>
            <p className="mt-6 max-w-lg text-lg font-light leading-relaxed text-[#a1887f]">
              {DEVELOPER.intro}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <ContactLink href={DEVELOPER.links.github}>GitHub</ContactLink>
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(DEVELOPER.links.email)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm bg-[#d4af37] px-5 py-2.5 text-sm font-semibold text-[#1a110d] transition-colors hover:bg-[#c5a028]"
              >
                <Mail className="size-4" /> Say hello
              </a>
            </div>
          </div>
        </div>

        {                                 }
        <section className="mt-28 grid gap-10 md:grid-cols-[200px_1fr]">
          <h2 className="font-serif text-2xl font-semibold text-[#d4af37]">Why the dojo exists</h2>
          <div className="space-y-5 border-l border-[#5c3d21] pl-8">
            {DEVELOPER.story.map((p, i) => (
              <p key={i} className="max-w-2xl leading-relaxed text-[#a1887f]">
                {p}
              </p>
            ))}
          </div>
        </section>

        {                                      }
        <section className="mt-24">
          <h2 className="mb-8 font-serif text-2xl font-semibold text-[#d4af37]">
            What guides the work
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div
                key={p.title}
                className="group relative overflow-hidden rounded-sm border border-[#5c3d21] bg-[#18120e] p-6 transition-colors hover:border-[#d4af37]/50"
              >
                <span
                  aria-hidden="true"
                  className="absolute -right-2 -top-3 select-none font-serif text-8xl leading-none text-[#d4af37]/6"
                >
                  {p.kanji}
                </span>
                <h3 className="relative font-serif text-xl font-semibold">{p.title}</h3>
                <p className="relative mt-2 text-sm leading-relaxed text-[#a1887f]">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        {                                 }
        <section className="mt-24">
          <h2 className="mb-6 font-serif text-2xl font-semibold text-[#d4af37]">
            Tools of the trade
          </h2>
          <ul className="flex flex-wrap gap-2.5">
            {STACK.map((s) => (
              <li
                key={s}
                className="rounded-sm border border-[#5c3d21] bg-[#2b1a12] px-4 py-2 font-mono text-sm text-[#eaddcf]"
              >
                {s}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

function ContactLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-1.5 rounded-sm border border-[#5c3d21] px-5 py-2.5 text-sm font-medium text-[#eaddcf] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
    >
      {children}
      <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}
