"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type ProblemWorkspaceState = {
  codeByProblem: Record<string, Record<string, string>>;
  cachedProblems: Record<string, unknown>;
  cachedLanguages: unknown[] | null;
  setCode: (problemId: string, languageId: string, code: string) => void;
  cacheProblem: (problemId: string, problem: unknown) => void;
  cacheLanguages: (languages: unknown[]) => void;
};

export const useProblemWorkspaceStore = create<ProblemWorkspaceState>()(
  persist(
    (set) => ({
      codeByProblem: {},
      cachedProblems: {},
      cachedLanguages: null,
      setCode: (problemId, languageId, code) =>
        set((state) => ({
          codeByProblem: {
            ...state.codeByProblem,
            [problemId]: {
              ...state.codeByProblem[problemId],
              [languageId]: code,
            },
          },
        })),
      cacheProblem: (problemId, problem) =>
        set((state) => ({
          cachedProblems: {
            ...state.cachedProblems,
            [problemId]: problem,
          },
        })),
      cacheLanguages: (languages) => set({ cachedLanguages: languages }),
    }),
    {
      name: "nekodojo-problem-workspace",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state) => ({ codeByProblem: state.codeByProblem }),
    }
  )
);
