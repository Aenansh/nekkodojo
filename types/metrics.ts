export type Belt = "White" | "Yellow" | "Orange" | "Green" | "Blue" | "Purple" | "Brown" | "Black";

export interface DojoStats {
  problemsPracticedToday: number;
  activeNow: number;
  katasCompleted: number;
  hourly: number[];
}

export interface Sensei {
  name: string;
  belt: Belt;
  solved: number;
}

export interface MetricsResponse {
  stats: DojoStats;
  sensei: Sensei[];
}
