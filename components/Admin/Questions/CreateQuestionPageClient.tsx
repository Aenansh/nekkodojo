"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import CreateQuestionForm from "./CreateQuestionForm";

interface Option {
  label: string;
  value: string;
}

interface Company {
  name: string;
  slug: string;
}

export default function CreateQuestionPageClient({
  categoryOptions,
}: {
  categoryOptions: Option[];
}) {
  const [companyOptions, setCompanyOptions] = useState<Option[]>([]);
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
        const companies = (await response.json()) as Company[];
        if (!cancelled) {
          setCompanyOptions(
            companies.map((company) => ({ label: company.name, value: company.slug }))
          );
        }
      } catch (fetchError) {
        console.error("Failed to load company options:", fetchError);
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
      <div className="flex items-center gap-3 py-12 text-[#d4af37]">
        <Loader2 className="size-5 animate-spin" />
        <span>Loading company options...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-8">
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

  return (
    <CreateQuestionForm
      categoryOptions={categoryOptions}
      companyOptions={companyOptions}
    />
  );
}
