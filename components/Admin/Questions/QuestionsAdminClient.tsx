"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import QuestionCreationManager from "./QuestionCreationManager";
import QuestionsDashboard from "@/components/Admin/RouteSide/QuestionDashboard";
import AdminPageHeader from "@/components/Admin/RouteSide/AdminPageHeader";
import { CatSeal } from "@/components/User/Profileornaments";

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

export default function QuestionsAdminClient({ categories }: { categories: CategoryOption[] }) {
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
      <div
        className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-[#a1887f]"
        role="status"
        aria-live="polite"
      >
        <CatSeal className="size-10 text-[#5d4037]" />
        <p className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin text-[#d4af37]" aria-hidden />
          Setting up the practice floor…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 text-center">
        <CatSeal className="size-10 text-[#5d4037]" />
        <p role="alert" className="text-sm text-[#d4796b]">
          {error}
        </p>
        <button
          type="button"
          onClick={() => setRetryCount((count) => count + 1)}
          className="rounded-full border border-[#3e2723] px-5 py-2 text-sm text-[#eaddcf] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
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
    <div className="space-y-10">
      <AdminPageHeader
        title="Katas"
        kanji="型"
        description="The problems members train on. Write new ones, tune the old ones, and keep every category stocked."
      >
        <QuestionCreationManager
          categoryOptions={categoryOptions}
          companyOptions={companyOptions}
          languageOptions={languageOptions}
        />
      </AdminPageHeader>

      <QuestionsDashboard initialCategories={categories} />
    </div>
  );
}
