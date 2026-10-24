"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const SearchUsers = ({ placeholder = "Search for users…" }: { placeholder?: string }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("search") ?? "";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const queryTerm = ((formData.get("search") as string) || "").trim();

    const params = new URLSearchParams(searchParams);
    if (queryTerm) {
      params.set("search", queryTerm);
    } else {
      params.delete("search");
    }
    // A new search always starts from the first page.
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <form role="search" onSubmit={handleSubmit} className="relative w-full max-w-sm">
      <label htmlFor="search" className="sr-only">
        {placeholder}
      </label>

      <Search
        className="pointer-events-none absolute left-0 top-1/2 size-4 -translate-y-1/2 text-[#8d6e63]"
        aria-hidden
      />

      <Input
        // Remount when the URL changes (e.g. "Clear search") so the field resets.
        key={current}
        id="search"
        name="search"
        type="text"
        placeholder={placeholder}
        defaultValue={current}
        className="h-10 w-full rounded-none border-0 border-b border-[#3e2723] bg-transparent pl-7 pr-20 text-[#eaddcf] shadow-none transition-colors placeholder:text-[#6d4c41] focus-visible:border-[#d4af37] focus-visible:ring-0"
      />

      <button
        type="submit"
        className="absolute right-0 top-1/2 -translate-y-1/2 px-2 py-1 text-sm text-[#d4af37] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eaddcf]"
      >
        Search
      </button>
    </form>
  );
};
