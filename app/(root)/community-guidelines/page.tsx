import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";
import { Grain, Hanko, LanternGlow } from "@/components/Landing Page/DojoGraphics";

export const metadata: Metadata = {
  title: "Community Guidelines",
  description: "How we treat each other in the dojo.",
};

const NUMERALS = ["一", "二", "三", "四", "五", "六", "七"];

const RULES = [
  {
    id: "respect",
    title: "Bow before you begin",
    body: "Treat every member with respect, whatever their belt. Disagree with the idea, never the person. Beginners are the reason a dojo exists, so answer their questions the way you wished yours had been answered.",
  },
  {
    id: "share",
    title: "Share the lesson, not the answer",
    body: "Explain your reasoning and give hints before giving code. When a post contains a full solution, mark it clearly so that others can choose to look. Learning someone else's solution is not the same as learning the kata.",
  },
  {
    id: "honesty",
    title: "Practice honestly",
    body: "Do not copy solutions into ranked kata, share accounts, or automate submissions. Belts only mean something if they were earned. If you are stuck, use the shelf and ask the community.",
  },
  {
    id: "sparring",
    title: "Keep sparring friendly",
    body: "In NekkoChat and live arenas, compete hard and be kind. No taunting, no harassment, no leaving a partner stranded mid-session without a word. A good match leaves both people sharper.",
  },
  {
    id: "safety",
    title: "Protect the sanctuary",
    body: "Do not share personal data, yours or anyone else's. Do not probe, overload, or attack the platform. If you find a security problem, report it privately to the maintainers instead of posting it.",
  },
  {
    id: "content",
    title: "Keep the space clean",
    body: "No hate, spam, advertising, or content that is unsafe for work. Posts should help someone learn, ask a real question, or celebrate real progress.",
  },
  {
    id: "report",
    title: "Report, do not retaliate",
    body: "If someone breaks these rules, flag it and let the moderators handle it. Answering unkindness with more unkindness only makes the dojo smaller.",
  },
];

const CONSEQUENCES = [
  { step: "Reminder", note: "A private note about what went wrong." },
  { step: "Mute", note: "A short pause on posting and chat." },
  { step: "Suspension", note: "Time away from the dojo to reflect." },
  { step: "Removal", note: "For serious or repeated harm." },
];

export default function CommunityGuidelinesPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#0f0b0a] px-6 pb-28 pt-12 text-[#eaddcf]">
      <Grain variant="washi" strength={0.8} />
      <LanternGlow className="left-1/2 top-24 size-[760px] -translate-x-1/2" />

      <div className="relative mx-auto max-w-5xl">
        {                                 }
        <header className="mb-14 text-center">
          <span className="font-serif text-sm tracking-[0.5em] text-[#d4af37]/80">掟</span>
          <h1 className="mt-4 font-serif text-4xl font-bold tracking-wide text-[#eaddcf] md:text-5xl">
            Community <span className="text-[#d4af37]">Guidelines</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg font-light leading-relaxed text-[#a1887f]">
            Seven small rules for a quiet place to train. Read them once, and then simply practise
            them.
          </p>
        </header>

        <div className="grid gap-10 lg:grid-cols-[200px_1fr]">
          {                                 }
          <aside className="hidden lg:block">
            <nav aria-label="Guidelines index" className="sticky top-32 space-y-1">
              {RULES.map((r, i) => (
                <a
                  key={r.id}
                  href={`#${r.id}`}
                  className="group flex items-center gap-3 rounded-sm py-1.5 text-sm text-[#8d6e63] transition-colors hover:text-[#d4af37]"
                >
                  <span className="w-5 font-serif text-[#5d4037] transition-colors group-hover:text-[#d4af37]">
                    {NUMERALS[i]}
                  </span>
                  <span className="truncate">{r.title}</span>
                </a>
              ))}
            </nav>
          </aside>

          {                                      }
          <div>
            {                }
            <Roller />
            <div className="relative border-x border-[#5c3d21] bg-[#18120e] px-6 py-12 sm:px-12">
              <Grain variant="washi" strength={1} />

              <ol className="relative space-y-12">
                {RULES.map((r, i) => (
                  <li key={r.id} id={r.id} className="scroll-mt-32">
                    <div className="flex gap-5">
                      <span className="flex size-12 shrink-0 items-center justify-center rounded-[3px] border border-[#5c3d21] bg-[#2b1a12] font-serif text-xl text-[#d4af37]">
                        {NUMERALS[i]}
                      </span>
                      <div className="min-w-0">
                        <h2 className="font-serif text-2xl font-semibold text-[#eaddcf]">
                          {r.title}
                        </h2>
                        <p className="mt-3 leading-relaxed text-[#a1887f]">{r.body}</p>
                      </div>
                    </div>
                    {i < RULES.length - 1 && (
                      <div className="mt-12 h-px bg-linear-to-r from-transparent via-[#5c3d21] to-transparent" />
                    )}
                  </li>
                ))}
              </ol>

              {                  }
              <div className="relative mt-16 rounded-md border border-[#5c3d21] bg-[#120d0a]/70 p-6">
                <h2 className="font-serif text-xl font-semibold text-[#d4af37]">
                  When a rule is broken
                </h2>
                <p className="mt-2 text-sm text-[#a1887f]">
                  Moderators begin gently and only move on if they have to.
                </p>
                <ol className="mt-5 grid gap-3 sm:grid-cols-4">
                  {CONSEQUENCES.map((c, i) => (
                    <li key={c.step} className="rounded-sm border border-[#3a2318] p-3">
                      <p className="text-xs text-[#5d4037]">Step {i + 1}</p>
                      <p className="mt-1 font-semibold text-[#eaddcf]">{c.step}</p>
                      <p className="mt-1 text-xs leading-snug text-[#8d6e63]">{c.note}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {               }
              <div className="relative mt-14 flex flex-col items-center justify-between gap-6 sm:flex-row">
                <Link
                  href="/code-of-bushido"
                  className="group inline-flex items-center gap-2 text-sm text-[#a1887f] transition-colors hover:text-[#d4af37]"
                >
                  <ScrollText className="size-4 transition-transform group-hover:-rotate-12" />
                  Read the Code of Bushido
                </Link>
                <div className="flex items-center gap-4">
                  <p className="text-right text-xs text-[#5d4037]">
                    Sealed by the moderators
                    <br />
                    of NekkoDojo
                  </p>
                  <Hanko char="猫" className="size-14 text-2xl" />
                </div>
              </div>
            </div>
            {                   }
            <Roller />
          </div>
        </div>
      </div>
    </main>
  );
}

function Roller() {
  return (
    <div className="relative -mx-1.5 h-4 rounded-full border border-[#5c3d21] bg-linear-to-b from-[#4a2f25] to-[#2b1a12] shadow-[0_6px_14px_-6px_rgba(0,0,0,0.8)]">
      <span className="absolute -left-1.5 top-1/2 size-5 -translate-y-1/2 rounded-full border border-[#5c3d21] bg-[#d4af37]" />
      <span className="absolute -right-1.5 top-1/2 size-5 -translate-y-1/2 rounded-full border border-[#5c3d21] bg-[#d4af37]" />
    </div>
  );
}
