import Link from "next/link";
import { CatSeal } from "@/components/User/Profileornaments";

export type StaffSection = {
  title: string;
  kanji: string;
  description: string;
  href: string;
};

export default function StaffHome({
  kanji,
  heading,
  intro,
  signedInAs,
  navLabel,
  sections,
}: {
  kanji: string;
  heading: string;
  intro: string;
  signedInAs?: string;
  navLabel: string;
  sections: StaffSection[];
}) {
  return (
    <main className="min-h-screen text-[#eaddcf]">
      <div className="mx-auto grid max-w-6xl gap-14 px-6 py-16 md:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
        <header className="lg:sticky lg:top-24 lg:self-start">
          <CatSeal className="size-10 text-[#d4af37]" />

          <div className="mt-10 flex gap-8">
            <p
              lang="ja"
              aria-hidden
              className="font-serif text-7xl leading-none text-[#eaddcf]/90 [writing-mode:vertical-rl] md:text-8xl"
            >
              {kanji}
            </p>

            <div className="pt-1">
              <h1 className="font-serif text-4xl tracking-tight md:text-5xl">{heading}</h1>
              <p className="mt-4 max-w-sm leading-relaxed text-[#a1887f]">{intro}</p>
              {signedInAs && (
                <p className="mt-8 text-sm text-[#8d6e63]">Signed in as {signedInAs}</p>
              )}
            </div>
          </div>
        </header>

        <nav aria-label={navLabel}>
          <ul className="border-t border-[#3e2723]">
            {sections.map((section) => (
              <li key={section.href} className="border-b border-[#3e2723]">
                <Link
                  href={section.href}
                  className="group grid grid-cols-[4.5rem_minmax(0,1fr)] items-baseline gap-6 border-l-2 border-transparent py-6 pl-4 pr-2 transition-colors hover:border-[#d4af37] hover:bg-[#1a110d]/60 focus-visible:border-[#d4af37] focus-visible:bg-[#1a110d]/60 focus-visible:outline-none"
                >
                  <span
                    lang="ja"
                    aria-hidden
                    className="font-serif text-2xl text-[#8d6e63] transition-colors group-hover:text-[#d4af37] group-focus-visible:text-[#d4af37]"
                  >
                    {section.kanji}
                  </span>
                  <span>
                    <span className="block font-serif text-xl text-[#eaddcf] transition-colors group-hover:text-[#d4af37] group-focus-visible:text-[#d4af37]">
                      {section.title}
                    </span>
                    <span className="mt-1 block max-w-md text-sm leading-relaxed text-[#a1887f]">
                      {section.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
