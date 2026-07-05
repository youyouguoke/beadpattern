"use client";

import { useState, useEffect } from "react";

interface SaveButtonProps {
  patternSlug: string;
}

function getSaved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("beadpatternai:saved");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setSaved(slugs: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("beadpatternai:saved", JSON.stringify(slugs));
}

export default function SaveButton({ patternSlug }: SaveButtonProps) {
  const [saved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsSaved(getSaved().includes(patternSlug));
  }, [patternSlug]);

  const handleClick = () => {
    const current = getSaved();
    if (current.includes(patternSlug)) {
      setSaved(current.filter((s) => s !== patternSlug));
      setIsSaved(false);
    } else {
      setSaved([...current, patternSlug]);
      setIsSaved(true);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full py-3 rounded-xl font-label-sm flex items-center justify-center gap-2 transition-colors ${
        saved
          ? "bg-primary-container text-white hover:bg-error-container"
          : "bg-surface-container text-secondary hover:bg-secondary-container"
      }`}
    >
      <span className="material-symbols-outlined">{saved ? "favorite" : "favorite_border"}</span>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
