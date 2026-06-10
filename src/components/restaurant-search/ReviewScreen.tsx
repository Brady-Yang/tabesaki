"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { PlatformEditor } from "./PlatformEditor";
import type {
  CuisineType,
  ExtractionResult,
  ExtractedPlatform,
  PlaceDetails,
  PlatformType,
} from "@/types/database";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function emptyPlatform(priority: number): ExtractedPlatform {
  return { website: "Other" as PlatformType, priority, ai_extracted: false };
}

interface ReviewScreenProps {
  details: PlaceDetails;
  cuisine: CuisineType | "";
  extraction: ExtractionResult;
  onSave: (platforms: ExtractedPlatform[]) => void;
  isSaving: boolean;
}

export function ReviewScreen({
  details,
  cuisine,
  extraction,
  onSave,
  isSaving,
}: ReviewScreenProps) {
  const [platforms, setPlatforms] = useState<ExtractedPlatform[]>(
    extraction.platforms
  );

  function handleChange(index: number, updated: ExtractedPlatform) {
    setPlatforms((prev) => prev.map((p, i) => (i === index ? updated : p)));
  }

  function handleRemove(index: number) {
    setPlatforms((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, priority: i + 1 }))
    );
  }

  function handleAdd() {
    setPlatforms((prev) => [...prev, emptyPlatform(prev.length + 1)]);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Restaurant info — read-only */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Restaurant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1.5 text-sm">
          <p className="font-semibold">{details.name}</p>
          <p className="text-muted-foreground">{details.address}</p>
          {cuisine && (
            <Badge variant="secondary" className="w-fit">
              {cuisine}
            </Badge>
          )}
          {extraction.closed_days_of_week === null && (
            <p className="mt-1 text-xs text-amber-600">
              ⚠ Closure days unknown — verify before selecting dates
            </p>
          )}
          {extraction.closed_days_of_week &&
            extraction.closed_days_of_week.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Closed:{" "}
                {extraction.closed_days_of_week
                  .map((d) => DAY_NAMES[d])
                  .join(", ")}
              </p>
            )}
          {extraction.price_range_min !== undefined && (
            <p className="text-xs text-muted-foreground">
              ¥{extraction.price_range_min.toLocaleString()}
              {extraction.price_range_max !== undefined
                ? ` – ¥${extraction.price_range_max.toLocaleString()}`
                : "+"}
              {extraction.price_notes && ` · ${extraction.price_notes}`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Platforms — editable */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Reservation platforms</h3>
          {platforms.length === 0 && (
            <span className="text-xs text-muted-foreground">
              None found — add manually
            </span>
          )}
        </div>

        {platforms.map((p, i) => (
          <PlatformEditor
            key={i}
            platform={p}
            index={i}
            onChange={handleChange}
            onRemove={handleRemove}
          />
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Add platform
        </Button>
      </div>

      <Button
        onClick={() => onSave(platforms)}
        disabled={isSaving}
        className="w-full"
      >
        {isSaving ? "Saving…" : "Save restaurant"}
      </Button>
    </div>
  );
}
