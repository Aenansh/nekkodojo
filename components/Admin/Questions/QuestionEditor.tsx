"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type Option = { id: string; name: string; slug: string };
type Language = {
  id: string;
  name: string;
  slug: string;
  monacoSlug: string;
  extension: string;
};
type QuestionData = {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  externalPlatformUrl: string;
  solutionUrl: string;
  timeLimit: number;
  memoryLimit: number;
  judgeType: "EXACT_MATCH" | "UNORDERED_MATCH" | "SPECIAL_JUDGE";
  hasChecker: boolean;
  categories: Option[];
  companyTag: Option[];
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
    throw new Error(
      typeof result === "string" ? result : `Request failed (${response.status})`
    );
  }
  return result as T;
}

const fieldClass =
  "border-[#3e2723] bg-[#0f0b0a] text-[#eaddcf] placeholder:text-[#5d4037]";
const sectionClass = "rounded-xl border border-[#3e2723] bg-[#1a110d] p-4 sm:p-6";

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

  const updateQuestion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      difficulty: String(form.get("difficulty")),
      externalPlatformUrl: String(form.get("externalPlatformUrl") ?? "").trim(),
      solutionUrl: String(form.get("solutionUrl") ?? "").trim(),
      categories: question.categories.map((category) => category.slug),
      companyTag: question.companyTag.map((company) => company.slug),
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
        difficulty: payload.difficulty as QuestionData["difficulty"],
        externalPlatformUrl: payload.externalPlatformUrl,
        solutionUrl: payload.solutionUrl,
        timeLimit: payload.timeLimit,
        memoryLimit: payload.memoryLimit,
      });
      if (updated.slug !== question.slug) {
        router.replace(`/admin/questions/${updated.slug}`);
      }
      toast.success("Question details saved.");
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
      const updated = await requestJson<Testcase[]>(
        `/api/questions/${questionId}/testcases`
      );
      setTestcases(updated);
      toast.success("Testcase added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add testcase.");
    }
  };

  const saveTestcase = async (testcase: Testcase) => {
    try {
      const updated = await requestJson<Testcase>(
        `/api/questions/${questionId}/testcases`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(testcase),
        }
      );
      setTestcases((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      toast.success("Testcase saved.");
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
      setCodestubs(
        await requestJson<Codestub[]>(`/api/questions/${questionId}/codestub`)
      );
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
        toast.success("Question deleted.");
        router.push("/admin/questions");
        router.refresh();
      } else if (deleteTarget.type === "testcase") {
        await requestJson(
          `/api/questions/${questionId}/testcases?testcaseId=${encodeURIComponent(deleteTarget.id)}`,
          { method: "DELETE" }
        );
        setTestcases((items) => items.filter((item) => item.id !== deleteTarget.id));
        toast.success("Testcase deleted.");
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
      <div className="flex items-center justify-center gap-3 py-24 text-[#d4af37]">
        <Loader2 className="size-5 animate-spin" />
        <span>Loading question editor...</span>
      </div>
    );
  }
  if (pageError || !question) {
    return (
      <div className="space-y-4 py-16 text-center">
        <p role="alert" className="text-red-400">
          {pageError || "Question not found."}
        </p>
        <Button onClick={() => void loadEditorData()} variant="outline">
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#eaddcf] [&_button]:cursor-pointer [&_button]:transition-all [&_button:hover]:brightness-110 [&_button:active]:scale-[0.98] [&_label]:cursor-pointer">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Link
            href="/admin/questions"
            className="inline-flex cursor-pointer items-center gap-2 text-sm text-[#a1887f] transition-colors hover:text-[#d4af37] hover:underline"
          >
            <ArrowLeft className="size-4" /> All questions
          </Link>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#a1887f]">
              Question overview
            </p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{question.title}</h1>
            <p className="mt-1 text-sm text-[#a1887f]">
              {question.slug} · {question.difficulty} · {testcases.length} test cases ·{" "}
              {codestubs.length} language templates
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="destructive"
          onClick={() =>
            setDeleteTarget({
              type: "question",
              id: question.id,
              title: question.title,
            })
          }
        >
          <Trash2 /> Delete question
        </Button>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 bg-[#1a110d] p-1 sm:grid-cols-4">
          <TabsTrigger
            value="details"
            className="text-white transition-colors hover:bg-[#3e2723]/70 data-[state=active]:bg-[#d4af37] data-[state=active]:text-black dark:data-[state=active]:bg-[#d4af37] dark:data-[state=active]:text-black"
          >
            Question details
          </TabsTrigger>
          <TabsTrigger
            value="testcases"
            className="text-white transition-colors hover:bg-[#3e2723]/70 data-[state=active]:bg-[#d4af37] data-[state=active]:text-black dark:data-[state=active]:bg-[#d4af37] dark:data-[state=active]:text-black"
          >
            Test cases ({testcases.length})
          </TabsTrigger>
          <TabsTrigger
            value="codestubs"
            className="text-white transition-colors hover:bg-[#3e2723]/70 data-[state=active]:bg-[#d4af37] data-[state=active]:text-black dark:data-[state=active]:bg-[#d4af37] dark:data-[state=active]:text-black"
          >
            Code stubs ({codestubs.length})
          </TabsTrigger>
          <TabsTrigger
            value="checker"
            className="text-white transition-colors hover:bg-[#3e2723]/70 data-[state=active]:bg-[#d4af37] data-[state=active]:text-black dark:data-[state=active]:bg-[#d4af37] dark:data-[state=active]:text-black"
          >
            Custom checker ({checkers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <form onSubmit={updateQuestion} className={`${sectionClass} mt-4 space-y-5`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" defaultValue={question.title} className={fieldClass} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  name="difficulty"
                  value={question.difficulty}
                  onValueChange={(value: QuestionData["difficulty"]) =>
                    setQuestion({ ...question, difficulty: value })
                  }
                >
                  <SelectTrigger id="difficulty" className={fieldClass}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={question.description}
                className={`${fieldClass} min-h-48`}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="externalPlatformUrl">External platform URL</Label>
                <Input
                  id="externalPlatformUrl"
                  name="externalPlatformUrl"
                  type="url"
                  defaultValue={question.externalPlatformUrl}
                  className={fieldClass}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="solutionUrl">Solution URL</Label>
                <Input
                  id="solutionUrl"
                  name="solutionUrl"
                  type="url"
                  defaultValue={question.solutionUrl}
                  className={fieldClass}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timeLimit">Time limit (ms)</Label>
                <Input id="timeLimit" name="timeLimit" type="number" min={1} defaultValue={question.timeLimit} className={fieldClass} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memoryLimit">Memory limit (MB)</Label>
                <Input id="memoryLimit" name="memoryLimit" type="number" min={1} defaultValue={question.memoryLimit} className={fieldClass} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="judgeType">Judge type</Label>
                <Select
                  value={question.judgeType}
                  onValueChange={(value: QuestionData["judgeType"]) =>
                    setQuestion({ ...question, judgeType: value })
                  }
                >
                  <SelectTrigger className="w-[180px] border-[#3e2723] bg-[#0f0b0a] text-[#eaddcf]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-[#3e2723] bg-[#1a110d] text-[#eaddcf]">
                    <SelectItem
                      value="EXACT_MATCH"
                      className="focus:bg-[#3e2723]/20 focus:text-[#eaddcf]"
                    >
                      Exact match
                    </SelectItem>
                    <SelectItem
                      value="UNORDERED_MATCH"
                      className="focus:bg-[#3e2723]/20 focus:text-[#eaddcf]"
                    >
                      Unordered match
                    </SelectItem>
                    <SelectItem
                      value="SPECIAL_JUDGE"
                      className="focus:bg-[#3e2723]/20 focus:text-[#eaddcf]"
                    >
                      Special judge
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-3 self-end pb-2 text-sm">
                <Checkbox
                  checked={question.hasChecker}
                  onCheckedChange={(checked) =>
                    setQuestion({ ...question, hasChecker: checked === true })
                  }
                />
                Use custom checker
              </label>
            </div>
            <div className="space-y-2">
              <Label>Categories</Label>
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
            </div>
            <div className="space-y-2">
              <Label>Companies</Label>
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
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant={"destructive"} onClick={() => void loadEditorData()}>
                Cancel changes
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#d4af37] text-black hover:bg-[#b5952f]">
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                Save details
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="testcases">
          <div className="mt-4 space-y-4">
            <form onSubmit={addTestcase} className={`${sectionClass} space-y-4`}>
              <h2 className="font-semibold">Add testcase</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-testcase-input">Input</Label>
                  <Textarea id="new-testcase-input" name="input" className={`${fieldClass} min-h-32 font-mono text-sm`} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-testcase-output">Expected output</Label>
                  <Textarea id="new-testcase-output" name="expectedOutput" className={`${fieldClass} min-h-32 font-mono text-sm`} required />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox name="isHidden" /> Hidden testcase
              </label>
              <Button type="submit" className="bg-[#d4af37] text-black hover:bg-[#b5952f]">
                <Plus /> Add testcase
              </Button>
            </form>
            {testcases.map((testcase, index) => (
              <div key={testcase.id} className={`${sectionClass} space-y-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Testcase {index + 1}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => setDeleteTarget({ type: "testcase", id: testcase.id, title: `Testcase ${index + 1}` })}
                  >
                    <Trash2 /> Delete
                  </Button>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Input</Label>
                    <Textarea
                      value={testcase.input}
                      onChange={(event) =>
                        setTestcases((items) =>
                          items.map((item) => item.id === testcase.id ? { ...item, input: event.target.value } : item)
                        )
                      }
                      className={`${fieldClass} min-h-32 font-mono text-sm`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected output</Label>
                    <Textarea
                      value={testcase.expectedOutput}
                      onChange={(event) =>
                        setTestcases((items) =>
                          items.map((item) => item.id === testcase.id ? { ...item, expectedOutput: event.target.value } : item)
                        )
                      }
                      className={`${fieldClass} min-h-32 font-mono text-sm`}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={testcase.isHidden}
                      onCheckedChange={(checked) =>
                        setTestcases((items) =>
                          items.map((item) => item.id === testcase.id ? { ...item, isHidden: checked === true } : item)
                        )
                      }
                    />
                    Hidden testcase
                  </label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => void loadEditorData()}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={() => void saveTestcase(testcase)} className="bg-[#d4af37] text-black hover:bg-[#b5952f]">
                      <Save /> Save testcase
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="codestubs">
          <div className="mt-4 space-y-4">
            <form onSubmit={addCodestub} className={`${sectionClass} space-y-4`}>
              <h2 className="font-semibold">Add language code stub</h2>
              <div className="space-y-2">
                <Label htmlFor="new-stub-language">Language</Label>
                <Select name="languageId" required>
                  <SelectTrigger id="new-stub-language" className={fieldClass}>
                    <SelectValue placeholder="Select a language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.filter((language) => !codestubs.some((stub) => stub.languageId === language.id)).map((language) => (
                      <SelectItem key={language.id} value={language.id}>{language.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-user-snippet">Frontend starter code</Label>
                  <Textarea id="new-user-snippet" name="userSnippet" className={`${fieldClass} min-h-48 font-mono text-sm`} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-driver-code">Driver code</Label>
                  <Textarea id="new-driver-code" name="driverCode" className={`${fieldClass} min-h-48 font-mono text-sm`} required />
                </div>
              </div>
              <Button type="submit" className="bg-[#d4af37] text-black hover:bg-[#b5952f]">
                <Plus /> Add code stub
              </Button>
            </form>
            {codestubs.map((codestub) => (
              <div key={codestub.id} className={`${sectionClass} space-y-4`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{codestub.language.name}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300"
                    onClick={() => setDeleteTarget({ type: "codestub", id: codestub.id, title: `${codestub.language.name} code stub` })}
                  >
                    <Trash2 /> Delete
                  </Button>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Frontend starter code</Label>
                    <Textarea
                      value={codestub.userSnippet}
                      onChange={(event) =>
                        setCodestubs((items) =>
                          items.map((item) => item.id === codestub.id ? { ...item, userSnippet: event.target.value } : item)
                        )
                      }
                      className={`${fieldClass} min-h-48 font-mono text-sm`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Driver code</Label>
                    <Textarea
                      value={codestub.driverCode}
                      onChange={(event) =>
                        setCodestubs((items) =>
                          items.map((item) => item.id === codestub.id ? { ...item, driverCode: event.target.value } : item)
                        )
                      }
                      className={`${fieldClass} min-h-48 font-mono text-sm`}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => void loadEditorData()}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={() => void saveCodestub(codestub)} className="bg-[#d4af37] text-black hover:bg-[#b5952f]">
                    <Save /> Save code stub
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="checker">
          <div className="mt-4 space-y-4">
            <form onSubmit={addChecker} className={`${sectionClass} space-y-4`}>
              <h2 className="font-semibold">Create checker revision</h2>
              <p className="text-sm text-[#a1887f]">
                Checker revisions are versioned. Saving an existing revision changes it; create a new revision to preserve the previous source.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-checker-language">Language</Label>
                  <Select name="languageId" required>
                    <SelectTrigger id="new-checker-language" className={fieldClass}>
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.id} value={language.id}>{language.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-checker-timeout">Timeout (ms)</Label>
                  <Input id="new-checker-timeout" name="timeoutMs" type="number" min={1} defaultValue={2000} className={fieldClass} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-checker-source">Checker source</Label>
                <Textarea id="new-checker-source" name="scriptSource" className={`${fieldClass} min-h-48 font-mono text-sm`} required />
              </div>
              <Button type="submit" className="bg-[#d4af37] text-black hover:bg-[#b5952f]">
                <Plus /> Create revision
              </Button>
            </form>
            {checkers.map((checker) => (
              <div key={checker.id} className={`${sectionClass} space-y-4`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold">Revision {checker.version} · {checker.language.name}</h3>
                  <span className="text-xs text-[#a1887f]">
                    {new Date(checker.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
                  <div className="space-y-2">
                    <Label>Checker source</Label>
                    <Textarea
                      value={checker.scriptSource}
                      onChange={(event) =>
                        setCheckers((items) =>
                          items.map((item) => item.id === checker.id ? { ...item, scriptSource: event.target.value } : item)
                        )
                      }
                      className={`${fieldClass} min-h-48 font-mono text-sm`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Timeout (ms)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={checker.timeoutMs}
                      onChange={(event) =>
                        setCheckers((items) =>
                          items.map((item) => item.id === checker.id ? { ...item, timeoutMs: Number(event.target.value) } : item)
                        )
                      }
                      className={fieldClass}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => void loadEditorData()}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={() => void saveChecker(checker)} className="bg-[#d4af37] text-black hover:bg-[#b5952f]">
                    <Save /> Save revision
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-[#3e2723] bg-[#1a110d] text-[#eaddcf]">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription className="text-[#a1887f]">
              Permanently delete {deleteTarget?.title}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer border-[#3e2723] bg-transparent text-[#eaddcf] transition-colors hover:bg-[#3e2723]/60">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void deleteResource();
              }}
              className="cursor-pointer bg-red-800 text-white transition-colors hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
