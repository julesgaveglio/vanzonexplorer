"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/club/utils";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  size?: "default" | "large";
}

export default function SearchBar({
  onSearch,
  placeholder = "Rechercher un produit, une marque...",
  size = "default",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { onSearch?.(query); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery("");
    onSearch?.("");
  };

  return (
    <div className="relative">
      <Search className={cn("absolute left-4 top-1/2 -translate-y-1/2 text-muted", size === "large" ? "h-5 w-5" : "h-4 w-4")} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-full border border-border bg-white pl-12 pr-10 outline-none transition focus:border-rust focus:ring-2 focus:ring-rust/20",
          size === "large" ? "px-6 py-4 pl-14 text-lg" : "px-5 py-3 pl-12"
        )}
      />
      {query.length > 0 && (
        <button onClick={handleClear} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-earth">
          <X className={size === "large" ? "h-5 w-5" : "h-4 w-4"} />
        </button>
      )}
    </div>
  );
}
