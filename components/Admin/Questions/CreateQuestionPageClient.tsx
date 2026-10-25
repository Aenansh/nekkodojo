"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { EnsoCat } from "@/components/Landing Page/DojoGraphics";
import CreateQuestionForm from "./CreateQuestionForm";

interface Option {
  label: string;
  value: string;
}

interface Company {
  name: string;
  slug: string;
}
interface Language {
  id: string;
  name: string;
  isSupported: boolean;
}

export default function CreateQuestionPageClient({
  categoryOptions,
}: {
  categoryOptions: Option[];
}) {
  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
  const [languageOptions, setLanguageOptions] = useState<Option[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadCompanies = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [companyResponse, languageResponse] = await Promise.all([
          fetch("/api/companies?admin=true"),
          fetch("/api/language"),
        ]);
        if (!companyResponse.ok) throw new Error("Failed to fetch companies.");
        if (!languageResponse.ok) throw new Error("Failed to fetch languages.");
        const [companies, languages] = await Promise.all([
          companyResponse.json() as Promise<Company[]>,
          languageResponse.json() as Promise<Language[]>,
        ]);
        if (!cancelled) {
          setCompanyOptions(
            companies.map((company) => ({ label: company.name, value: company.slug }))
          );
          setLanguageOptions(
            languages
              .filter((language) => language.isSupported)
              .map((language) => ({ label: language.name, value: language.id }))
          );
        }
      } catch (fetchError) {
        console.error("Failed to load question options:", fetchError);
        if (!cancelled) setError("Unable to load company and language options.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void loadCompanies();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  if (isLoading) {
    return (
      <div className="space-y-6" role="status" aria-live="polite">
        <div className="flex items-center justify-center gap-3 py-8 text-[#d4af37]">
          <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          <span>Loading company and language options...</span>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {[260, 160, 300].map((h, i) => (
              <div
                key={i}
                style={{ height: h }}
                className="animate-pulse rounded-md border border-[#3a2318] bg-[#18120e]"
              />
            ))}
          </div>
          <div className="hidden h-72 animate-pulse rounded-md border border-[#3a2318] bg-[#2b1a12]/50 lg:block" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center space-y-5 py-16 text-center">
        <EnsoCat className="size-24 opacity-60" />
        <p role="alert" className="text-red-400">
          {error}
        </p>
        <button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="rounded-md border border-[#5c3d21] px-5 py-2 text-[#eaddcf] transition-colors hover:border-[#d4af37] hover:bg-[#2b1a12] hover:text-[#d4af37]"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <CreateQuestionForm
      categoryOptions={categoryOptions}
      companyOptions={companyOptions}
      languageOptions={languageOptions}
    />
  );
}
