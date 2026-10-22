"use client";

import { BarsDescendingAlignLeft } from "@gravity-ui/icons";

/** Compact "Sort by" dropdown for a list. `options` maps sort keys to labels. */
export default function SortSelect<K extends string>({
  value,
  onChange,
  options,
}: {
  value: K;
  onChange: (value: K) => void;
  options: Record<K, string>;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <BarsDescendingAlignLeft aria-hidden />
      <span className="sr-only">Sort by</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as K)}
        className="input w-auto py-1.5 text-sm"
      >
        {(Object.entries(options) as [K, string][]).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
