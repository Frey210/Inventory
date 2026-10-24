"use client";
import { useEffect } from "react";
export function EditorFocus({ identity }: { identity: string }) {
  useEffect(() => {
    const editor = document.getElementById("master-editor");
    editor?.focus({ preventScroll: true });
    editor?.scrollIntoView({ block: "start" });
  }, [identity]);
  return null;
}
