"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CompanyQuestionsSheet, type QuestionItem } from "@/components/Company/CompanySheet";
import { Loader2 } from "lucide-react";

type CompanyProblemsData = {
  companyName: string;
  questions: QuestionItem[];
  userProgress: Record<string, string>;
};

export default function CompanyProblemsPage() {
  const { companySlug } = useParams<{ companySlug: string }>();
  const [data, setData] = useState<CompanyProblemsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadCompanyProblems = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/questions/sheets/${encodeURIComponent(companySlug)}`);
        if (response.status === 404) {
          if (!cancelled) setError("Company not found.");
          return;
        }
        if (!response.ok) throw new Error("Failed to load company questions.");

        const companyData = (await response.json()) as CompanyProblemsData;
        if (!cancelled) setData(companyData);
      } catch (fetchError) {
        console.error("Failed to load company questions:", fetchError);
        if (!cancelled) setError("Unable to load these questions. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadCompanyProblems();
    return () => {
      cancelled = true;
    };
  }, [companySlug, retryCount]);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {isLoading ? (
          <div
            className="flex min-h-[60vh] items-center justify-center gap-3 text-[#d4af37]"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            <span>Loading questions...</span>
          </div>
        ) : error ? (
          <div className="space-y-3">
            <p role="alert" className="text-sm text-red-400">{error}</p>
            {error !== "Company not found." && (
              <button
                type="button"
                onClick={() => setRetryCount((count) => count + 1)}
                className="rounded-md border border-[#3e2723] px-4 py-2 text-sm text-[#eaddcf] hover:bg-[#1a110d]"
              >
                Try again
              </button>
            )}
          </div>
        ) : data ? (
          <CompanyQuestionsSheet
            questions={data.questions}
            companyName={data.companyName}
            userProgress={data.userProgress}
          />
        ) : null}
      </div>
    </div>
  );
}
