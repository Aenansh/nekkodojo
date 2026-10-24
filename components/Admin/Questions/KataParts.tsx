"use client";

import type { ReactNode } from "react";
import { Check, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Same three difficulty colours used on member profiles. */
export const DIFFICULTY_COLOR = {
  Easy: "#8fb573",
  Medium: "#d99a4e",
  Hard: "#c4574a",
} as const;

export const fieldClass =
  "rounded-md border-[#3e2723] bg-[#0f0b0a] text-[#eaddcf] placeholder:text-[#6d4c41] focus-visible:border-[#d4af37] focus-visible:ring-[#d4af37]/30";

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor} className="text-sm font-normal text-[#a1887f]">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-[#8d6e63]">{hint}</p>}
    </div>
  );
}

/** Pill-style radio group, used for difficulty and judge type. */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string; color?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = option.value === value;
        const color = option.color ?? "#d4af37";
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eaddcf]",
              selected
                ? "font-medium"
                : "border-[#3e2723] text-[#a1887f] hover:border-[#5d4037] hover:text-[#eaddcf]"
            )}
            style={
              selected ? { color, borderColor: color, backgroundColor: `${color}1a` } : undefined
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Row of chips for picking one item out of several, like the
 * "Case 1 / Case 2" strip on a problem page. The last chip adds a new one.
 */
export function ChipBar({
  items,
  active,
  onChange,
  addLabel,
}: {
  items: { id: string; label: string; badge?: ReactNode }[];
  active: string;
  onChange: (id: string) => void;
  addLabel: string;
}) {
  const chip =
    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#eaddcf]";

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-pressed={active === item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            chip,
            active === item.id
              ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]"
              : "border-[#3e2723] text-[#a1887f] hover:border-[#5d4037] hover:text-[#eaddcf]"
          )}
        >
          {item.label}
          {item.badge}
        </button>
      ))}
      <button
        type="button"
        aria-pressed={active === "new"}
        onClick={() => onChange("new")}
        className={cn(
          chip,
          "border-dashed",
          active === "new"
            ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]"
            : "border-[#5d4037] text-[#a1887f] hover:border-[#d4af37] hover:text-[#d4af37]"
        )}
      >
        <Plus className="size-3.5" aria-hidden />
        {addLabel}
      </button>
    </div>
  );
}

/** Editor-style frame: a title bar with a file name, then whatever goes inside. */
export function CodeFrame({
  title,
  filename,
  children,
}: {
  title: string;
  filename?: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-md border border-[#3e2723] bg-[#0c0807]">
      <div className="flex items-center justify-between border-b border-[#3e2723] bg-[#140d0a] px-3 py-2 text-xs">
        <span className="text-[#a1887f]">{title}</span>
        {filename && <span className="font-mono text-[#8d6e63]">{filename}</span>}
      </div>
      {children}
    </div>
  );
}

export const codeAreaClass =
  "w-full resize-y rounded-none border-0 bg-transparent font-mono text-sm leading-6 text-[#eaddcf] shadow-none placeholder:text-[#6d4c41] focus-visible:ring-0";

/** Multi-select list of categories, used by the create and edit dialogs. */
export function PrereqPicker({
  options,
  selected,
  onToggle,
}: {
  options: { id: string; name: string; slug: string }[];
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Prerequisites"
      className="max-h-44 overflow-y-auto rounded-md border border-[#3e2723] bg-[#0f0b0a] p-1.5"
    >
      {options.length === 0 ? (
        <p className="p-3 text-center text-sm text-[#8d6e63]">No other categories yet.</p>
      ) : (
        options.map((cat) => {
          const isSelected = selected.includes(cat.slug);
          return (
            <button
              key={cat.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(cat.slug)}
              className={cn(
                "flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm transition-colors",
                isSelected
                  ? "bg-[#d4af37]/10 text-[#d4af37]"
                  : "text-[#a1887f] hover:bg-[#1a110d] hover:text-[#eaddcf]"
              )}
            >
              <span>{cat.name}</span>
              {isSelected && <Check className="size-3.5" aria-hidden />}
            </button>
          );
        })
      )}
    </div>
  );
}
