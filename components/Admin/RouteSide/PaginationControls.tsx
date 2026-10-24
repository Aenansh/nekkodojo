"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

type PageItem = number | "gap";

function getPageItems(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const items: PageItem[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  if (start > 2) items.push("gap");
  for (let i = start; i <= end; i++) items.push(i);
  if (end < total - 1) items.push("gap");
  items.push(total);

  return items;
}

const stepClass = "px-3 py-2 text-sm transition-colors";

export default function PaginationControls({ currentPage, totalPages }: PaginationProps) {
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      {hasPrev ? (
        <Link
          href={createPageURL(currentPage - 1)}
          className={cn(stepClass, "text-[#a1887f] hover:text-[#d4af37]")}
        >
          Previous
        </Link>
      ) : (
        <span aria-disabled className={cn(stepClass, "text-[#5d4037]")}>
          Previous
        </span>
      )}

      {/* Small screens: a single status line instead of the number row */}
      <span className="text-sm tabular-nums text-[#a1887f] sm:hidden">
        Page {currentPage} of {totalPages}
      </span>

      <ul className="hidden items-center gap-1 sm:flex">
        {getPageItems(currentPage, totalPages).map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} aria-hidden className="px-1 text-[#5d4037]">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={createPageURL(item)}
                aria-current={item === currentPage ? "page" : undefined}
                aria-label={`Page ${item}`}
                className={cn(
                  "block min-w-9 border-b-2 px-2 py-2 text-center text-sm tabular-nums transition-colors",
                  item === currentPage
                    ? "border-[#d4af37] text-[#d4af37]"
                    : "border-transparent text-[#a1887f] hover:text-[#eaddcf]"
                )}
              >
                {item}
              </Link>
            </li>
          )
        )}
      </ul>

      {hasNext ? (
        <Link
          href={createPageURL(currentPage + 1)}
          className={cn(stepClass, "text-[#a1887f] hover:text-[#d4af37]")}
        >
          Next
        </Link>
      ) : (
        <span aria-disabled className={cn(stepClass, "text-[#5d4037]")}>
          Next
        </span>
      )}
    </nav>
  );
}
