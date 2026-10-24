import Link from "next/link";
import { SectionHeading, CatSeal } from "@/components/User/Profileornaments";
import { cn } from "@/lib/utils";

export type Figure = {
  label: string;
  value: string | number;
  note?: string;
  href?: string;
  emphasis?: boolean;
};

export function FigureStrip({ figures }: { figures: Figure[] }) {
  return (
    <dl className="grid grid-cols-2 border-y border-[#3e2723] lg:flex">
      {figures.map((f) => {
        const inner = (
          <>
            <dt className="text-sm text-[#a1887f]">{f.label}</dt>
            <dd
              className={cn(
                "mt-2 font-serif text-4xl tabular-nums leading-none",
                f.emphasis ? "text-[#d4796b]" : "text-[#eaddcf]"
              )}
            >
              {f.value}
            </dd>
            {f.note && <dd className="mt-2 text-xs text-[#8d6e63]">{f.note}</dd>}
          </>
        );

        return (
          <div
            key={f.label}
            className="border-[#3e2723] lg:flex-1 nth-[2n]:border-l nth-[n+3]:border-t [&:nth-child(odd):last-child]:col-span-2 lg:nth-[n]:border-t-0 lg:not-first:border-l"
          >
            {f.href ? (
              <Link
                href={f.href}
                className="block px-5 py-6 transition-colors hover:bg-[#1a110d]/60 focus-visible:bg-[#1a110d]/60 focus-visible:outline-none"
              >
                {inner}
              </Link>
            ) : (
              <div className="px-5 py-6">{inner}</div>
            )}
          </div>
        );
      })}
    </dl>
  );
}

export type RecentItem = {
  id: string;
  primary: string;
  secondary: string;
};

export function RecentList({
  title,
  kanji,
  href,
  items,
  empty,
}: {
  title: string;
  kanji: string;
  href: string;
  items: RecentItem[];
  empty: string;
}) {
  return (
    <section aria-label={title}>
      <SectionHeading
        title={title}
        kanji={kanji}
        aside={
          <Link href={href} className="text-sm text-[#d4af37] underline-offset-4 hover:underline">
            View all
          </Link>
        }
      />

      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item.id} className="border-b border-[#3e2723]/60 py-3.5">
              <p className="truncate text-[#eaddcf]">{item.primary}</p>
              <p className="mt-0.5 truncate text-sm text-[#8d6e63]">{item.secondary}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 py-10 text-[#8d6e63]">
          <CatSeal className="size-8 text-[#5d4037]" />
          <p className="text-sm">{empty}</p>
        </div>
      )}
    </section>
  );
}

export type Shortcut = {
  title: string;
  kanji: string;
  description: string;
  href: string;
};

export function Shortcuts({ items }: { items: Shortcut[] }) {
  return (
    <section aria-label="Shortcuts">
      <SectionHeading title="Shortcuts" kanji="近道" />
      <ul>
        {items.map((item) => (
          <li key={item.href} className="border-b border-[#3e2723]/60">
            <Link
              href={item.href}
              className="group grid grid-cols-[3rem_minmax(0,1fr)] items-baseline gap-3 border-l-2 border-transparent py-3.5 pl-3 transition-colors hover:border-[#d4af37] focus-visible:border-[#d4af37] focus-visible:outline-none"
            >
              <span
                lang="ja"
                aria-hidden
                className="font-serif text-lg text-[#8d6e63] transition-colors group-hover:text-[#d4af37]"
              >
                {item.kanji}
              </span>
              <span>
                <span className="block text-[#eaddcf] transition-colors group-hover:text-[#d4af37]">
                  {item.title}
                </span>
                <span className="block text-sm text-[#8d6e63]">{item.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
