"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const STORAGE_KEY = "bpai_search_history";

const SUGGESTIONS = [
  "cat perler bead pattern",
  "kawaii perler bead",
  "easy frog pattern",
  "halloween ghost",
  "christmas tree",
  "pokemon pixel art",
  "flower pattern",
  "food perler beads",
  "animal patterns",
  "anime perler bead",
];

interface SearchSuggestionsProps {
  query: string;
  onSelect: (q: string) => void;
}

export default function SearchSuggestions({ query, onSelect }: SearchSuggestionsProps) {
  const searchParams = useSearchParams();
  const currentQ = searchParams?.get("q") || "";
  const [history, setHistory] = useState<string[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (currentQ && !history.includes(currentQ)) {
      const next = [currentQ, ...history].slice(0, 8);
      setHistory(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
    }
  }, [currentQ]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const combined = [...new Set([...history, ...SUGGESTIONS])];
    return combined.filter((item) => item.toLowerCase().includes(q) && item.toLowerCase() !== q).slice(0, 6);
  }, [query, history]);

  if (!query.trim() || filtered.length === 0 || !show) return null;

  return (
    <div
      className="absolute z-10 mt-2 w-full max-w-xl bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-lg overflow-hidden"
      onMouseDown={(e) => e.preventDefault()}
    >
      {filtered.map((item) => (
        <button
          key={item}
          type="button"
          className="w-full text-left px-4 py-3 hover:bg-surface-container flex items-center gap-3 text-body-md text-on-surface"
          onClick={() => {
            onSelect(item);
            setShow(false);
          }}
        >
          <span className="material-symbols-outlined text-on-surface-variant">
            {history.includes(item) ? "history" : "search"}
          </span>
          {item}
        </button>
      ))}
    </div>
  );
}
