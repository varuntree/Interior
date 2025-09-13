"use client";

import { useMemo, useRef, useState } from "react";

export type Mode = "redesign" | "staging" | "compose" | "imagine";

export const MODES: { id: Mode; label: string; hint?: string }[] = [
  { id: "redesign", label: "Redesign", hint: "Restyle a room" },
  { id: "staging", label: "Staging", hint: "Furnish an empty room" },
  { id: "compose", label: "Compose", hint: "Blend with a reference" },
  { id: "imagine", label: "Imagine", hint: "Text-only concept" },
];

export const ROOM_TYPES = [
  "Living Room",
  "Bedroom",
  "Kitchen",
  "Dining",
  "Bathroom",
  "Home Office",
  "Alfresco / Patio",
] as const;

export const STYLES = [
  "Coastal AU",
  "Modern",
  "Minimal",
  "Scandinavian",
  "Mid-Century",
  "Industrial",
  "Hamptons AU",
] as const;

export function useTempForm(initial?: {
  mode?: Mode;
  roomType?: (typeof ROOM_TYPES)[number];
  style?: (typeof STYLES)[number];
  prompt?: string;
}) {
  const [mode, setMode] = useState<Mode>(initial?.mode ?? "redesign");
  const [roomType, setRoomType] = useState<(typeof ROOM_TYPES)[number]>(
    initial?.roomType ?? "Living Room",
  );
  const [style, setStyle] = useState<(typeof STYLES)[number]>(
    initial?.style ?? "Coastal AU",
  );
  const [prompt, setPrompt] = useState(initial?.prompt ?? "");
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const file1Ref = useRef<HTMLInputElement>(null);
  const file2Ref = useRef<HTMLInputElement>(null);

  const needsFile1 = mode === "redesign" || mode === "staging" || mode === "compose";
  const needsFile2 = mode === "compose";
  const needsPrompt = mode === "imagine";

  const canGenerate = useMemo(() => {
    if (needsFile1 && !file1) return false;
    if (needsFile2 && !file2) return false;
    if (needsPrompt && !prompt.trim()) return false;
    return true;
  }, [needsFile1, needsFile2, needsPrompt, file1, file2, prompt]);

  function onGenerate() {
    // eslint-disable-next-line no-console
    console.log("Generate", { mode, roomType, style, prompt, file1, file2 });
  }

  return {
    mode,
    setMode,
    roomType,
    setRoomType,
    style,
    setStyle,
    prompt,
    setPrompt,
    file1,
    setFile1,
    file2,
    setFile2,
    file1Ref,
    file2Ref,
    needsFile1,
    needsFile2,
    needsPrompt,
    canGenerate,
    onGenerate,
  } as const;
}

