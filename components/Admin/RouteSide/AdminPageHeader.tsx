import type { ReactNode } from "react";
export default function AdminPageHeader({
  title,
  kanji,
  description,
  children,
}: {
  title: string;
  kanji: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="flex items-start justify-between gap-8 border-b border-[#3e2723] pb-8">
      <div className="min-w-0">
        <h1 className="font-serif text-3xl tracking-tight text-[#eaddcf] md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-xl leading-relaxed text-[#a1887f]">{description}</p>
        {children && <div className="mt-6">{children}</div>}
      </div>

      <p
        lang="ja"
        aria-hidden
        className="shrink-0 select-none font-serif text-6xl leading-none text-[#5d4037] [writing-mode:vertical-rl] md:text-7xl"
      >
        {kanji}
      </p>
    </header>
  );
}
