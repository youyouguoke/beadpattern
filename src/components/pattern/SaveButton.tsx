"use client";

import { useState, useEffect } from "react";

interface SaveButtonProps {
  patternSlug: string;
  variant?: "icon" | "default";
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

export default function SaveButton({ patternSlug, variant = "default" }: SaveButtonProps) {
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

  if (variant === "icon") {
    return (
      <button
        onClick={handleClick}
        className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
          saved
            ? "border-primary text-primary bg-primary/5"
            : "border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary"
        }`}
        title={saved ? "Saved" : "Save"}
      >
        <span className="material-symbols-outlined">{saved ? "favorite" : "favorite_border"}</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={"w-full py-3.5 rounded-full font-label-md font-bold flex items-center justify-center gap-2 transition-colors border " + (
        saved
          ? "bg-primary text-on-primary border-primary hover:bg-primary-container hover:text-on-primary-container hover:border-primary-container"
          : "bg-surface-container-low text-on-surface border-outline-variant hover:border-primary hover:text-primary"
      )}
    >
      <span className="material-symbols-outlined">{saved ? "favorite" : "favorite_border"}</span>
      {saved ? "Saved" : "Save"}
    </button>
  );
}
