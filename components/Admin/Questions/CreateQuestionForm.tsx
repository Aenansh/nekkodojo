"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { Grain, Paw } from "@/components/Landing Page/DojoGraphics";

interface Option {
  label: string;
  value: string;
}

interface Props {
  categoryOptions: Option[];
  companyOptions: Option[];
  languageOptions: Option[];
}

const BELTS = [
  { value: "Easy", note: "A first form", bar: "bg-green-500", text: "text-green-400" },
  { value: "Medium", note: "Takes patience", bar: "bg-yellow-500", text: "text-yellow-400" },
  { value: "Hard", note: "For the long road", bar: "bg-red-500", text: "text-red-400" },
];

const inputClass =
  "h-11 border-[#5c3d21] bg-[#120d0a] text-[#eaddcf] shadow-[inset_0_2px_5px_rgba(0,0,0,0.4)] placeholder:text-[#5d4037] focus-visible:border-[#d4af37] focus-visible:ring-1 focus-visible:ring-[#d4af37]/50";
const labelClass = "text-sm font-medium text-[#a1887f]";
const hintClass = "text-xs text-[#5d4037]";

export default function CreateQuestionForm({
  categoryOptions,
  companyOptions,
  languageOptions,
}: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [constraints, setConstraints] = useState("");
  const [difficulty, setDifficulty] = useState("Medium");
  const [externalUrl, setExternalUrl] = useState("");
  const [solutionUrl, setSolutionUrl] = useState("");

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    languageOptions.map((language) => language.value)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          constraints,
          difficulty,
          externalPlatformUrl: externalUrl,
          solutionUrl,
          categories: selectedCategories,
          companyTag: selectedCompanies,
          supportedLanguageIds: selectedLanguages,
        }),
      });

      if (!res.ok) {
        const contentType = res.headers.get("content-type") ?? "";
        const errorPayload: unknown = contentType.includes("application/json")
          ? await res.json().catch(() => null)
          : null;
        const message =
          typeof errorPayload === "string"
            ? errorPayload
            : typeof errorPayload === "object" &&
                errorPayload !== null &&
                "error" in errorPayload &&
                typeof errorPayload.error === "string"
              ? errorPayload.error
              : `Failed to create question (${res.status})`;
        throw new Error(message);
      }

      toast.success("Question created successfully!");
      router.push("/admin/questions");
      router.refresh();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        {/* ---------- 一 Problem details ---------- */}
        <Chapter
          numeral="一"
          title="Problem Details"
          hint="What the student will be asked to solve."
        >
          <div className="grid gap-2">
            <Label htmlFor="title" className={labelClass}>
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Two Sum"
              className={inputClass}
              required
            />
          </div>

          <fieldset className="grid gap-2">
            <legend className={`${labelClass} mb-2`}>Difficulty</legend>
            <div className="grid grid-cols-3 gap-3">
              {BELTS.map((b) => (
                <label key={b.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="difficulty"
                    value={b.value}
                    checked={difficulty === b.value}
                    onChange={() => setDifficulty(b.value)}
                    className="peer sr-only"
                  />
                  <div className="rounded-md border border-[#5c3d21] bg-[#120d0a] p-3 text-center transition-all hover:border-[#8d6e63] peer-checked:border-[#d4af37] peer-checked:bg-[#2b1a12] peer-checked:shadow-[0_0_0_1px_#d4af37] peer-focus-visible:ring-2 peer-focus-visible:ring-[#d4af37]">
                    <span className={`mx-auto block h-2 w-14 rounded-full ${b.bar}`} />
                    <p className={`mt-2 text-sm font-semibold ${b.text}`}>{b.value}</p>
                    <p className="mt-0.5 text-xs text-[#8d6e63]">{b.note}</p>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="desc" className={labelClass}>
              Description
            </Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the problem statement..."
              className={`${inputClass} min-h-40 py-3`}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="constraints" className={labelClass}>
              Constraints
            </Label>
            <Textarea
              id="constraints"
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder={"- 1 <= nums.length <= 10^5\n- -10^9 <= nums[i] <= 10^9"}
              className={`${inputClass} min-h-28 py-3`}
            />
            <p className={hintClass}>Optional. Markdown is supported.</p>
          </div>
        </Chapter>

        {/* ---------- 二 Resources ---------- */}
        <Chapter
          numeral="二"
          title="Resources"
          hint="Where to practise it, and where to learn from it."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="url" className={labelClass}>
                LeetCode / Platform URL
              </Label>
              <Input
                id="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://leetcode.com/problems/..."
                className={inputClass}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sol" className={labelClass}>
                Solution URL (Video/Article)
              </Label>
              <Input
                id="sol"
                value={solutionUrl}
                onChange={(e) => setSolutionUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className={inputClass}
                required
              />
              <p className={hintClass}>Stays sealed until the student has attempted the kata.</p>
            </div>
          </div>
        </Chapter>

        {/* ---------- 三 Tags ---------- */}
        <Chapter numeral="三" title="Tags & Categories" hint="How students will find it.">
          <div className="grid gap-2">
            <Label className={labelClass}>Categories</Label>
            <MultiSelect
              options={categoryOptions}
              selected={selectedCategories}
              onChange={setSelectedCategories}
              placeholder="Select Categories..."
            />
            <p className={hintClass}>Which topic does this belong to?</p>
          </div>

          <div className="grid gap-2">
            <Label className={labelClass}>Companies</Label>
            <MultiSelect
              options={companyOptions}
              selected={selectedCompanies}
              onChange={setSelectedCompanies}
              placeholder="Select Companies..."
            />
            <p className={hintClass}>Who asked this question?</p>
          </div>

          <div className="grid gap-2">
            <Label className={labelClass}>Supported Languages</Label>
            <MultiSelect
              options={languageOptions}
              selected={selectedLanguages}
              onChange={setSelectedLanguages}
              placeholder="Select supported languages..."
            />
            <p className={hintClass}>
              Choose which enabled languages can be used for this question. All are selected by
              default.
            </p>
          </div>
        </Chapter>

        {/* ---------- Submit ---------- */}
        <div className="flex flex-col-reverse items-stretch gap-3 pb-4 sm:flex-row sm:items-center">
          <Link
            href="/admin/questions"
            className="rounded-md border border-[#5c3d21] px-6 py-3 text-center text-sm font-medium text-[#a1887f] transition-colors hover:border-[#8d6e63] hover:text-[#eaddcf]"
          >
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={isLoading}
            className="h-12 flex-1 bg-[#d4af37] text-base font-semibold text-[#1a110d] hover:bg-[#c5a028] hover:shadow-[0_0_20px_rgba(212,175,55,0.25)]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" /> Create Question
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ---------- Live preview ---------- */}
      <aside className="hidden lg:block">
        <div className="sticky top-8 space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-[#5d4037]">
            How it will look
          </p>
          <KataPreview
            title={title}
            description={description}
            difficulty={difficulty}
            categories={selectedCategories.length}
            companies={selectedCompanies.length}
            languages={selectedLanguages.length}
            hasSolution={solutionUrl.trim().length > 0}
          />
        </div>
      </aside>
    </form>
  );
}

/* ================================================================
   A form section, drawn as one chapter of a scroll
   ================================================================ */
function Chapter({
  numeral,
  title,
  hint,
  children,
}: {
  numeral: string;
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-md border border-[#5c3d21] bg-[#18120e]">
      <Grain variant="washi" strength={0.8} />
      <header className="relative flex items-center gap-4 border-b border-[#3a2318] bg-[#2b1a12]/70 px-6 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[3px] border border-[#5c3d21] bg-[#120d0a] font-serif text-lg text-[#d4af37]">
          {numeral}
        </span>
        <div>
          <h3 className="font-serif text-lg font-semibold text-[#eaddcf]">{title}</h3>
          <p className="text-xs text-[#8d6e63]">{hint}</p>
        </div>
      </header>
      <div className="relative space-y-5 p-6">{children}</div>
    </section>
  );
}

/* ================================================================
   Preview of the kata row students will see
   ================================================================ */
function KataPreview({
  title,
  description,
  difficulty,
  categories,
  companies,
  languages,
  hasSolution,
}: {
  title: string;
  description: string;
  difficulty: string;
  categories: number;
  companies: number;
  languages: number;
  hasSolution: boolean;
}) {
  const belt = BELTS.find((b) => b.value === difficulty) ?? BELTS[1];
  const snippet = description.trim();

  return (
    <article className="relative overflow-hidden rounded-md border border-[#5c3d21] bg-[#2b1a12] p-5">
      <Grain variant="hinoki" strength={0.7} />
      <span className="absolute left-1/2 top-2 size-2.5 -translate-x-1/2 rounded-full border border-[#5c3d21] bg-[#120d0a]" />

      <div className="relative mt-3">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-xs text-[#5d4037]">01</span>
          <span className={`flex items-center gap-2 text-xs ${belt.text}`}>
            <span className={`h-1.5 w-4 rounded-full ${belt.bar}`} />
            {belt.value}
          </span>
        </div>

        <h4
          className={`mt-3 font-serif text-lg font-semibold leading-snug ${
            title.trim() ? "text-[#eaddcf]" : "text-[#5d4037]"
          }`}
        >
          {title.trim() || "Untitled kata"}
        </h4>

        <p
          className={`mt-3 line-clamp-4 rounded-sm border border-[#3a2318] border-l-2 border-l-[#d4af37]/50 bg-[#120d0a]/60 px-3 py-2 text-xs leading-relaxed ${
            snippet ? "text-[#a1887f]" : "text-[#5d4037]"
          }`}
        >
          {snippet || "The description will appear here."}
        </p>

        <ul className="mt-4 space-y-1.5 text-xs text-[#8d6e63]">
          <li className="flex justify-between">
            <span>Categories</span>
            <span className="tabular-nums text-[#eaddcf]">{categories}</span>
          </li>
          <li className="flex justify-between">
            <span>Companies</span>
            <span className="tabular-nums text-[#eaddcf]">{companies}</span>
          </li>
          <li className="flex justify-between">
            <span>Languages</span>
            <span className="tabular-nums text-[#eaddcf]">{languages}</span>
          </li>
          <li className="flex justify-between">
            <span>Solution</span>
            <span className={hasSolution ? "text-[#d4af37]" : "text-[#5d4037]"}>
              {hasSolution ? "Sealed until attempted" : "Missing"}
            </span>
          </li>
        </ul>

        <Paw className="mt-4 ml-auto size-4 rotate-12 text-[#d4af37]/40" />
      </div>
    </article>
  );
}
