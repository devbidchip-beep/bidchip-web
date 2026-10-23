'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { searchParts } from '@/lib/api';
import type { PartSearchResult } from '@/types/api';
import { cn } from '@/lib/utils';

interface PartSearchInputProps {
  onSelect: (part: PartSearchResult) => void;
  placeholder?: string;
}

function LifecycleBadge({ lifecycle }: { lifecycle: PartSearchResult['lifecycle'] }) {
  if (!lifecycle) return null;
  const colors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    nrnd: 'bg-yellow-100 text-yellow-800',
    eol: 'bg-red-100 text-red-800',
    obsolete: 'bg-red-100 text-red-800',
  };
  return (
    <span
      className={cn(
        'ml-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium uppercase',
        colors[lifecycle] ?? 'bg-gray-100 text-gray-700',
      )}
    >
      {lifecycle}
    </span>
  );
}

export function PartSearchInput({ onSelect, placeholder = 'Search by MPN…' }: PartSearchInputProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PartSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchResults = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await searchParts(q);
      setResults(res.data);
      setOpen(true);
      setActiveIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchResults(query), 300);
    return () => clearTimeout(timer);
  }, [query, fetchResults]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (part: PartSearchResult) => {
    onSelect(part);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-md border border-input bg-background px-3 py-2 pr-9 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
        />
        {loading && (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <svg
              className="h-4 w-4 animate-spin text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
          </div>
        )}
      </div>

      {open && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border bg-popover shadow-md"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No results found.</li>
          ) : (
            results.map((part, i) => (
              <li
                key={part.id}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={() => handleSelect(part)}
                onMouseEnter={() => setActiveIndex(i)}
                className={cn(
                  'cursor-pointer px-3 py-2 text-sm',
                  i === activeIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
                )}
              >
                <div className="flex items-center">
                  <span className="font-semibold">{part.mpn}</span>
                  <LifecycleBadge lifecycle={part.lifecycle} />
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {part.manufacturer_name}
                  {part.description ? ` · ${part.description}` : ''}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
