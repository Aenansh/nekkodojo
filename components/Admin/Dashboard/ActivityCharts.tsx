"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { SectionHeading } from "@/components/User/Profileornaments";

interface ChartDataPoint {
  day: string;
  users: number;
  scrolls: number;
}

const chartConfig = {
  users: {
    label: "New members",
    color: "#d4af37",
  },
  scrolls: {
    label: "New discussions",
    color: "#8d6e63",
  },
} satisfies ChartConfig;

const SERIES = ["users", "scrolls"] as const;

export function ActivityChart({ chartData }: { chartData: ChartDataPoint[] }) {
  const totals = useMemo(
    () => ({
      users: chartData.reduce((sum, d) => sum + d.users, 0),
      scrolls: chartData.reduce((sum, d) => sum + d.scrolls, 0),
    }),
    [chartData]
  );

  return (
    <section aria-labelledby="activity-heading">
      <SectionHeading id="activity-heading" title="Weekly activity" kanji="週間" />

      {/* The legend doubles as the 7-day totals */}
      <ul className="mt-6 flex flex-wrap gap-x-10 gap-y-3">
        {SERIES.map((key) => (
          <li key={key} className="flex items-baseline gap-3 text-sm text-[#a1887f]">
            <span
              aria-hidden
              className="size-2.5 translate-y-px rounded-[2px]"
              style={{ backgroundColor: chartConfig[key].color }}
            />
            {chartConfig[key].label}
            <span className="font-serif text-xl tabular-nums text-[#eaddcf]">{totals[key]}</span>
            <span className="text-xs text-[#8d6e63]">in 7 days</span>
          </li>
        ))}
      </ul>

      <ChartContainer config={chartConfig} className="mt-6 aspect-auto h-60 w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          barGap={3}
          barCategoryGap="30%"
          margin={{ top: 8, right: 0, left: 0, bottom: 0 }}
        >
          <CartesianGrid vertical={false} stroke="#3e2723" strokeOpacity={0.7} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={12}
            tick={{ fill: "#a1887f", fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tickCount={4}
            width={28}
            tick={{ fill: "#8d6e63", fontSize: 12 }}
          />
          <ChartTooltip
            cursor={{ fill: "#eaddcf", fillOpacity: 0.04 }}
            content={
              <ChartTooltipContent
                indicator="dot"
                className="border-[#3e2723] bg-[#1a110d] text-[#eaddcf] shadow-xl"
                labelClassName="font-serif text-[#eaddcf]"
              />
            }
          />
          <Bar dataKey="users" fill="var(--color-users)" radius={[2, 2, 0, 0]} maxBarSize={16} />
          <Bar
            dataKey="scrolls"
            fill="var(--color-scrolls)"
            radius={[2, 2, 0, 0]}
            maxBarSize={16}
          />
        </BarChart>
      </ChartContainer>
    </section>
  );
}
