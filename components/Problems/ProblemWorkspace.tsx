"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BeforeMount } from "@monaco-editor/react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Info,
  Loader2,
  Lock,
  Play,
  RotateCcw,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarkdownViewer from "@/components/Discussion/Create/MarkdownViewer";
import { useProblemWorkspaceStore } from "@/lib/stores/problem-workspace";
import { cn } from "@/lib/utils";
import { EnsoCat, Grain, Paw } from "@/components/Landing Page/DojoGraphics";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full items-center justify-center gap-2 text-sm text-[#d4af37]"
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Loading editor...
    </div>
  ),
});

type Language = {
  id: string;
  name: string;
  slug: string;
  monacoSlug: string;
  extension: string;
};
type Testcase = {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
};
type Codestub = {
  languageId: string;
  userSnippet: string;
  language: Language;
};
type Progress = {
  status: string;
  userCode: string | null;
  languageId: string | null;
  result: string;
  timeTaken: number;
  memoryUsed: number;
  testcasesPassed: number;
  totalTestcases: number;
} | null;
type Problem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  constraints: string | null;
  difficulty: "Easy" | "Medium" | "Hard";
  timeLimit: number;
  memoryLimit: number;
  judgeType: string;
  hasChecker: boolean;
  externalPlatformUrl: string;
  solutionUrl: string;
  noOfSubmissions: number;
  noOfPeopleSolved: number;
  categories: { id: string; name: string; slug: string }[];
  companyTag: { id: string; name: string; slug: string; logo: string | null }[];
  supportedLanguages: Language[];
  testcases: Testcase[];
  codestubs: Codestub[];
  userProgress: Progress;
};
type CachedLanguage = Language;
type WorkspaceCache = {
  problem: Problem;
  languages: Language[];
};

const panelClass = "rounded-lg border border-[#5c3d21] bg-[#18120e]";

/* Difficulty is shown as a belt, consistently with the rest of the dojo */
const BELT = {
  Easy: { bar: "bg-green-500", text: "text-green-400", label: "Easy" },
  Medium: { bar: "bg-yellow-500", text: "text-yellow-400", label: "Medium" },
  Hard: { bar: "bg-red-500", text: "text-red-400", label: "Hard" },
} as const;

const STATUS_CHIP: Record<string, { label: string; className: string }> = {
  unvisited: { label: "Not started", className: "border-[#5c3d21] text-[#8d6e63]" },
  attempted: { label: "Attempted", className: "border-yellow-600/50 text-yellow-400" },
  completed: { label: "Solved", className: "border-[#d4af37]/60 text-[#d4af37]" },
};

/* A dark, warm editor theme that matches the rest of the site */
const defineDojoTheme: BeforeMount = (monaco) => {
  monaco.editor.defineTheme("dojo", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#120d0a",
      "editor.foreground": "#eaddcf",
      "editor.lineHighlightBackground": "#2b1a1266",
      "editor.selectionBackground": "#5c3d2199",
      "editor.inactiveSelectionBackground": "#5c3d2155",
      "editorLineNumber.foreground": "#5d4037",
      "editorLineNumber.activeForeground": "#d4af37",
      "editorCursor.foreground": "#d4af37",
      "editorIndentGuide.background1": "#3a2318",
      "editorIndentGuide.activeBackground1": "#5c3d21",
      "editorWidget.background": "#18120e",
      "editorWidget.border": "#5c3d21",
      "scrollbarSlider.background": "#5c3d2166",
      "scrollbarSlider.hoverBackground": "#5c3d21aa",
    },
  });
};

async function readJson<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(typeof payload === "string" ? payload : `Request failed (${response.status})`);
  }
  return payload as T;
}

export default function ProblemWorkspace({
  questionId,
  questionSlug,
}: {
  questionId: string;
  questionSlug: string;
}) {
  const cachedProblem = useProblemWorkspaceStore(
    (state) => state.cachedProblems[questionId] as WorkspaceCache | undefined
  );
  const codeByProblem = useProblemWorkspaceStore((state) => state.codeByProblem);
  const setCode = useProblemWorkspaceStore((state) => state.setCode);
  const cacheProblem = useProblemWorkspaceStore((state) => state.cacheProblem);
  const cacheLanguages = useProblemWorkspaceStore((state) => state.cacheLanguages);
  const storedLanguages = useProblemWorkspaceStore(
    (state) => state.cachedLanguages as CachedLanguage[] | null
  );

  const [problem, setProblem] = useState<Problem | null>(cachedProblem?.problem ?? null);
  const [languages, setLanguages] = useState<Language[]>(
    cachedProblem?.languages ?? storedLanguages ?? []
  );
  const [selectedLanguageId, setSelectedLanguageId] = useState("");
  const [selectedTestcaseId, setSelectedTestcaseId] = useState("");
  const [testInput, setTestInput] = useState("");
  const [isLoading, setIsLoading] = useState(!cachedProblem);
  const [loadError, setLoadError] = useState("");
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
  const [consoleTab, setConsoleTab] = useState<"testcase" | "output">("testcase");
  const [leftWidth, setLeftWidth] = useState(46);
  const [isDragging, setIsDragging] = useState(false);
  const [isWideScreen, setIsWideScreen] = useState(false);
  const [activeProblemTab, setActiveProblemTab] = useState("description");
  const workspaceRef = useRef<HTMLDivElement>(null);
  const availableLanguages = useMemo(
    () =>
      problem?.supportedLanguages.length
        ? languages.filter((language) =>
            problem.supportedLanguages.some(
              (supportedLanguage) => supportedLanguage.id === language.id
            )
          )
        : languages,
    [languages, problem]
  );

  const loadProblem = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const [problemResponse, languageResponse] = await Promise.all([
          fetch(`/api/questions/${encodeURIComponent(questionId)}`, { signal }),
          fetch("/api/language", { signal }),
        ]);
        const [problemData, languageData] = await Promise.all([
          readJson<Problem>(problemResponse),
          readJson<Language[]>(languageResponse),
        ]);
        setProblem(problemData);
        setLanguages(languageData);
        cacheLanguages(languageData);
        cacheProblem(questionId, { problem: problemData, languages: languageData });
        setLoadError("");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        const message = error instanceof Error ? error.message : "Failed to load problem.";
        setLoadError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [cacheLanguages, cacheProblem, questionId]
  );

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const initialize = async () => {
      await useProblemWorkspaceStore.persist.rehydrate();
      if (cancelled) return;
      const cached = useProblemWorkspaceStore.getState().cachedProblems[questionId] as
        WorkspaceCache | undefined;
      if (cached) {
        setProblem(cached.problem);
        setLanguages(cached.languages);
        setIsLoading(false);
      }
      await loadProblem(controller.signal);
    };

    void initialize();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [loadProblem, questionId]);

  useEffect(() => {
    if (!problem) return;
    const preferredLanguageCandidates = [
      problem.userProgress?.languageId,
      problem.codestubs[0]?.languageId,
      availableLanguages[0]?.id,
    ];
    const preferredLanguage =
      preferredLanguageCandidates.find(
        (languageId) =>
          languageId !== null &&
          languageId !== undefined &&
          availableLanguages.some((language) => language.id === languageId)
      ) ?? "";
    setSelectedLanguageId((current) =>
      availableLanguages.some((language) => language.id === current) ? current : preferredLanguage
    );
    if (problem.testcases.length > 0) {
      setSelectedTestcaseId((current) => current || problem.testcases[0].id);
      setTestInput((current) => current || problem.testcases[0].input);
    }
  }, [availableLanguages, problem]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1280px)");
    const updateScreenSize = () => setIsWideScreen(mediaQuery.matches);
    updateScreenSize();
    mediaQuery.addEventListener("change", updateScreenSize);
    return () => mediaQuery.removeEventListener("change", updateScreenSize);
  }, []);

  const selectedLanguage = useMemo(
    () => availableLanguages.find((language) => language.id === selectedLanguageId) ?? null,
    [availableLanguages, selectedLanguageId]
  );
  const selectedStub = useMemo(
    () => problem?.codestubs.find((stub) => stub.languageId === selectedLanguageId),
    [problem, selectedLanguageId]
  );
  const savedCode = problem ? codeByProblem[questionId]?.[selectedLanguageId] : undefined;
  const initialCode =
    savedCode ??
    (problem?.userProgress?.languageId === selectedLanguageId
      ? problem.userProgress.userCode
      : undefined) ??
    selectedStub?.userSnippet ??
    "";
  const selectedTestcase = problem?.testcases.find(
    (testcase) => testcase.id === selectedTestcaseId
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !workspaceRef.current) return;
    const bounds = workspaceRef.current.getBoundingClientRect();
    const percent = ((event.clientX - bounds.left) / bounds.width) * 100;
    setLeftWidth(Math.max(28, Math.min(68, percent)));
  };

  /* ---------- Loading and error ---------- */
  if (isLoading && !problem) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-[#d4af37]">
        <EnsoCat className="size-20 opacity-50" />
        <div className="flex items-center gap-3" role="status" aria-live="polite">
          <Loader2 className="size-5 animate-spin" />
          Loading problem...
        </div>
      </div>
    );
  }

  if (loadError && !problem) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center space-y-4 px-5 py-16 text-center">
        <EnsoCat className="size-24 opacity-60" />
        <p role="alert" className="text-red-400">
          {loadError}
        </p>
        <Link
          href="/problems"
          className="rounded-md border border-[#5c3d21] px-5 py-2 text-[#d4af37] transition-colors hover:border-[#d4af37] hover:bg-[#2b1a12]"
        >
          Back to problems
        </Link>
      </div>
    );
  }

  if (!problem) return null;

  const belt = BELT[problem.difficulty] ?? BELT.Medium;
  const progressStatus = problem.userProgress?.status ?? "unvisited";
  const statusChip = STATUS_CHIP[progressStatus] ?? STATUS_CHIP.unvisited;
  const hasAttempted = progressStatus === "attempted" || progressStatus === "completed";
  const isSolved = progressStatus === "completed";

  const accordionItemClass =
    "rounded-md border border-[#3a2318] bg-[#120d0a]/70 px-4 transition-colors data-[state=open]:border-[#5c3d21]";
  const accordionTriggerClass =
    "py-3 text-sm font-medium text-[#eaddcf] hover:text-[#d4af37] hover:no-underline";

  return (
    <div className="mx-auto max-w-[1800px] px-3 pb-5 sm:px-5">
      {/* ---------- Top bar ---------- */}
      <header className="relative mb-3 flex flex-wrap items-center justify-between gap-3 overflow-hidden rounded-lg border border-[#5c3d21] bg-[#2b1a12] px-4 py-3">
        <Grain variant="hinoki" strength={0.6} />

        <div className="relative flex min-w-0 items-center gap-3">
          <Link
            href="/problems"
            aria-label="Back to problems"
            className="rounded-md p-2 text-[#a1887f] transition-colors hover:bg-[#3a2318] hover:text-[#d4af37]"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="hidden size-9 shrink-0 items-center justify-center rounded-[3px] border border-[#5c3d21] bg-[#120d0a] font-serif text-lg text-[#d4af37] sm:flex">
            型
          </span>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-lg font-semibold text-[#eaddcf]">
              {problem.title}
            </h1>
            <p className="truncate font-mono text-xs text-[#8d6e63]">{problem.slug}</p>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <Button
            type="button"
            disabled
            title="Code execution is not configured on the backend yet"
            className="border border-[#5c3d21] bg-[#120d0a] text-[#a1887f]"
          >
            <Play className="size-4" /> Run
          </Button>
          <Button
            type="button"
            disabled
            title="Solution judging is not configured on the backend yet"
            className="bg-[#d4af37] font-semibold text-[#1a110d]"
          >
            <Send className="size-4" /> Submit
          </Button>
        </div>
      </header>

      {(loadError || isLoading) && (
        <div className="mb-3 flex items-center gap-2 text-xs text-[#a1887f]" role="status">
          {isLoading && <Loader2 className="size-3 animate-spin" />}
          {loadError
            ? `Showing cached problem data. Refresh failed: ${loadError}`
            : "Refreshing problem data..."}
        </div>
      )}
      <div className="mb-3 flex items-start gap-2 rounded-md border border-yellow-700/30 bg-yellow-900/10 px-4 py-2 text-xs text-yellow-100/80">
        <Info className="mt-px size-3.5 shrink-0" />
        <span>
          Code execution and judged submissions are unavailable: this project does not yet have a
          runner or judge API. Your code is saved locally in this browser.
        </span>
      </div>

      <div
        ref={workspaceRef}
        className="grid min-h-[calc(100vh-14rem)] grid-cols-1 gap-3 xl:h-[calc(100vh-14rem)] xl:min-h-[560px] xl:gap-0"
        style={{
          gridTemplateColumns: isWideScreen
            ? `minmax(0, ${leftWidth}fr) 12px minmax(0, ${100 - leftWidth}fr)`
            : undefined,
        }}
      >
        {/* ================= Left: the problem ================= */}
        <section className={`${panelClass} flex min-h-[400px] flex-col overflow-hidden xl:min-h-0`}>
          <Tabs
            value={activeProblemTab}
            onValueChange={setActiveProblemTab}
            className="flex min-h-0 flex-1"
          >
            <div className="flex items-center justify-between border-b border-[#5c3d21] bg-[#2b1a12]/60 px-3">
              <TabsList className="h-11 rounded-none bg-transparent p-0">
                {[
                  ["description", "Description"],
                  ["progress", "My progress"],
                ].map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="h-full rounded-none border-b-2 border-transparent px-4 text-[#a1887f] data-[state=active]:border-[#d4af37] data-[state=active]:bg-transparent data-[state=active]:text-[#eaddcf]"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <span className="text-xs tabular-nums text-[#5d4037]">
                {problem.noOfSubmissions} submissions
              </span>
            </div>

            <TabsContent value="description" className="m-0 min-h-0 flex-1 overflow-y-auto p-5">
              <div className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-2 -top-4 select-none font-serif text-8xl leading-none text-[#d4af37]/4"
                >
                  型
                </span>

                <h2 className="relative font-serif text-2xl font-bold text-[#eaddcf]">
                  {problem.title}
                </h2>

                <div className="relative mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border border-[#5c3d21] bg-[#120d0a] px-3 py-1 text-xs font-medium",
                      belt.text
                    )}
                  >
                    <span className={cn("h-1.5 w-4 rounded-full", belt.bar)} />
                    {belt.label}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border bg-[#120d0a] px-3 py-1 text-xs font-medium",
                      statusChip.className
                    )}
                  >
                    {isSolved && <Paw className="size-3 -rotate-12" />}
                    {statusChip.label}
                  </span>
                  <span className="text-xs text-[#8d6e63]">
                    {problem.noOfPeopleSolved} learners solved this kata
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <MarkdownViewer content={problem.description} />
              </div>

              {/* details tucked into an accordion, so the page stays calm */}
              <Accordion type="multiple" className="mt-8 space-y-2">
                {problem.categories.length > 0 && (
                  <AccordionItem value="topics" className={accordionItemClass}>
                    <AccordionTrigger className={accordionTriggerClass}>
                      <span className="flex items-center gap-2">
                        Topics
                        <Badge className="border-none bg-[#3a2318] px-1.5 text-[10px] text-[#a1887f]">
                          {problem.categories.length}
                        </Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2 pb-1">
                        {problem.categories.map((category) => (
                          <Badge
                            key={category.id}
                            variant="outline"
                            className="border-[#5c3d21] bg-[#18120e] text-[#a1887f]"
                          >
                            {category.name}
                          </Badge>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {problem.companyTag.length > 0 && (
                  <AccordionItem value="companies" className={accordionItemClass}>
                    <AccordionTrigger className={accordionTriggerClass}>
                      <span className="flex items-center gap-2">
                        Companies
                        <Badge className="border-none bg-[#3a2318] px-1.5 text-[10px] text-[#a1887f]">
                          {problem.companyTag.length}
                        </Badge>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-wrap gap-2 pb-1">
                        {problem.companyTag.map((company) => (
                          <Badge
                            key={company.id}
                            variant="outline"
                            className="border-[#5d4037] bg-[#18120e] text-[#d4af37]"
                          >
                            {company.name}
                          </Badge>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                <AccordionItem value="constraints" className={accordionItemClass}>
                  <AccordionTrigger className={accordionTriggerClass}>Constraints</AccordionTrigger>
                  <AccordionContent>
                    {problem.constraints?.trim() && (
                      <div className="mb-4 border-b border-[#3a2318] pb-2">
                        <MarkdownViewer content={problem.constraints} />
                      </div>
                    )}
                    <dl className="grid gap-2 pb-1 text-sm sm:grid-cols-3">
                      <div className="rounded-sm border border-[#3a2318] bg-[#18120e] p-3">
                        <dt className="text-xs text-[#8d6e63]">Time limit</dt>
                        <dd className="mt-1 font-mono text-[#eaddcf]">{problem.timeLimit} ms</dd>
                      </div>
                      <div className="rounded-sm border border-[#3a2318] bg-[#18120e] p-3">
                        <dt className="text-xs text-[#8d6e63]">Memory limit</dt>
                        <dd className="mt-1 font-mono text-[#eaddcf]">{problem.memoryLimit} MB</dd>
                      </div>
                      <div className="rounded-sm border border-[#3a2318] bg-[#18120e] p-3">
                        <dt className="text-xs text-[#8d6e63]">Output comparison</dt>
                        <dd className="mt-1 font-mono capitalize text-[#eaddcf]">
                          {problem.judgeType.replaceAll("_", " ").toLowerCase()}
                        </dd>
                      </div>
                    </dl>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="solution" className={accordionItemClass}>
                  <AccordionTrigger className={accordionTriggerClass}>Solution</AccordionTrigger>
                  <AccordionContent>
                    {hasAttempted ? (
                      <a
                        href={problem.solutionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-[#d4af37] transition-colors hover:text-[#e5c158] hover:underline"
                      >
                        View solution <ExternalLink className="size-3.5" />
                      </a>
                    ) : (
                      <p className="flex items-start gap-2 text-sm text-[#8d6e63]">
                        <Lock className="mt-0.5 size-3.5 shrink-0" />
                        The solution scroll is sealed. Attempt the kata to break the seal.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>

            {/* ---------- Progress ---------- */}
            <TabsContent value="progress" className="m-0 min-h-0 flex-1 overflow-y-auto p-5">
              <h2 className="mb-4 font-serif text-xl font-semibold">Your latest progress</h2>
              {problem.userProgress ? (
                <>
                  {/* test cases passed, as a bar */}
                  <div className="mb-5 rounded-md border border-[#5c3d21] bg-[#120d0a] p-4">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-[#a1887f]">Test cases passed</span>
                      <span className="font-mono tabular-nums text-[#eaddcf]">
                        {problem.userProgress.testcasesPassed}/{problem.userProgress.totalTestcases}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#2b1a12]">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-[#8d6e63] to-[#d4af37] transition-all duration-500"
                        style={{
                          width: `${
                            problem.userProgress.totalTestcases > 0
                              ? (problem.userProgress.testcasesPassed /
                                  problem.userProgress.totalTestcases) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <dl className="grid gap-3 sm:grid-cols-2">
                    {[
                      ["Status", problem.userProgress.status],
                      ["Latest result", problem.userProgress.result],
                      ["Execution time", `${problem.userProgress.timeTaken} ms`],
                      [
                        "Memory used",
                        problem.userProgress.memoryUsed > 0
                          ? `${problem.userProgress.memoryUsed} MB`
                          : "Not measured",
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-md border border-[#3a2318] bg-[#120d0a] p-3"
                      >
                        <dt className="text-xs text-[#8d6e63]">{label}</dt>
                        <dd className="mt-1 text-sm font-medium capitalize">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : (
                <div className="flex flex-col items-center rounded-md border border-dashed border-[#5c3d21] py-12 text-center">
                  <EnsoCat className="size-20 opacity-50" />
                  <p className="mt-3 text-sm text-[#a1887f]">
                    No saved progress is available for this problem yet.
                  </p>
                </div>
              )}
              <p className="mt-5 text-xs text-[#8d6e63]">
                Submission history is not available because the backend stores only the latest
                progress record.
              </p>
            </TabsContent>
          </Tabs>
        </section>

        {/* ================= Resize handle ================= */}
        <div
          role="separator"
          aria-label="Resize problem and editor panels"
          aria-orientation="vertical"
          tabIndex={0}
          className="group hidden cursor-col-resize touch-none items-center justify-center xl:flex focus-visible:outline-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => setIsDragging(false)}
          onPointerCancel={() => setIsDragging(false)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") setLeftWidth((value) => Math.max(28, value - 3));
            if (event.key === "ArrowRight") setLeftWidth((value) => Math.min(68, value + 3));
          }}
        >
          <span
            className={cn(
              "flex h-14 w-1.5 flex-col items-center justify-center gap-1 rounded-full bg-[#3a2318] transition-colors group-hover:bg-[#d4af37]/60 group-focus-visible:bg-[#d4af37]",
              isDragging && "bg-[#d4af37]"
            )}
          >
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-0.5 rounded-full bg-[#120d0a]" />
            ))}
          </span>
        </div>

        {/* ================= Right: the editor ================= */}
        <section className={`${panelClass} flex min-h-[560px] flex-col overflow-hidden xl:min-h-0`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#5c3d21] bg-[#2b1a12]/60 p-3">
            <div className="flex items-center gap-3">
              <label htmlFor="language-select" className="sr-only">
                Programming language
              </label>
              <div className="relative">
                <select
                  id="language-select"
                  value={selectedLanguageId}
                  onChange={(event) => setSelectedLanguageId(event.target.value)}
                  className="h-9 min-w-44 cursor-pointer appearance-none rounded-md border border-[#5c3d21] bg-[#120d0a] pl-3 pr-9 text-sm text-[#eaddcf] outline-none transition-colors hover:border-[#d4af37]/70 focus:border-[#d4af37]"
                >
                  {availableLanguages.map((language) => (
                    <option key={language.id} value={language.id}>
                      {language.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[#8d6e63]" />
              </div>
              <span className="hidden text-xs text-[#8d6e63] sm:inline">
                {selectedStub ? "Starter template loaded" : "No starter template"}
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!selectedStub || !selectedLanguage}
              onClick={() => {
                if (selectedStub && selectedLanguage) {
                  setCode(questionId, selectedLanguage.id, selectedStub.userSnippet);
                }
              }}
              title="Replace your code with the starter template"
              className="text-[#a1887f] hover:bg-[#3a2318] hover:text-[#d4af37]"
            >
              <RotateCcw className="size-3.5" /> Reset
            </Button>
          </div>

          <div className="min-h-[350px] flex-1 xl:min-h-0">
            {selectedLanguage ? (
              <MonacoEditor
                key={`${questionSlug}-${selectedLanguage.id}`}
                height={isWideScreen ? "100%" : "420px"}
                language={selectedLanguage.monacoSlug}
                theme="dojo"
                beforeMount={defineDojoTheme}
                value={initialCode}
                onChange={(value) => setCode(questionId, selectedLanguage.id, value ?? "")}
                options={{
                  automaticLayout: true,
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  tabSize: 2,
                  lineNumbers: "on",
                  bracketPairColorization: { enabled: true },
                  guides: { bracketPairs: true },
                  padding: { top: 16 },
                }}
              />
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-sm text-[#a1887f]">
                {isLoading ? (
                  <span
                    className="flex items-center gap-2 text-[#d4af37]"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Loading supported languages...
                  </span>
                ) : (
                  "No supported languages are configured."
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[#5c3d21] bg-[#2b1a12]/40 px-3 py-2 text-xs text-[#8d6e63]">
            <span className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-[#d4af37]/70" />
              Changes save automatically in this browser
            </span>
            <span className="font-mono">
              {selectedLanguage?.extension ? `.${selectedLanguage.extension}` : ""}
            </span>
          </div>

          {/* ---------- Console ---------- */}
          <div className="border-t border-[#5c3d21]">
            <div className="flex items-center justify-between bg-[#2b1a12]/60 pr-2">
              <div role="tablist" aria-label="Console" className="flex">
                {(
                  [
                    ["testcase", "Testcase"],
                    ["output", "Output"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={consoleTab === key}
                    onClick={() => {
                      setConsoleTab(key);
                      setBottomPanelOpen(true);
                    }}
                    className={cn(
                      "border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                      consoleTab === key && bottomPanelOpen
                        ? "border-[#d4af37] text-[#eaddcf]"
                        : "border-transparent text-[#a1887f] hover:text-[#d4af37]"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setBottomPanelOpen((open) => !open)}
                className="cursor-pointer rounded-md p-2 text-[#a1887f] transition-colors hover:bg-[#3a2318] hover:text-[#d4af37]"
                aria-expanded={bottomPanelOpen}
                aria-label={bottomPanelOpen ? "Collapse console" : "Expand console"}
              >
                {bottomPanelOpen ? (
                  <ChevronDown className="size-4" />
                ) : (
                  <ChevronUp className="size-4" />
                )}
              </button>
            </div>

            {bottomPanelOpen && (
              <div className="max-h-72 space-y-4 overflow-y-auto border-t border-[#3a2318] p-4">
                {consoleTab === "testcase" ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      {problem.testcases.length === 0 ? (
                        <span className="text-xs text-[#8d6e63]">No public samples</span>
                      ) : (
                        problem.testcases.map((testcase, index) => (
                          <button
                            key={testcase.id}
                            type="button"
                            aria-pressed={selectedTestcaseId === testcase.id}
                            onClick={() => {
                              setSelectedTestcaseId(testcase.id);
                              setTestInput(testcase.input);
                            }}
                            className={cn(
                              "rounded-md border px-3 py-1 text-xs font-medium transition-colors",
                              selectedTestcaseId === testcase.id
                                ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]"
                                : "border-[#5c3d21] text-[#a1887f] hover:border-[#8d6e63] hover:text-[#eaddcf]"
                            )}
                          >
                            Case {index + 1}
                          </button>
                        ))
                      )}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <label htmlFor="run-input" className="mb-1 block text-xs text-[#8d6e63]">
                          Input
                        </label>
                        <textarea
                          id="run-input"
                          value={testInput}
                          onChange={(event) => setTestInput(event.target.value)}
                          placeholder="Enter input in the problem's testcase format"
                          className="min-h-24 w-full resize-y rounded-md border border-[#3a2318] bg-[#0b0807] p-3 font-mono text-xs text-[#eaddcf] outline-none placeholder:text-[#5d4037] focus:border-[#d4af37]"
                        />
                      </div>
                      <div>
                        <p className="mb-1 text-xs text-[#8d6e63]">Expected output</p>
                        <pre className="min-h-24 overflow-auto whitespace-pre-wrap rounded-md border border-[#3a2318] bg-[#0b0807] p-3 font-mono text-xs text-[#eaddcf]">
                          {selectedTestcase?.expectedOutput ?? "No public sample output available."}
                        </pre>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center">
                    <EnsoCat className="size-16 opacity-40" />
                    <p className="mt-3 text-sm text-[#a1887f]">
                      Actual output will appear here when a code execution API is available.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
