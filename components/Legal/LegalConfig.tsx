import Link from "next/link";
import { Grain } from "@/components/Landing Page/DojoGraphics";
import { LEGAL } from "@/constants/legal-config";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

const PROSE =
  "text-[#a1887f] leading-relaxed " +
  "[&_p]:mt-4 [&_p:first-child]:mt-0 " +
  "[&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:marker:text-[#5c3d21] " +
  "[&_a]:text-[#d4af37] [&_a]:underline-offset-4 hover:[&_a]:underline " +
  "[&_strong]:font-semibold [&_strong]:text-[#eaddcf]";

export default function LegalDocument({
  title,
  intro,
  summary,
  sections,
  related,
}: {
  title: string;
  intro: string;
  summary: string[];
  sections: LegalSection[];
  related: { label: string; href: string }[];
}) {
  const num = (i: number) => String(i + 1).padStart(2, "0");

  return (
    <main className="relative min-h-screen bg-[#0f0b0a] px-6 pb-28 pt-40 text-[#eaddcf] print:bg-white print:pt-8 print:text-black">
      <Grain variant="washi" strength={0.45} className="print:hidden" />

      <div className="relative mx-auto max-w-6xl">
        <header className="max-w-3xl border-b border-[#5c3d21] pb-8">
          <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-[#d4af37]">
            <span className="h-px w-8 bg-[#d4af37]" />
            Legal
          </p>
          <h1 className="mt-5 font-serif text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-[#a1887f]">{intro}</p>
          <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-[#5d4037]">Last updated</dt>
              <dd className="text-[#eaddcf]">{LEGAL.lastUpdated}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-[#5d4037]">Effective</dt>
              <dd className="text-[#eaddcf]">{LEGAL.effective}</dd>
            </div>
          </dl>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-[240px_1fr]">
          <aside className="print:hidden">
            <details className="rounded-md border border-[#5c3d21] bg-[#18120e] lg:hidden">
              <summary className="cursor-pointer px-4 py-3 text-sm font-semibold">Contents</summary>
              <TocList sections={sections} className="border-t border-[#3a2318] p-4" />
            </details>

            <nav aria-label="Contents" className="sticky top-32 hidden lg:block">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#5d4037]">
                Contents
              </p>
              <TocList sections={sections} />
            </nav>
          </aside>

          <article className="max-w-3xl">
            <div className="rounded-sm border border-[#5c3d21] border-l-2 border-l-[#d4af37] bg-[#18120e] p-6">
              <h2 className="font-serif text-lg font-semibold">In short</h2>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#a1887f]">
                {summary.map((s) => (
                  <li key={s} className="flex gap-3">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-[#d4af37]" />
                    {s}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-[#5d4037]">
                This summary is for convenience. The full text below is what applies.
              </p>
            </div>

            <div className="mt-12 space-y-12">
              {sections.map((s, i) => (
                <section
                  key={s.id}
                  id={s.id}
                  className="scroll-mt-32 border-t border-[#3a2318] pt-8"
                >
                  <h2 className="flex items-baseline gap-4 font-serif text-2xl font-semibold">
                    <span className="font-mono text-sm text-[#d4af37]">{num(i)}</span>
                    {s.title}
                  </h2>
                  <div className={`mt-4 ${PROSE}`}>{s.body}</div>
                </section>
              ))}
            </div>

            <footer className="mt-16 border-t border-[#5c3d21] pt-8 print:hidden">
              <p className="text-sm text-[#8d6e63]">Related documents</p>
              <ul className="mt-3 flex flex-wrap gap-3">
                {related.map((r) => (
                  <li key={r.href}>
                    <Link
                      href={r.href}
                      className="inline-block rounded-sm border border-[#5c3d21] px-4 py-2 text-sm text-[#eaddcf] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
                    >
                      {r.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </footer>
          </article>
        </div>
      </div>
    </main>
  );
}

function TocList({ sections, className = "" }: { sections: LegalSection[]; className?: string }) {
  return (
    <ol className={`space-y-0.5 ${className}`}>
      {sections.map((s, i) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="group flex gap-3 rounded-sm py-1.5 text-sm text-[#8d6e63] transition-colors hover:text-[#d4af37]"
          >
            <span className="w-5 shrink-0 font-mono text-[#5d4037] transition-colors group-hover:text-[#d4af37]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{s.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );
}
