"use client";

import { useEffect, useState } from "react";
import { CompanySection } from "@/components/Company/CompanySection";
import type { CompanyCardItem } from "@/components/Company/CompanyCarousel";
import QuestionExplorer from "@/components/Problems/ProblemSheet";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type LibraryCategory = {
  id: string;
  name: string;
  questions: {
    id: string;
    slug: string;
    title: string;
    description: string;
    difficulty: "Easy" | "Medium" | "Hard";
    externalPlatformUrl: string;
    solutionUrl: string | null;
  }[];
};

type LibraryData = {
  companies: CompanyCardItem[];
  categories: LibraryCategory[];
  userProgress: Record<string, string>;
};

export default function ProblemsPage() {
  const [data, setData] = useState<LibraryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadLibrary = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/questions?view=library");
        if (!response.ok) throw new Error("Failed to load questions.");

        const library = (await response.json()) as LibraryData;
        if (!cancelled) setData(library);
      } catch (fetchError) {
        console.error("Failed to load problem library:", fetchError);
        if (!cancelled) setError("Unable to load the problem library. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadLibrary();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  return (
    <div className="min-h-screen text-[#eaddcf] py-10">
      <div className="container mx-auto px-4 max-w-7xl space-y-16">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#d4af37] uppercase">
            The Dojo Library
          </h1>
          <p className="text-[#a1887f] max-w-2xl text-lg">
            Master the ancient arts of algorithms. Train under the banner of a Great House or choose
            your path from the archives.
          </p>
        </div>

        <section className="space-y-6">
          {data && <CompanySection initialData={data.companies} userProgress={data.userProgress} />}
        </section>

        <div className="h-px w-full bg-linear-to-r from-transparent via-[#3e2723] to-transparent opacity-50" />

        <section className="space-y-6">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-2xl font-bold text-[#eaddcf]">All Katas</h2>
            <span className="text-sm text-[#5d4037] font-mono mt-1">
              ({data?.categories.reduce((acc, cat) => acc + cat.questions.length, 0) ?? 0} Total)
            </span>
          </div>

          {isLoading ? (
            <div
              className="flex min-h-[40vh] items-center justify-center gap-3 text-[#d4af37]"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
              <span>Loading questions...</span>
            </div>
          ) : error ? (
            <div className="space-y-3">
              <p role="alert" className="text-sm text-red-400">{error}</p>
              <Button
                variant="outline"
                onClick={() => setRetryCount((count) => count + 1)}
                className="border-[#3e2723] text-[#eaddcf] hover:bg-[#1a110d]"
              >
                Try again
              </Button>
            </div>
          ) : data ? (
            <div className="mx-auto">
              <QuestionExplorer data={data.categories} />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
