"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Loader2, ArrowUpRight, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import DojoBg from "@/public/dojobg.png";

interface SearchUser {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  profileUrl: string | null;
  email: string;
}

export default function MemberSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;

    const delayDebounceFn = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/users?query=${encodeURIComponent(query)}`);
          if (res.ok && !cancelled) {
            const data = await res.json();
            setResults(data);
          }
        } catch (error) {
          console.error("Search failed", error);
        } finally {
          if (!cancelled) {
            setIsLoading(false);
            setHasSearched(true);
          }
        }
      } else {
        setResults([]);
        setHasSearched(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(delayDebounceFn);
    };
  }, [query]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const showResults = hasSearched || isLoading;

  return (
    <div className="relative min-h-screen overflow-x-hidden pb-24 text-[#eaddcf]">
      <Seigaiha />

      {                                                                }
      <div
        aria-hidden="true"
        style={{ writingMode: "vertical-rl" }}
        className="pointer-events-none absolute left-8 top-36 hidden select-none font-serif text-7xl tracking-[0.3em] text-[#d4af37]/10 xl:block"
      >
        道場
      </div>

      {                                  }
      <header className="relative z-20 mx-auto max-w-3xl space-y-6 px-4 pt-20 text-center">
        <div className="animate-in fade-in slide-in-from-top-4 space-y-4 duration-700">
          <div className="mx-auto flex size-14 items-center justify-center rounded-md border border-[#d4af37]/40 bg-[#2c1810] text-[#d4af37] shadow-[0_0_0_3px_#120c0a,0_0_0_4px_rgba(212,175,55,0.2)]">
            <CatMark className="size-8" />
          </div>

          <div className="flex items-center justify-center gap-4">
            <span className="h-px w-12 bg-[#d4af37]/30" />
            <span className="font-serif text-sm tracking-[0.5em] text-[#d4af37]/80">浪人名簿</span>
            <span className="h-px w-12 bg-[#d4af37]/30" />
          </div>

          <h1 className="font-serif text-4xl font-bold tracking-wide text-[#d4af37] md:text-5xl">
            The Ronin Registry
          </h1>
          <p className="text-lg text-[#a1887f]">
            Find fellow students, masters, and travelers of the Dojo.
          </p>
        </div>

        {                                  }
        <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-2xl duration-700 [animation-delay:200ms]">
          <div className="group relative">
            <div className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center">
              {isLoading ? (
                <Loader2 className="size-5 animate-spin text-[#d4af37]" />
              ) : (
                <Search className="size-5 text-[#5d4037] transition-colors group-focus-within:text-[#d4af37]" />
              )}
            </div>

            <Input
              ref={inputRef}
              type="text"
              placeholder="Search by name or username..."
              aria-label="Search members"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-14 rounded-lg border-[#3e2723] bg-[#1a110d]/90 pl-12 pr-12 text-lg text-[#eaddcf] shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)] transition-all placeholder:text-[#5d4037] focus-visible:border-[#d4af37] focus-visible:ring-1 focus-visible:ring-[#d4af37]/60"
            />

            {query.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search"
                className="animate-in fade-in zoom-in absolute inset-y-0 right-4 z-10 flex items-center text-[#5d4037] transition-colors duration-200 hover:text-[#d4af37]"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          <p
            className={`mt-3 h-5 text-sm text-[#8d6e63] transition-opacity ${
              query.length === 1 ? "opacity-100" : "opacity-0"
            }`}
          >
            Type at least two letters to begin.
          </p>
        </div>
      </header>

      {                                }
      <main className="relative z-10 mx-auto mt-6 min-h-[400px] max-w-6xl px-4">
        {showResults ? (
          <section aria-live="polite" className="animate-in fade-in duration-500">
            {!isLoading && results.length > 0 && (
              <div className="mb-5 flex items-center gap-4">
                <span className="text-sm text-[#a1887f]">{results.length} ronin found</span>
                <span className="h-px flex-1 bg-linear-to-r from-[#3e2723] to-transparent" />
              </div>
            )}

            {isLoading && results.length === 0 ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <UserCardSkeleton key={i} />
                ))}
              </div>
            ) : results.length > 0 ? (
              <ul
                className={`grid grid-cols-1 gap-3 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${
                  isLoading ? "opacity-60" : "opacity-100"
                }`}
              >
                {results.map((user, i) => (
                  <li
                    key={user.id}
                    className="animate-in fade-in slide-in-from-bottom-2 [animation-fill-mode:both]"
                    style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                  >
                    <UserCard user={user} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-md border border-dashed border-[#5d4037] text-[#5d4037]">
                  <CatMark className="size-9" />
                </div>
                <p className="font-serif text-lg text-[#eaddcf]/90">
                  No ronin found hiding in the shadows.
                </p>
              </div>
            )}
          </section>
        ) : (
          <DojoGrounds />
        )}
      </main>
    </div>
  );
}

function UserCard({ user }: { user: SearchUser }) {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.name || "Ninja";
  const initials = fullName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Link
      href={`/member/${user.name}`}
      className="group relative block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4af37]"
    >
      <article className="relative flex h-full min-h-[88px] items-center gap-4 overflow-hidden rounded-lg border border-[#3e2723] bg-linear-to-br from-[#1a110d] to-[#120c0a] py-4 pl-5 pr-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-[#d4af37]/50 group-hover:shadow-[0_10px_24px_-12px_rgba(0,0,0,0.9)]">
        {                                                        }
        <span
          aria-hidden="true"
          className="absolute inset-y-3 left-0 w-0.5 origin-center scale-y-0 bg-[#d4af37] transition-transform duration-300 ease-out group-hover:scale-y-100 group-focus-visible:scale-y-100"
        />

        {                                      }
        <Paw className="pointer-events-none absolute -bottom-2 right-8 size-14 rotate-[-18deg] text-[#d4af37] opacity-0 transition-opacity duration-500 group-hover:opacity-[0.07]" />

        {                                   }
        <div className="relative size-14 shrink-0 overflow-hidden rounded-md border border-[#5d4037] bg-[#0f0b0a] shadow-[0_0_0_2px_#120c0a,0_0_0_3px_rgba(212,175,55,0.15)] transition-all duration-300 group-hover:border-[#d4af37]/70">
          {user.profileUrl ? (
            <Image
              src={user.profileUrl}
              alt={fullName}
              fill
              sizes="56px"
              className="object-cover"
            />
          ) : (
            <span className="flex size-full items-center justify-center font-serif text-lg font-semibold text-[#d4af37]/80">
              {initials || <CatMark className="size-7" />}
            </span>
          )}
        </div>

        <div className="relative min-w-0 flex-1 text-left">
          <h3 className="truncate text-base font-semibold leading-tight text-[#eaddcf] transition-colors group-hover:text-[#d4af37]">
            {fullName}
          </h3>
          <p className="mt-0.5 truncate text-sm text-[#8d6e63]">@{user.name}</p>
        </div>

        <ArrowUpRight
          aria-hidden="true"
          className="relative size-5 shrink-0 text-[#5d4037] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#d4af37]"
        />
      </article>
    </Link>
  );
}

function UserCardSkeleton() {
  return (
    <div className="flex min-h-[88px] animate-pulse items-center gap-4 rounded-lg border border-[#3e2723]/70 bg-[#1a110d]/60 py-4 pl-5 pr-4">
      <div className="size-14 shrink-0 rounded-md bg-[#2c1810]" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-[#2c1810]" />
        <div className="h-3 w-1/3 rounded bg-[#2c1810]/70" />
      </div>
    </div>
  );
}

function DojoGrounds() {
  return (
    <div className="animate-in fade-in zoom-in mx-auto mt-6 flex w-full max-w-4xl flex-col items-center space-y-8 pb-10 duration-1000">
      <div className="relative w-full">
        <CatPeek className="absolute -top-[3.1rem] right-12 z-20 w-24 drop-shadow-lg" />

        <div className="relative aspect-video w-full rounded-md border border-[#3e2723] bg-[#1a110d] p-3 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
          <div className="relative size-full overflow-hidden rounded-sm border border-[#d4af37]/25 bg-black shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
            <Image
              src={DojoBg}
              alt="Dojo Grounds"
              fill
              priority
              className="object-cover transition-transform duration-[20s] ease-linear hover:scale-105"
            />
            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0f0b0a]/50 via-transparent to-transparent" />
          </div>

          {                          }
          <span className="pointer-events-none absolute left-5 top-5 size-5 border-l-2 border-t-2 border-[#d4af37]/70" />
          <span className="pointer-events-none absolute right-5 top-5 size-5 border-r-2 border-t-2 border-[#d4af37]/70" />
          <span className="pointer-events-none absolute bottom-5 left-5 size-5 border-b-2 border-l-2 border-[#d4af37]/70" />
          <span className="pointer-events-none absolute bottom-5 right-5 size-5 border-b-2 border-r-2 border-[#d4af37]/70" />
        </div>
      </div>

      <div className="flex items-center gap-5 text-left">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-[#d4af37]/40 bg-[#2c1810] font-serif text-lg text-[#d4af37]">
          道
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-2xl italic text-[#eaddcf]/90">
            &ldquo;The dojo is peaceful...&rdquo;
          </h3>
          <p className="text-sm text-[#a1887f]">Type above to summon a ronin from the archives.</p>
        </div>
      </div>
    </div>
  );
}


function Seigaiha() {
  const mask = "linear-gradient(to bottom, black 0%, transparent 100%)";
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-80 w-full"
      style={{ maskImage: mask, WebkitMaskImage: mask }}
    >
      <defs>
        <pattern id="seigaiha" width="48" height="24" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#d4af37" strokeOpacity="0.1" strokeWidth="1">
            {[22, 16, 10, 4].map((r) => (
              <g key={r}>
                <circle cx="0" cy="24" r={r} />
                <circle cx="48" cy="24" r={r} />
                <circle cx="24" cy="12" r={r} />
              </g>
            ))}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#seigaiha)" />
    </svg>
  );
}

function CatMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M6 12 L7 4 L13 9 Q16 8.5 19 9 L25 4 L26 12 Q28 15 28 18 Q28 26 16 26 Q4 26 4 18 Q4 15 6 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17" r="1.3" fill="currentColor" />
      <circle cx="20" cy="17" r="1.3" fill="currentColor" />
      <path d="M15 20.5 L17 20.5 L16 21.8 Z" fill="currentColor" />
      <path
        d="M3 19 L9 20 M3 22.5 L9 21.5 M29 19 L23 20 M29 22.5 L23 21.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CatPeek({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 64" className={className} aria-hidden="true">
      {          }
      <polygon
        points="24,40 28,6 56,28"
        fill="#2c1810"
        stroke="#5d4037"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <polygon
        points="96,40 92,6 64,28"
        fill="#2c1810"
        stroke="#5d4037"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <polygon points="31,30 33,15 46,26" fill="#5d4037" opacity="0.7" />
      <polygon points="89,30 87,15 74,26" fill="#5d4037" opacity="0.7" />
      {          }
      <ellipse cx="60" cy="48" rx="40" ry="26" fill="#2c1810" stroke="#5d4037" strokeWidth="2" />
      {          }
      {[44, 76].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="44" rx="7" ry="7.5" fill="#d4af37">
            <animate
              attributeName="ry"
              values="7.5;7.5;0.8;7.5;7.5"
              keyTimes="0;0.9;0.94;0.98;1"
              dur="5s"
              repeatCount="indefinite"
            />
          </ellipse>
          <rect x={cx - 1.4} y="37" width="2.8" height="14" rx="1.4" fill="#0f0b0a" />
        </g>
      ))}
      {          }
      <polygon points="56,53 64,53 60,58" fill="#a1887f" />
      {                               }
      <rect
        x="30"
        y="56"
        width="22"
        height="8"
        rx="4"
        fill="#3e2723"
        stroke="#5d4037"
        strokeWidth="1.5"
      />
      <rect
        x="68"
        y="56"
        width="22"
        height="8"
        rx="4"
        fill="#3e2723"
        stroke="#5d4037"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function Paw({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <ellipse cx="12" cy="16" rx="5" ry="4" />
      <circle cx="5" cy="10" r="2.2" />
      <circle cx="9.5" cy="5.5" r="2.2" />
      <circle cx="14.5" cy="5.5" r="2.2" />
      <circle cx="19" cy="10" r="2.2" />
    </svg>
  );
}
