import type { ReactNode } from "react";
import { CatSeal } from "@/components/User/Profileornaments";

export default function AdminShell({
  kanji,
  caption,
  children,
}: {
  kanji: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-screen bg-[#0f0b0a] text-[#eaddcf] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <aside className="hidden flex-col justify-between border-r border-[#3e2723] p-12 lg:flex">
        <CatSeal className="size-10 text-[#d4af37]" />
        <p
          lang="ja"
          aria-hidden
          className="font-serif text-8xl leading-none text-[#eaddcf]/90 [writing-mode:vertical-rl]"
        >
          {kanji}
        </p>
        <p className="max-w-[16rem] text-sm leading-relaxed text-[#8d6e63]">{caption}</p>
      </aside>

      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <CatSeal className="mb-10 size-9 text-[#d4af37] lg:hidden" />
          {children}
        </div>
      </section>
    </main>
  );
}
