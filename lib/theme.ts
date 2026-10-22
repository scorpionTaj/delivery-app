// Per-device UI preferences (theme, sidebar). Stored in localStorage and
// mirrored onto <html> so CSS can react without waiting for React.

export type ThemePref = "light" | "dark" | "system";

const THEME_KEY = "theme";
const NAV_KEY = "nav";

/**
 * Runs before paint so the page never flashes the wrong theme or sidebar width.
 * Kept as a string because it executes before React loads.
 */
export const uiInitScript = `(function(){try{var r=document.documentElement;var p=localStorage.getItem("${THEME_KEY}")||"system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);r.classList.toggle("dark",d);r.dataset.theme=d?"dark":"light";if(localStorage.getItem("${NAV_KEY}")==="collapsed")r.dataset.nav="collapsed";}catch(e){}})();`;

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export function getThemePref(): ThemePref {
  return (read(THEME_KEY) as ThemePref) || "system";
}

export function applyTheme(pref: ThemePref) {
  write(THEME_KEY, pref);
  const dark = pref === "dark" || (pref === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.dataset.theme = dark ? "dark" : "light";
}

export function isNavCollapsed() {
  return read(NAV_KEY) === "collapsed";
}

export function setNavCollapsed(collapsed: boolean) {
  write(NAV_KEY, collapsed ? "collapsed" : "expanded");
  if (collapsed) document.documentElement.dataset.nav = "collapsed";
  else delete document.documentElement.dataset.nav;
}
