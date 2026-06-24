import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../../lib/api";
import { SearchResult } from "../../types";
import { FileTypeIcon } from "../../lib/fileIcons";

interface SearchBarProps {
  onSelectResult: (path: string) => void;
}

export interface SearchBarHandle {
  focus: () => void;
}

const SearchBar = forwardRef<SearchBarHandle, SearchBarProps>(({ onSelectResult }, ref) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setSearchError("");
      try {
        const found = await api.search(trimmed);
        setResults(found);
        setOpen(true);
      } catch (e) {
        setSearchError("Search failed — is the local server running?");
        setOpen(true);
      }
      setLoading(false);
    }, 300);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (result: SearchResult) => {
    onSelectResult(result.path);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className="relative w-80">
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Search notes... (Ctrl+K)"
        className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-md outline-none focus:border-indigo-400"
      />
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-96 overflow-y-auto z-50">
          {loading && <p className="px-3 py-2 text-xs text-slate-400">Searching...</p>}
          {!loading && searchError && (
            <p className="px-3 py-2 text-xs text-red-500">{searchError}</p>
          )}
          {!loading && !searchError && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-slate-400">No matches found.</p>
          )}
          {!loading &&
            !searchError &&
            results.map((result) => (
              <div
                key={result.path}
                onClick={() => handleSelect(result)}
                className="px-3 py-2 hover:bg-slate-100 cursor-pointer border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center gap-2 text-sm">
                  <FileTypeIcon fileName={result.name} size={14} />
                  <span className="font-medium text-slate-800 truncate">{result.name}</span>
                  <span className="text-xs text-slate-400">in {result.projectName}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{result.snippet}</p>
              </div>
            ))}
        </div>
      )}
    </div>
  );
});

export default SearchBar;
