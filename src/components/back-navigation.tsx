"use client";

import { useEffect, useSyncExternalStore, useTransition } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { NavigationLink } from "./navigation";

let session = "";
let index = -1;
let replacement: string | null = null;
const changed = "mtc-navigation-changed";
function subscribe(listener: () => void) {
  window.addEventListener(changed, listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener(changed, listener);
    window.removeEventListener("popstate", listener);
  };
}
function canGoBack() {
  const entry = window.history.state?.mtcNavigation;
  return !!session && entry?.session === session && entry.index > 0;
}

// Only entries observed in this app session qualify; history.length can include other sites.
export function NavigationHistory() {
  const pathname = usePathname();
  const query = useSearchParams().toString();
  useEffect(() => {
    const restore = () => {
      const entry = window.history.state?.mtcNavigation;
      index = entry?.session === session ? entry.index : -1;
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    if (
      !/^\/(admin|me)(\/|$)/.test(pathname) &&
      !["/profile", "/notifications"].includes(pathname)
    )
      return;
    session ||= crypto.randomUUID();
    const href = window.location.href;
    const entry = window.history.state?.mtcNavigation;
    index =
      entry?.session === session && entry.href === href
        ? entry.index
        : href === replacement
          ? 0
          : index + 1;
    replacement = null;
    window.history.replaceState(
      { ...window.history.state, mtcNavigation: { session, index, href } },
      "",
      href,
    );
    window.dispatchEvent(new Event(changed));
  }, [pathname, query]);
  return null;
}

export function PageBack({
  fallback,
  compact = false,
}: {
  fallback: string | null;
  compact?: boolean;
}) {
  const knownEntry = useSyncExternalStore(subscribe, canGoBack, () => false);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (!fallback) return null;
  return (
    <NavigationLink
      href={fallback}
      replace={!knownEntry}
      className="button secondary page-back no-print"
      aria-label="Kembali"
      aria-disabled={pending}
      aria-busy={pending}
      onClick={(event) => {
        if (pending) {
          event.preventDefault();
          return;
        }
        if (
          knownEntry &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          event.preventDefault();
          startTransition(() => router.back());
        } else if (
          !knownEntry &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          !event.altKey
        ) {
          replacement = new URL(fallback, window.location.href).href;
        }
      }}
    >
      {pending ? (
        <LoaderCircle className="loading-spinner" size={18} aria-hidden />
      ) : (
        <ArrowLeft size={18} aria-hidden />
      )}
      <span className={compact ? "sr-only" : undefined}>
        {pending ? "Membuka…" : "Kembali"}
      </span>
    </NavigationLink>
  );
}
