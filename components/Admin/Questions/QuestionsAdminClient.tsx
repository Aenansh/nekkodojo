"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import QuestionCreationManager from "./QuestionCreationManager";
import QuestionsDashboard from "@/components/Admin/RouteSide/QuestionDashboard";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

interface CompanyOption {
  name: string;
  slug: string;
}
interface LanguageOption {
  id: string;
  name: string;
  isSupported: boolean;
}

export default function QuestionsAdminClient({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [languages, setLanguages] = useState<LanguageOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadCompanies = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [companiesResponse, languagesResponse] = await Promise.all([
          fetch("/api/companies?admin=true"),
          fetch("/api/language"),
        ]);
        if (!companiesResponse.ok) throw new Error("Failed to fetch companies.");
        if (!languagesResponse.ok) throw new Error("Failed to fetch languages.");
        const [companyData, languageData] = await Promise.all([
          companiesResponse.json() as Promise<CompanyOption[]>,
          languagesResponse.json() as Promise<LanguageOption[]>,
        ]);
        if (!cancelled) {
          setCompanies(companyData);
          setLanguages(languageData.filter((language) => language.isSupported));
        }
      } catch (fetchError) {
        console.error("Failed to load companies:", fetchError);
        if (!cancelled) setError("Unable to load question creation options.");
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
      <div className="flex min-h-[55vh] items-center justify-center gap-3 text-[#d4af37]" role="status" aria-live="polite">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
        <span>Loading company and language options...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p role="alert" className="text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="rounded-md border border-[#3e2723] px-4 py-2 text-[#eaddcf] hover:bg-[#1a110d]"
        >
          Try again
        </button>
      </div>
    );
  }

  const categoryOptions = categories.map((category) => ({
    label: category.name,
    value: category.slug,
  }));
  const companyOptions = companies.map((company) => ({
    label: company.name,
    value: company.slug,
  }));
  const languageOptions = languages.map((language) => ({
    label: language.name,
    value: language.id,
  }));

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#eaddcf]">Questions Dashboard</h1>
          <p className="text-[#a1887f] mt-2">
            Manage your problem set, organize categories, and track company tags.
          </p>
        </div>
        <QuestionCreationManager
          categoryOptions={categoryOptions}
          companyOptions={companyOptions}
          languageOptions={languageOptions}
        />
      </div>
      <QuestionsDashboard initialCategories={categories} />
    </>
  );
}
