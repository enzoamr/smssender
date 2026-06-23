"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-2 px-4 pt-3">
      <span className="text-xs text-muted-foreground tabular-nums">
        Page {page + 1} sur {pageCount}
      </span>
      <div className="flex gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPage(Math.max(0, page - 1))}
          disabled={page === 0}
        >
          <ChevronLeft />
          Précédent
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPage(Math.min(pageCount - 1, page + 1))}
          disabled={page >= pageCount - 1}
        >
          Suivant
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
