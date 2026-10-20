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

export default function QuestionsAdminClient({
  categories,
}: {
  categories: CategoryOption[];
}) {
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadCompanies = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/companies?admin=true");
        if (!response.ok) throw new Error("Failed to fetch companies.");
        const data = (await response.json()) as CompanyOption[];
        if (!cancelled) setCompanies(data);
      } catch (fetchError) {
        console.error("Failed to load companies:", fetchError);
        if (!cancelled) setError("Unable to load company options.");
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
      <div className="flex items-center justify-center gap-3 py-20 text-[#d4af37]">
        <Loader2 className="size-5 animate-spin" />
        <span>Loading company options...</span>
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
        />
      </div>
      <QuestionsDashboard initialCategories={categories} />
    </>
  );
}
