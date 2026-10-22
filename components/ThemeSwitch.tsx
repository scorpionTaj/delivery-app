"use client";

import { Display, Moon, Sun } from "@gravity-ui/icons";
import { Button } from "@heroui/react";
import { useEffect, useSyncExternalStore } from "react";
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

/** Light / dark / system picker (icons only). `vertical` stacks it for the collapsed sidebar. */
export default function ThemeSwitch({ className = "" }: { className?: string }) {
  const pref = useSyncExternalStore(subscribe, getThemePref, () => "system" as ThemePref);

  // In "system" mode, follow the OS when it switches between light and dark.
  useEffect(() => {
    if (pref !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [pref]);

  return (
    <div role="group" aria-label="Theme" className={`inline-flex gap-1 rounded-full bg-default p-1 ${className}`}>
      {OPTIONS.map(({ value, label, Icon }) => (
        <Button
          key={value}
          aria-pressed={pref === value}
          aria-label={`${label} theme`}
          size="sm"
          isIconOnly
          variant={pref === value ? "primary" : "ghost"}
          className="rounded-full"
          onPress={() => setPref(value)}
        >
          <Icon />
        </Button>
      ))}
    </div>
  );
}
