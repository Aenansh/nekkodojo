"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, ExternalLink, Loader2, Play, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import MarkdownViewer from "@/components/Discussion/Create/MarkdownViewer";
import { useProblemWorkspaceStore } from "@/lib/stores/problem-workspace";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[#a1887f]">
      <Loader2 className="mr-2 size-4 animate-spin" /> Loading editor...
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

const panelClass = "rounded-xl border border-[#3e2723] bg-[#1a110d]";

async function readJson<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof payload === "string" ? payload : `Request failed (${response.status})`
    );
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
  const storedLanguages = useProblemWorkspaceStore((state) =>
    state.cachedLanguages as CachedLanguage[] | null
  );

  const [problem, setProblem] = useState<Problem | null>(
    cachedProblem?.problem ?? null
  );
  const [languages, setLanguages] = useState<Language[]>(
    cachedProblem?.languages ?? storedLanguages ?? []
  );
  const [selectedLanguageId, setSelectedLanguageId] = useState("");
  const [selectedTestcaseId, setSelectedTestcaseId] = useState("");
  const [testInput, setTestInput] = useState("");
  const [isLoading, setIsLoading] = useState(!cachedProblem);
  const [loadError, setLoadError] = useState("");
  const [bottomPanelOpen, setBottomPanelOpen] = useState(true);
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

  const loadProblem = useCallback(async (signal?: AbortSignal) => {
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
  }, [cacheLanguages, cacheProblem, questionId]);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const initialize = async () => {
      await useProblemWorkspaceStore.persist.rehydrate();
      if (cancelled) return;
      const cached = useProblemWorkspaceStore.getState().cachedProblems[questionId] as
        | WorkspaceCache
        | undefined;
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
      availableLanguages.some((language) => language.id === current)
        ? current
        : preferredLanguage
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
    () =>
      availableLanguages.find((language) => language.id === selectedLanguageId) ??
      null,
    [availableLanguages, selectedLanguageId]
  );
  const selectedStub = useMemo(
    () => problem?.codestubs.find((stub) => stub.languageId === selectedLanguageId),
    [problem, selectedLanguageId]
  );
  const savedCode = problem
    ? codeByProblem[questionId]?.[selectedLanguageId]
    : undefined;
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

  const difficultyColor = {
    Easy: "text-green-400 border-green-400/30 bg-green-400/10",
    Medium: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
    Hard: "text-red-400 border-red-400/30 bg-red-400/10",
  }[problem?.difficulty ?? "Medium"];

  if (isLoading && !problem) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center gap-3 text-[#d4af37]">
        <Loader2 className="size-5 animate-spin" />
        Loading problem...
      </div>
    );
  }

  if (loadError && !problem) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-5 py-16 text-center">
        <p role="alert" className="text-red-400">{loadError}</p>
        <Link href="/problems" className="text-[#d4af37] hover:underline">
          Back to problems
        </Link>
      </div>
    );
  }

  if (!problem) return null;

  return (
    <div className="mx-auto max-w-[1800px] px-3 pb-5 sm:px-5">
      <header className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#3e2723] bg-[#1a110d] px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/problems"
            aria-label="Back to problems"
            className="rounded-md p-2 text-[#a1887f] transition-colors hover:bg-[#3e2723]/50 hover:text-[#d4af37]"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-semibold text-[#eaddcf]">{problem.title}</h1>
            <p className="truncate text-xs text-[#a1887f]">{problem.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            disabled
            title="Code execution is not configured on the backend yet"
            className="bg-[#3e2723] text-[#a1887f]"
          >
            <Play className="size-4" /> Run
          </Button>
          <Button
            type="button"
            disabled
            title="Solution judging is not configured on the backend yet"
            className="bg-[#d4af37] text-black"
          >
            <Send className="size-4" /> Submit
          </Button>
        </div>
      </header>

      {(loadError || isLoading) && (
        <div className="mb-3 flex items-center gap-2 text-xs text-[#a1887f]" role="status">
          {isLoading && <Loader2 className="size-3 animate-spin" />}
          {loadError ? `Showing cached problem data. Refresh failed: ${loadError}` : "Refreshing problem data..."}
        </div>
      )}
      <div className="mb-3 rounded-lg border border-yellow-700/30 bg-yellow-900/10 px-4 py-2 text-xs text-yellow-100/80">
        Code execution and judged submissions are unavailable: this project does not yet have a runner or judge API. Your code is saved locally in this browser.
      </div>

      <div
        ref={workspaceRef}
        className="grid min-h-[calc(100vh-14rem)] grid-cols-1 gap-3 xl:h-[calc(100vh-14rem)] xl:min-h-[560px] xl:gap-0"
        style={{
          gridTemplateColumns: isWideScreen
            ? `minmax(0, ${leftWidth}fr) 8px minmax(0, ${100 - leftWidth}fr)`
            : undefined,
        }}
      >
        <section className={`${panelClass} flex min-h-[400px] flex-col overflow-hidden xl:min-h-0`}>
          <Tabs
            value={activeProblemTab}
            onValueChange={setActiveProblemTab}
            className="flex min-h-0 flex-1"
          >
            <div className="flex items-center justify-between border-b border-[#3e2723] px-3">
              <TabsList className="h-11 rounded-none bg-transparent p-0">
                <TabsTrigger
                  value="description"
                  className="h-full rounded-none border-b-2 border-transparent px-3 text-[#a1887f] data-[state=active]:border-[#d4af37] data-[state=active]:bg-transparent data-[state=active]:text-[#eaddcf]"
                >
                  Description
                </TabsTrigger>
                <TabsTrigger
                  value="progress"
                  className="h-full rounded-none border-b-2 border-transparent px-3 text-[#a1887f] data-[state=active]:border-[#d4af37] data-[state=active]:bg-transparent data-[state=active]:text-[#eaddcf]"
                >
                  My progress
                </TabsTrigger>
              </TabsList>
              <span className="text-xs text-[#5d4037]">
                {problem.noOfSubmissions} submissions
              </span>
            </div>
            <TabsContent value="description" className="m-0 min-h-0 flex-1 overflow-y-auto p-5">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <h2 className="mr-1 text-xl font-bold">{problem.title}</h2>
                <Badge variant="outline" className={difficultyColor}>
                  {problem.difficulty}
                </Badge>
                {problem.categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant="outline"
                    className="border-[#3e2723] text-[#a1887f]"
                  >
                    {category.name}
                  </Badge>
                ))}
                {problem.companyTag.map((company) => (
                  <Badge
                    key={company.id}
                    variant="outline"
                    className="border-[#5d4037] text-[#d4af37]"
                  >
                    {company.name}
                  </Badge>
                ))}
              </div>
              <MarkdownViewer content={problem.description} />
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#a1887f]">
                <span>{problem.noOfPeopleSolved} learners solved this kata</span>
                {problem.userProgress &&
                  (problem.userProgress.status === "attempted" ||
                    problem.userProgress.status === "completed") && (
                    <a
                      href={problem.solutionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#d4af37] transition-colors hover:text-[#e5c158] hover:underline"
                    >
                      View solution <ExternalLink className="size-3" />
                    </a>
                  )}
              </div>
              <div className="mt-8 border-t border-[#3e2723] pt-4">
                <h3 className="mb-3 text-sm font-semibold text-[#d4af37]">Constraints</h3>
                <ul className="space-y-2 text-sm text-[#eaddcf]/85">
                  <li>Time limit: {problem.timeLimit} ms</li>
                  <li>Memory limit: {problem.memoryLimit} MB</li>
                  <li>Output comparison: {problem.judgeType.replaceAll("_", " ").toLowerCase()}</li>
                </ul>
              </div>
            </TabsContent>
            <TabsContent value="progress" className="m-0 min-h-0 flex-1 overflow-y-auto p-5">
              <h2 className="mb-4 text-lg font-semibold">Your latest progress</h2>
              {problem.userProgress ? (
                <dl className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Status", problem.userProgress.status],
                    ["Latest result", problem.userProgress.result],
                    ["Test cases passed", `${problem.userProgress.testcasesPassed}/${problem.userProgress.totalTestcases}`],
                    ["Execution time", `${problem.userProgress.timeTaken} ms`],
                    ["Memory used", `${problem.userProgress.memoryUsed} MB`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-[#3e2723] bg-[#0f0b0a] p-3">
                      <dt className="text-xs text-[#a1887f]">{label}</dt>
                      <dd className="mt-1 text-sm font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-[#a1887f]">
                  No saved progress is available for this problem yet.
                </p>
              )}
              <p className="mt-5 text-xs text-[#a1887f]">
                Submission history is not available because the backend stores only the latest progress record.
              </p>
            </TabsContent>
          </Tabs>
        </section>

        <div
          role="separator"
          aria-label="Resize problem and editor panels"
          aria-orientation="vertical"
          tabIndex={0}
          className="hidden cursor-col-resize touch-none items-center justify-center rounded-full bg-[#3e2723] transition-colors hover:bg-[#d4af37]/70 focus-visible:outline focus-visible:outline-[#d4af37] xl:flex"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={() => setIsDragging(false)}
          onPointerCancel={() => setIsDragging(false)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") setLeftWidth((value) => Math.max(28, value - 3));
            if (event.key === "ArrowRight") setLeftWidth((value) => Math.min(68, value + 3));
          }}
        />

        <section className={`${panelClass} flex min-h-[560px] flex-col overflow-hidden xl:min-h-0`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3e2723] p-3">
            <label htmlFor="language-select" className="sr-only">Programming language</label>
            <select
              id="language-select"
              value={selectedLanguageId}
              onChange={(event) => setSelectedLanguageId(event.target.value)}
              className="h-9 min-w-44 cursor-pointer rounded-md border border-[#3e2723] bg-[#0f0b0a] px-3 text-sm text-[#eaddcf] outline-none transition-colors hover:border-[#d4af37]/70 focus:border-[#d4af37]"
            >
              {availableLanguages.map((language) => (
                <option key={language.id} value={language.id}>
                  {language.name}
                </option>
              ))}
            </select>
            <span className="text-xs text-[#a1887f]">
              {selectedLanguage?.name ?? "Choose a language"}
              {selectedStub ? " · starter template loaded" : " · no starter template"}
            </span>
          </div>
          <div className="min-h-[350px] flex-1 xl:min-h-0">
            {selectedLanguage ? (
              <MonacoEditor
                key={`${questionSlug}-${selectedLanguage.id}`}
                height={isWideScreen ? "100%" : "420px"}
                language={selectedLanguage.monacoSlug}
                theme="vs-dark"
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
                {isLoading ? "Loading supported languages..." : "No supported languages are configured."}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-[#3e2723] px-3 py-2 text-xs text-[#a1887f]">
            <span>Changes save automatically in this browser</span>
            <span>{selectedLanguage?.extension ?? ""}</span>
          </div>

          <div className="border-t border-[#3e2723]">
            <button
              type="button"
              onClick={() => setBottomPanelOpen((open) => !open)}
              className="flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-[#3e2723]/30"
              aria-expanded={bottomPanelOpen}
            >
              <span>Test cases and output</span>
              {bottomPanelOpen ? <ChevronDown className="size-4" /> : <ChevronUp className="size-4" />}
            </button>
            {bottomPanelOpen && (
              <div className="max-h-72 space-y-3 overflow-y-auto border-t border-[#3e2723] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <label htmlFor="testcase-select" className="text-xs text-[#a1887f]">
                    Sample
                  </label>
                  <select
                    id="testcase-select"
                    value={selectedTestcaseId}
                    onChange={(event) => {
                      const testcase = problem.testcases.find((item) => item.id === event.target.value);
                      setSelectedTestcaseId(event.target.value);
                      if (testcase) setTestInput(testcase.input);
                    }}
                    className="max-w-full cursor-pointer rounded-md border border-[#3e2723] bg-[#0f0b0a] px-2 py-1 text-xs text-[#eaddcf] outline-none hover:border-[#d4af37]/70"
                  >
                    {problem.testcases.map((testcase, index) => (
                      <option key={testcase.id} value={testcase.id}>
                        Sample {index + 1}
                      </option>
                    ))}
                    {problem.testcases.length === 0 && <option value="">No public samples</option>}
                  </select>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label htmlFor="run-input" className="mb-1 block text-xs text-[#a1887f]">Input</label>
                    <textarea
                      id="run-input"
                      value={testInput}
                      onChange={(event) => setTestInput(event.target.value)}
                      placeholder="Enter input in the problem's testcase format"
                      className="min-h-24 w-full resize-y rounded-md border border-[#3e2723] bg-[#0f0b0a] p-3 font-mono text-xs text-[#eaddcf] outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-[#a1887f]">Expected output</p>
                    <pre className="min-h-24 overflow-auto whitespace-pre-wrap rounded-md border border-[#3e2723] bg-[#0f0b0a] p-3 font-mono text-xs text-[#eaddcf]">
                      {selectedTestcase?.expectedOutput ?? "No public sample output available."}
                    </pre>
                  </div>
                </div>
                <p className="text-xs text-[#a1887f]">
                  Actual output will appear here when a code execution API is available.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
