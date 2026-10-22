"use client";

import { Display, Moon, Sun } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useSyncExternalStore } from "react";
import { type ThemePref, applyTheme, getThemePref } from "@/lib/theme";

const OPTIONS: { value: ThemePref; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Display },
];

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function setPref(pref: ThemePref) {
  applyTheme(pref);
  listeners.forEach((l) => l());
}

export function useThemePref() {
  return useSyncExternalStore(subscribe, getThemePref, () => "system" as ThemePref);
}

/** Segmented light / dark / system picker. `compact` shows icons only. */
export default function ThemeSwitch({ compact = false }: { compact?: boolean }) {
  const pref = useThemePref();
  return (
    <div role="group" aria-label="Theme" className="inline-flex gap-1 rounded-full bg-default p-1">
      {OPTIONS.map(({ value, label, Icon }) => (
        <Button
          key={value}
          aria-pressed={pref === value}
          aria-label={label}
          size="sm"
          isIconOnly={compact}
          variant={pref === value ? "primary" : "ghost"}
          className="rounded-full"
          onPress={() => setPref(value)}
        >
          <Icon />
          {!compact && label}
        </Button>
      ))}
    </div>
  );
}
