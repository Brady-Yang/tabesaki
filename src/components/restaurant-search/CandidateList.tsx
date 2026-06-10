"use client";

import { Badge } from "@/components/ui/badge";
import { MapPin, Star } from "lucide-react";
import type { PlaceCandidate } from "@/types/database";

interface CandidateListProps {
  candidates: PlaceCandidate[];
  onSelect: (candidate: PlaceCandidate) => void;
  isLoading?: boolean;
}

export function CandidateList({
  candidates,
  onSelect,
  isLoading,
}: CandidateListProps) {
  if (isLoading) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Searching…
      </p>
    );
  }

  if (candidates.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No results found.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {candidates.map((c) => (
        <button
          key={c.placeId}
          onClick={() => onSelect(c)}
          className="flex flex-col gap-1 rounded-lg border p-3 text-left transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{c.name}</span>
            {c.isPermanentlyClosed && (
              <Badge variant="destructive" className="text-xs">
                Permanently closed
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{c.address}</span>
          </div>
          {c.rating !== undefined && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{c.rating.toFixed(1)}</span>
              {c.ratingCount !== undefined && (
                <span>({c.ratingCount.toLocaleString()})</span>
              )}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
