import { useDocsSidebar } from "@docusaurus/plugin-content-docs/client";
import { useEffect, useMemo, useState } from "react";

/* ── Types ── */

export interface ChapterInfo {
  docId: string;
  label: string;
  href: string;
}

interface ChapterProgressResult {
  chapters: ChapterInfo[];
  currentIndex: number;
  visitedIds: Set<string>;
}

/* ── Sidebar extraction ── */

function extractDirectLinks(items: any[]): ChapterInfo[] {
  const links: ChapterInfo[] = [];
  for (const item of items) {
    if (item.type === "link" && item.docId) {
      links.push({ docId: item.docId, label: item.label, href: item.href });
    }
  }
  return links;
}

/**
 * Walk the sidebar tree depth-first and return the **most specific** (deepest)
 * category whose direct link children contain `docId`.
 */
function findCategoryChapters(
  sidebar: any,
  docId: string,
): ChapterInfo[] | null {
  if (!sidebar?.items) return null;

  function search(items: any[]): ChapterInfo[] | null {
    for (const item of items) {
      if (item.type === "category" && item.items) {
        // Depth-first: check sub-categories before this one
        const deeper = search(item.items);
        if (deeper) return deeper;

        // Check direct links of this category
        const links = extractDirectLinks(item.items);
        if (links.some((l) => l.docId === docId)) return links;
      }
    }
    return null;
  }

  return search(sidebar.items);
}

/* ── Hook ── */

export function useChapterProgress(
  storageKey: string,
  currentDocId: string,
): ChapterProgressResult {
  const sidebar = useDocsSidebar();
  const chapters = useMemo(
    () => findCategoryChapters(sidebar, currentDocId) ?? [],
    [sidebar, currentDocId],
  );
  const currentIndex = useMemo(
    () => chapters.findIndex((c) => c.docId === currentDocId),
    [chapters, currentDocId],
  );

  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const stored: string[] = raw ? JSON.parse(raw) : [];
      const set = new Set(stored);
      set.add(currentDocId);
      localStorage.setItem(storageKey, JSON.stringify([...set]));
      setVisitedIds(set);
    } catch {
      setVisitedIds(new Set([currentDocId]));
    }
  }, [storageKey, currentDocId]);

  return { chapters, currentIndex, visitedIds };
}
