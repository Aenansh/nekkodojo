"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, EyeOff, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CatSeal } from "@/components/User/Profileornaments";
import {
  ChipBar,
  CodeFrame,
  DIFFICULTY_COLOR,
  Field,
  Segmented,
  codeAreaClass,
  fieldClass,
} from "./KataParts";

type Option = { id: string; name: string; slug: string };
type Language = {
  id: string;
  name: string;
  slug: string;
  monacoSlug: string;
  extension: string;
  isSupported?: boolean;
};
type QuestionData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  constraints: string | null;
  difficulty: "Easy" | "Medium" | "Hard";
  externalPlatformUrl: string;
  solutionUrl: string;
  timeLimit: number;
  memoryLimit: number;
  judgeType: "EXACT_MATCH" | "UNORDERED_MATCH" | "SPECIAL_JUDGE";
  hasChecker: boolean;
  categories: Option[];
  companyTag: Option[];
  supportedLanguages: Language[];
};
type Testcase = {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
};
type Codestub = {
  id: string;
  languageId: string;
  userSnippet: string;
  driverCode: string;
  language: Language;
};
type CustomChecker = {
  id: string;
  languageId: string;
  scriptSource: string;
  timeoutMs: number;
  version: number;
  createdAt: string;
  language: Language;
};
type DeleteTarget =
  | { type: "testcase"; id: string; title: string }
  | { type: "codestub"; id: string; title: string }
  | { type: "question"; id: string; title: string };

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    result = null;
  }
  if (!response.ok) {
    throw new Error(typeof result === "string" ? result : `Request failed (${response.status})`);
  }
  return result as T;
}

const tabClass =
  "-mb-px h-auto flex-none gap-2 rounded-none border-0 border-b-2 border-transparent bg-transparent px-0 pb-3 pt-2 text-[#8d6e63] shadow-none transition-colors hover:text-[#eaddcf] data-[state=active]:border-[#d4af37] data-[state=active]:bg-transparent data-[state=active]:text-[#eaddcf] data-[state=active]:shadow-none dark:data-[state=active]:border-[#d4af37] dark:data-[state=active]:bg-transparent";

const goldButton =
  "rounded-full bg-[#d4af37] px-5 text-[#0f0b0a] hover:bg-[#b5952f] focus-visible:ring-[#eaddcf]";
const quietButton =
  "rounded-full border border-[#3e2723] bg-transparent px-5 text-[#eaddcf] hover:border-[#5d4037] hover:bg-transparent hover:text-[#eaddcf]";

const dotExt = (extension: string) => (extension.startsWith(".") ? extension : `.${extension}`);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function QuestionEditor({
  questionId,
  categories,
  companies,
}: {
  questionId: string;
  categories: Option[];
  companies: Option[];
}) {
  const router = useRouter();
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [testcases, setTestcases] = useState<Testcase[]>([]);
  const [codestubs, setCodestubs] = useState<Codestub[]>([]);
  const [checkers, setCheckers] = useState<CustomChecker[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Which chip is selected on each tab ("" = first item, "new" = the add form)
  const [activeCase, setActiveCase] = useState("");
  const [activeStub, setActiveStub] = useState("");
  const [activeChecker, setActiveChecker] = useState("");

  const loadEditorData = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const [questionData, testcaseData, codestubData, checkerData, languageData] =
        await Promise.all([
          requestJson<QuestionData>(`/api/questions/${questionId}`),
          requestJson<Testcase[]>(`/api/questions/${questionId}/testcases`),
          requestJson<Codestub[]>(`/api/questions/${questionId}/codestub`),
          requestJson<CustomChecker[]>(`/api/questions/${questionId}/customchecker`),
          requestJson<Language[]>("/api/language"),
        ]);
      setQuestion(questionData);
      setTestcases(testcaseData);
      setCodestubs(codestubData);
      setCheckers(checkerData);
      setLanguages(languageData);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load question.";
      setPageError(message);
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    void loadEditorData();
  }, [loadEditorData]);

  const categoryOptions = useMemo(
    () => categories.map(({ name, slug }) => ({ label: name, value: slug })),
    [categories]
  );
  const companyOptions = useMemo(
    () => companies.map(({ name, slug }) => ({ label: name, value: slug })),
    [companies]
  );
  const supportedLanguageOptions = useMemo(
    () =>
      languages
        .filter((language) => language.isSupported !== false)
        .map((language) => ({ label: language.name, value: language.id })),
    [languages]
  );

  const updateQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      constraints: String(form.get("constraints") ?? ""),
      difficulty: String(form.get("difficulty")),
      externalPlatformUrl: String(form.get("externalPlatformUrl") ?? "").trim(),
      solutionUrl: String(form.get("solutionUrl") ?? "").trim(),
      categories: question.categories.map((category) => category.slug),
      companyTag: question.companyTag.map((company) => company.slug),
      supportedLanguageIds: question.supportedLanguages.map((language) => language.id),
      timeLimit: Number(form.get("timeLimit")),
      memoryLimit: Number(form.get("memoryLimit")),
      judgeType: question.judgeType,
      hasChecker: question.hasChecker,
    };
    setSaving(true);
    try {
      const updated = await requestJson<Pick<QuestionData, "slug">>(
        `/api/questions?questionId=${encodeURIComponent(questionId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      setQuestion({
        ...question,
        title: payload.title,
        description: payload.description,
        constraints: payload.constraints || null,
        difficulty: payload.difficulty as QuestionData["difficulty"],
        externalPlatformUrl: payload.externalPlatformUrl,
        solutionUrl: payload.solutionUrl,
        timeLimit: payload.timeLimit,
        memoryLimit: payload.memoryLimit,
        supportedLanguages: payload.supportedLanguageIds
          .map((id) => languages.find((language) => language.id === id))
          .filter((language): language is Language => language !== undefined),
      });
      if (updated.slug !== question.slug) {
        router.replace(`/admin/questions/${updated.slug}`);
      }
      toast.success("Kata details saved.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save question.");
    } finally {
      setSaving(false);
    }
  };

  const addTestcase = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const testcase = {
      input: String(form.get("input") ?? ""),
      expectedOutput: String(form.get("expectedOutput") ?? ""),
      isHidden: form.get("isHidden") === "on",
    };
    try {
      await requestJson(`/api/questions/${questionId}/testcases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testcases: [testcase] }),
      });
      formElement.reset();
      const updated = await requestJson<Testcase[]>(`/api/questions/${questionId}/testcases`);
      const added = updated.find((item) => !testcases.some((old) => old.id === item.id));
      setTestcases(updated);
      if (added) setActiveCase(added.id);
      toast.success("Test case added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add testcase.");
    }
  };

  const saveTestcase = async (testcase: Testcase) => {
    try {
      const updated = await requestJson<Testcase>(`/api/questions/${questionId}/testcases`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testcase),
      });
      setTestcases((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      toast.success("Test case saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save testcase.");
    }
  };

  const addCodestub = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const languageId = String(form.get("languageId") ?? "");
    try {
      await requestJson(`/api/questions/${questionId}/codestub`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          languageId,
          userSnippet: String(form.get("userSnippet") ?? ""),
          driverCode: String(form.get("driverCode") ?? ""),
        }),
      });
      formElement.reset();
      const updated = await requestJson<Codestub[]>(`/api/questions/${questionId}/codestub`);
      setCodestubs(updated);
      const added = updated.find((stub) => stub.languageId === languageId);
      if (added) setActiveStub(added.id);
      toast.success("Code stub added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add code stub.");
    }
  };

  const saveCodestub = async (codestub: Codestub) => {
    try {
      await requestJson(`/api/questions/${questionId}/codestub`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(codestub),
      });
      toast.success(`${codestub.language.name} code stub saved.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save code stub.");
    }
  };

  const addChecker = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const languageId = String(form.get("languageId") ?? "");
    try {
      const checker = await requestJson<CustomChecker>(
        `/api/questions/${questionId}/customchecker`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            languageId,
            scriptSource: String(form.get("scriptSource") ?? ""),
            timeoutMs: Number(form.get("timeoutMs")),
          }),
        }
      );
      setCheckers((items) => [checker, ...items]);
      setActiveChecker(checker.id);
      formElement.reset();
      toast.success(`Custom checker revision ${checker.version} created.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create checker.");
    }
  };

  const saveChecker = async (checker: CustomChecker) => {
    try {
      const updated = await requestJson<CustomChecker>(
        `/api/questions/${questionId}/customchecker`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            version: checker.version,
            scriptSource: checker.scriptSource,
            timeoutMs: checker.timeoutMs,
          }),
        }
      );
      setCheckers((items) =>
        items.map((item) => (item.version === checker.version ? updated : item))
      );
      toast.success(`Custom checker revision ${checker.version} saved.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save checker.");
    }
  };

  const deleteResource = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "question") {
        await requestJson(`/api/questions?questionId=${encodeURIComponent(questionId)}`, {
          method: "DELETE",
        });
        toast.success("Kata deleted.");
        router.push("/admin/questions");
        router.refresh();
      } else if (deleteTarget.type === "testcase") {
        await requestJson(
          `/api/questions/${questionId}/testcases?testcaseId=${encodeURIComponent(deleteTarget.id)}`,
          { method: "DELETE" }
        );
        setTestcases((items) => items.filter((item) => item.id !== deleteTarget.id));
        toast.success("Test case deleted.");
      } else {
        const codestub = codestubs.find((item) => item.id === deleteTarget.id);
        if (!codestub) throw new Error("Code stub not found.");
        await requestJson(
          `/api/questions/${questionId}/codestub?languageId=${encodeURIComponent(codestub.languageId)}`,
          { method: "DELETE" }
        );
        setCodestubs((items) => items.filter((item) => item.id !== deleteTarget.id));
        toast.success("Code stub deleted.");
      }
      setDeleteTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete.");
    }
  };

  if (loading) {
    return (
      <div
        className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-[#a1887f]"
        role="status"
        aria-live="polite"
      >
        <CatSeal className="size-10 text-[#5d4037]" />
        <p className="flex items-center gap-2 text-sm">
          <Loader2 className="size-4 animate-spin text-[#d4af37]" aria-hidden />
          Unrolling the kata…
        </p>
      </div>
    );
  }
  if (pageError || !question) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-5 text-center">
        <CatSeal className="size-10 text-[#5d4037]" />
        <p role="alert" className="text-sm text-[#d4796b]">
          {pageError || "Kata not found."}
        </p>
        <Button onClick={() => void loadEditorData()} className={quietButton}>
          Try again
        </Button>
      </div>
    );
  }

  /* ---- chip selection, resolved against the current lists ---- */
  const caseId =
    activeCase === "new"
      ? "new"
      : testcases.some((t) => t.id === activeCase)
        ? activeCase
        : (testcases[0]?.id ?? "new");
  const selectedCase = testcases.find((t) => t.id === caseId);

  const stubId =
    activeStub === "new"
      ? "new"
      : codestubs.some((s) => s.id === activeStub)
        ? activeStub
        : (codestubs[0]?.id ?? "new");
  const selectedStub = codestubs.find((s) => s.id === stubId);

  const checkerId =
    activeChecker === "new"
      ? "new"
      : checkers.some((c) => c.id === activeChecker)
        ? activeChecker
        : (checkers[0]?.id ?? "new");
  const selectedChecker = checkers.find((c) => c.id === checkerId);

  const difficultyColor = DIFFICULTY_COLOR[question.difficulty];

  return (
    <div className="space-y-10 text-[#eaddcf]">
      {/* ---------- Header ---------- */}
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-[#3e2723] pb-8">
        <div className="min-w-0 space-y-4">
          <Link
            href="/admin/questions"
            className="inline-flex items-center gap-2 text-sm text-[#a1887f] transition-colors hover:text-[#d4af37]"
          >
            <ArrowLeft className="size-4" aria-hidden /> All katas
          </Link>
          <div>
            <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">{question.title}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#a1887f]">
              <span className="font-mono text-xs text-[#8d6e63]">{question.slug}</span>
              <span style={{ color: difficultyColor }}>{question.difficulty}</span>
              <span>{plural(testcases.length, "test case", "test cases")}</span>
              <span>{plural(codestubs.length, "language template", "language templates")}</span>
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          className="rounded-full border border-[#8f3b31] px-5 text-[#d4796b] hover:bg-[#8f3b31]/25 hover:text-[#d4796b]"
          onClick={() =>
            setDeleteTarget({ type: "question", id: question.id, title: question.title })
          }
        >
          <Trash2 aria-hidden /> Delete kata
        </Button>
      </header>

      <Tabs defaultValue="details" className="w-full gap-0">
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="h-auto w-max min-w-full justify-start gap-8 rounded-none border-b border-[#3e2723] bg-transparent p-0">
            <TabsTrigger value="details" className={tabClass}>
              Details
            </TabsTrigger>
            <TabsTrigger value="testcases" className={tabClass}>
              Test cases
              <span className="text-xs tabular-nums text-[#8d6e63]">{testcases.length}</span>
            </TabsTrigger>
            <TabsTrigger value="codestubs" className={tabClass}>
              Code stubs
              <span className="text-xs tabular-nums text-[#8d6e63]">{codestubs.length}</span>
            </TabsTrigger>
            <TabsTrigger value="checker" className={tabClass}>
              Custom checker
              <span className="text-xs tabular-nums text-[#8d6e63]">{checkers.length}</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ---------- DETAILS ---------- */}
        <TabsContent value="details" className="mt-8">
          <form onSubmit={updateQuestion}>
            <input type="hidden" name="difficulty" value={question.difficulty} />

            <div className="grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-6">
                <Field label="Title" htmlFor="title">
                  <Input
                    id="title"
                    name="title"
                    defaultValue={question.title}
                    className={fieldClass}
                    required
                  />
                </Field>

                <Field label="Description" htmlFor="description">
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={question.description}
                    className={`${fieldClass} min-h-80 leading-7`}
                    required
                  />
                </Field>

                <Field label="Constraints" htmlFor="constraints" hint="Optional. Markdown is supported.">
                  <Textarea
                    id="constraints"
                    name="constraints"
                    defaultValue={question.constraints ?? ""}
                    className={`${fieldClass} min-h-32 leading-7`}
                    placeholder={"- 1 <= nums.length <= 10^5\n- -10^9 <= nums[i] <= 10^9"}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="External platform URL" htmlFor="externalPlatformUrl">
                    <Input
                      id="externalPlatformUrl"
                      name="externalPlatformUrl"
                      type="url"
                      defaultValue={question.externalPlatformUrl}
                      className={fieldClass}
                      required
                    />
                  </Field>
                  <Field label="Solution URL" htmlFor="solutionUrl">
                    <Input
                      id="solutionUrl"
                      name="solutionUrl"
                      type="url"
                      defaultValue={question.solutionUrl}
                      className={fieldClass}
                      required
                    />
                  </Field>
                </div>
              </div>

              <aside className="space-y-6 lg:border-l lg:border-[#3e2723] lg:pl-10">
                <Field label="Difficulty">
                  <Segmented
                    label="Difficulty"
                    value={question.difficulty}
                    onChange={(value) => setQuestion({ ...question, difficulty: value })}
                    options={[
                      { value: "Easy", label: "Easy", color: DIFFICULTY_COLOR.Easy },
                      { value: "Medium", label: "Medium", color: DIFFICULTY_COLOR.Medium },
                      { value: "Hard", label: "Hard", color: DIFFICULTY_COLOR.Hard },
                    ]}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Time limit (ms)" htmlFor="timeLimit">
                    <Input
                      id="timeLimit"
                      name="timeLimit"
                      type="number"
                      min={1}
                      defaultValue={question.timeLimit}
                      className={fieldClass}
                      required
                    />
                  </Field>
                  <Field label="Memory limit (MB)" htmlFor="memoryLimit">
                    <Input
                      id="memoryLimit"
                      name="memoryLimit"
                      type="number"
                      min={1}
                      defaultValue={question.memoryLimit}
                      className={fieldClass}
                      required
                    />
                  </Field>
                </div>

                <Field label="Judge type">
                  <Segmented
                    label="Judge type"
                    value={question.judgeType}
                    onChange={(value) => setQuestion({ ...question, judgeType: value })}
                    options={[
                      { value: "EXACT_MATCH", label: "Exact match" },
                      { value: "UNORDERED_MATCH", label: "Unordered" },
                      { value: "SPECIAL_JUDGE", label: "Special judge" },
                    ]}
                  />
                </Field>

                <label className="flex cursor-pointer items-center gap-3 text-sm text-[#eaddcf]">
                  <Checkbox
                    checked={question.hasChecker}
                    onCheckedChange={(checked) =>
                      setQuestion({ ...question, hasChecker: checked === true })
                    }
                  />
                  Use a custom checker
                </label>

                <Field label="Categories">
                  <MultiSelect
                    options={categoryOptions}
                    selected={question.categories.map((item) => item.slug)}
                    onChange={(slugs) =>
                      setQuestion({
                        ...question,
                        categories: categories.filter((item) => slugs.includes(item.slug)),
                      })
                    }
                    placeholder="Select categories"
                  />
                </Field>

                <Field label="Companies">
                  <MultiSelect
                    options={companyOptions}
                    selected={question.companyTag.map((item) => item.slug)}
                    onChange={(slugs) =>
                      setQuestion({
                        ...question,
                        companyTag: companies.filter((item) => slugs.includes(item.slug)),
                      })
                    }
                    placeholder="Select companies"
                  />
                </Field>

                <Field
                  label="Supported languages"
                  hint="Choose at least one enabled language for this kata."
                >
                  <MultiSelect
                    options={supportedLanguageOptions}
                    selected={question.supportedLanguages.map((language) => language.id)}
                    onChange={(ids) =>
                      setQuestion({
                        ...question,
                        supportedLanguages: languages.filter(
                          (language) => ids.includes(language.id) && language.isSupported !== false
                        ),
                      })
                    }
                    placeholder="Select supported languages"
                  />
                </Field>
              </aside>
            </div>

            <div className="sticky bottom-0 z-10 mt-10 flex justify-end gap-3 border-t border-[#3e2723] bg-[#0f0b0a]/90 py-4 backdrop-blur">
              <Button type="button" className={quietButton} onClick={() => void loadEditorData()}>
                Discard changes
              </Button>
              <Button type="submit" disabled={saving} className={goldButton}>
                {saving ? <Loader2 className="animate-spin" aria-hidden /> : <Save aria-hidden />}
                Save details
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* ---------- TEST CASES ---------- */}
        <TabsContent value="testcases" className="mt-8 space-y-8">
          <div className="space-y-3">
            <ChipBar
              items={testcases.map((t, i) => ({
                id: t.id,
                label: `Case ${i + 1}`,
                badge: t.isHidden ? (
                  <EyeOff className="size-3.5 opacity-70" aria-label="Hidden" />
                ) : undefined,
              }))}
              active={caseId}
              onChange={setActiveCase}
              addLabel="New case"
            />
            <p className="text-sm text-[#8d6e63]">
              Hidden cases are used for judging but are never shown to members.
            </p>
          </div>

          {selectedCase ? (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <CodeFrame title="Input" filename="stdin">
                  <Textarea
                    aria-label="Input"
                    value={selectedCase.input}
                    onChange={(event) =>
                      setTestcases((items) =>
                        items.map((item) =>
                          item.id === selectedCase.id
                            ? { ...item, input: event.target.value }
                            : item
                        )
                      )
                    }
                    className={`${codeAreaClass} min-h-40`}
                  />
                </CodeFrame>
                <CodeFrame title="Expected output" filename="stdout">
                  <Textarea
                    aria-label="Expected output"
                    value={selectedCase.expectedOutput}
                    onChange={(event) =>
                      setTestcases((items) =>
                        items.map((item) =>
                          item.id === selectedCase.id
                            ? { ...item, expectedOutput: event.target.value }
                            : item
                        )
                      )
                    }
                    className={`${codeAreaClass} min-h-40`}
                  />
                </CodeFrame>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <Checkbox
                    checked={selectedCase.isHidden}
                    onCheckedChange={(checked) =>
                      setTestcases((items) =>
                        items.map((item) =>
                          item.id === selectedCase.id
                            ? { ...item, isHidden: checked === true }
                            : item
                        )
                      )
                    }
                  />
                  Hidden case
                </label>

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    className="rounded-full text-[#d4796b] hover:bg-[#8f3b31]/25 hover:text-[#d4796b]"
                    onClick={() =>
                      setDeleteTarget({
                        type: "testcase",
                        id: selectedCase.id,
                        title: `Case ${testcases.indexOf(selectedCase) + 1}`,
                      })
                    }
                  >
                    <Trash2 aria-hidden /> Delete
                  </Button>
                  <Button
                    type="button"
                    className={quietButton}
                    onClick={() => void loadEditorData()}
                  >
                    Revert
                  </Button>
                  <Button
                    type="button"
                    className={goldButton}
                    onClick={() => void saveTestcase(selectedCase)}
                  >
                    <Save aria-hidden /> Save case
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={addTestcase} className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <CodeFrame title="Input" filename="stdin">
                  <Textarea
                    aria-label="Input"
                    name="input"
                    className={`${codeAreaClass} min-h-40`}
                    required
                  />
                </CodeFrame>
                <CodeFrame title="Expected output" filename="stdout">
                  <Textarea
                    aria-label="Expected output"
                    name="expectedOutput"
                    className={`${codeAreaClass} min-h-40`}
                    required
                  />
                </CodeFrame>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <label className="flex cursor-pointer items-center gap-3 text-sm">
                  <Checkbox name="isHidden" /> Hidden case
                </label>
                <Button type="submit" className={goldButton}>
                  <Plus aria-hidden /> Add case
                </Button>
              </div>
            </form>
          )}
        </TabsContent>

        {/* ---------- CODE STUBS ---------- */}
        <TabsContent value="codestubs" className="mt-8 space-y-8">
          <div className="space-y-3">
            <ChipBar
              items={codestubs.map((s) => ({ id: s.id, label: s.language.name }))}
              active={stubId}
              onChange={setActiveStub}
              addLabel="Add language"
            />
            <p className="text-sm text-[#8d6e63]">
              The starter code is what members see in the editor. The driver code wraps their
              solution and runs behind the scenes.
            </p>
          </div>

          {selectedStub ? (
            <div className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-2">
                <CodeFrame
                  title="Starter code"
                  filename={`solution${dotExt(selectedStub.language.extension)}`}
                >
                  <Textarea
                    aria-label="Starter code"
                    value={selectedStub.userSnippet}
                    onChange={(event) =>
                      setCodestubs((items) =>
                        items.map((item) =>
                          item.id === selectedStub.id
                            ? { ...item, userSnippet: event.target.value }
                            : item
                        )
                      )
                    }
                    className={`${codeAreaClass} min-h-64`}
                  />
                </CodeFrame>
                <CodeFrame
                  title="Driver code"
                  filename={`driver${dotExt(selectedStub.language.extension)}`}
                >
                  <Textarea
                    aria-label="Driver code"
                    value={selectedStub.driverCode}
                    onChange={(event) =>
                      setCodestubs((items) =>
                        items.map((item) =>
                          item.id === selectedStub.id
                            ? { ...item, driverCode: event.target.value }
                            : item
                        )
                      )
                    }
                    className={`${codeAreaClass} min-h-64`}
                  />
                </CodeFrame>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-full text-[#d4796b] hover:bg-[#8f3b31]/25 hover:text-[#d4796b]"
                  onClick={() =>
                    setDeleteTarget({
                      type: "codestub",
                      id: selectedStub.id,
                      title: `${selectedStub.language.name} code stub`,
                    })
                  }
                >
                  <Trash2 aria-hidden /> Delete
                </Button>
                <Button type="button" className={quietButton} onClick={() => void loadEditorData()}>
                  Revert
                </Button>
                <Button
                  type="button"
                  className={goldButton}
                  onClick={() => void saveCodestub(selectedStub)}
                >
                  <Save aria-hidden /> Save {selectedStub.language.name}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={addCodestub} className="space-y-5">
              <Field label="Language" htmlFor="new-stub-language" className="max-w-xs">
                <Select name="languageId" required>
                  <SelectTrigger id="new-stub-language" className={`${fieldClass} w-full`}>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent className="border-[#3e2723] bg-[#1a110d] text-[#eaddcf]">
                    {languages
                      .filter(
                        (language) => !codestubs.some((stub) => stub.languageId === language.id)
                      )
                      .map((language) => (
                        <SelectItem
                          key={language.id}
                          value={language.id}
                          className="focus:bg-[#3e2723]/40 focus:text-[#eaddcf]"
                        >
                          {language.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>

              <div className="grid gap-4 lg:grid-cols-2">
                <CodeFrame title="Starter code">
                  <Textarea
                    aria-label="Starter code"
                    name="userSnippet"
                    className={`${codeAreaClass} min-h-64`}
                    required
                  />
                </CodeFrame>
                <CodeFrame title="Driver code">
                  <Textarea
                    aria-label="Driver code"
                    name="driverCode"
                    className={`${codeAreaClass} min-h-64`}
                    required
                  />
                </CodeFrame>
              </div>

              <div className="flex justify-end">
                <Button type="submit" className={goldButton}>
                  <Plus aria-hidden /> Add code stub
                </Button>
              </div>
            </form>
          )}
        </TabsContent>

        {/* ---------- CUSTOM CHECKER ---------- */}
        <TabsContent value="checker" className="mt-8 space-y-8">
          <div className="space-y-3">
            <ChipBar
              items={checkers.map((c) => ({ id: c.id, label: `v${c.version}` }))}
              active={checkerId}
              onChange={setActiveChecker}
              addLabel="New revision"
            />
            <p className="text-sm text-[#8d6e63]">
              Revisions are versioned. Saving a revision changes it in place, so create a new one if
              you want to keep the previous source.
            </p>
          </div>

          {selectedChecker ? (
            <div className="space-y-5">
              <p className="text-sm text-[#a1887f]">
                Revision {selectedChecker.version} in {selectedChecker.language.name}, created{" "}
                <time suppressHydrationWarning dateTime={selectedChecker.createdAt}>
                  {new Date(selectedChecker.createdAt).toLocaleString()}
                </time>
              </p>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem]">
                <CodeFrame
                  title="Checker source"
                  filename={`checker${dotExt(selectedChecker.language.extension)}`}
                >
                  <Textarea
                    aria-label="Checker source"
                    value={selectedChecker.scriptSource}
                    onChange={(event) =>
                      setCheckers((items) =>
                        items.map((item) =>
                          item.id === selectedChecker.id
                            ? { ...item, scriptSource: event.target.value }
                            : item
                        )
                      )
                    }
                    className={`${codeAreaClass} min-h-64`}
                  />
                </CodeFrame>
                <Field label="Timeout (ms)" htmlFor="checker-timeout">
                  <Input
                    id="checker-timeout"
                    type="number"
                    min={1}
                    value={selectedChecker.timeoutMs}
                    onChange={(event) =>
                      setCheckers((items) =>
                        items.map((item) =>
                          item.id === selectedChecker.id
                            ? { ...item, timeoutMs: Number(event.target.value) }
                            : item
                        )
                      )
                    }
                    className={fieldClass}
                  />
                </Field>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" className={quietButton} onClick={() => void loadEditorData()}>
                  Revert
                </Button>
                <Button
                  type="button"
                  className={goldButton}
                  onClick={() => void saveChecker(selectedChecker)}
                >
                  <Save aria-hidden /> Save revision
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={addChecker} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_12rem]">
                <Field label="Language" htmlFor="new-checker-language">
                  <Select name="languageId" required>
                    <SelectTrigger id="new-checker-language" className={`${fieldClass} w-full`}>
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent className="border-[#3e2723] bg-[#1a110d] text-[#eaddcf]">
                      {languages.map((language) => (
                        <SelectItem
                          key={language.id}
                          value={language.id}
                          className="focus:bg-[#3e2723]/40 focus:text-[#eaddcf]"
                        >
                          {language.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Timeout (ms)" htmlFor="new-checker-timeout">
                  <Input
                    id="new-checker-timeout"
                    name="timeoutMs"
                    type="number"
                    min={1}
                    defaultValue={2000}
                    className={fieldClass}
                    required
                  />
                </Field>
              </div>

              <CodeFrame title="Checker source">
                <Textarea
                  aria-label="Checker source"
                  name="scriptSource"
                  className={`${codeAreaClass} min-h-64`}
                  required
                />
              </CodeFrame>

              <div className="flex justify-end">
                <Button type="submit" className={goldButton}>
                  <Plus aria-hidden /> Create revision
                </Button>
              </div>
            </form>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent className="border-[#3e2723] bg-[#1a110d] text-[#eaddcf]">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-xl text-[#eaddcf]">
              Delete {deleteTarget?.title}?
            </AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed text-[#a1887f]">
              This is permanent and can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#3e2723] bg-transparent text-[#eaddcf] hover:bg-[#0f0b0a] hover:text-[#eaddcf]">
              Keep it
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void deleteResource();
              }}
              className="bg-[#8f3b31] text-[#eaddcf] hover:bg-[#a6453a]"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}