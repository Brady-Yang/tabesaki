"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Filter, X } from "lucide-react";
import type { WishlistFilters } from "@/types/index";

const STATUS_OPTIONS = [
  "Watching",
  "Booking Soon",
  "Booked",
  "Visited",
  "Missed",
] as const;

const SORT_OPTIONS: {
  value: NonNullable<WishlistFilters["sort"]>;
  label: string;
}[] = [
  { value: "reminder_date", label: "Next Reminder" },
  { value: "name", label: "Name" },
  { value: "cuisine", label: "Cuisine" },
  { value: "price", label: "Price" },
  { value: "status", label: "Status" },
];

const MAX_PRICE = 100_000;

interface Props {
  filters: WishlistFilters;
  onChange: (filters: WishlistFilters) => void;
}

export function WishlistToolbar({ filters, onChange }: Props) {
  const [localSearch, setLocalSearch] = useState(filters.search ?? "");
  const [localCuisine, setLocalCuisine] = useState(
    filters.filter_cuisine ?? ""
  );
  const [localPrice, setLocalPrice] = useState(
    filters.filter_price_max ?? MAX_PRICE
  );
  const [showFilters, setShowFilters] = useState(false);

  const filtersRef = useRef(filters);
  const onChangeRef = useRef(onChange);
  filtersRef.current = filters;
  onChangeRef.current = onChange;

  const searchMountedRef = useRef(false);
  const cuisineMountedRef = useRef(false);

  useEffect(() => {
    if (!searchMountedRef.current) {
      searchMountedRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      onChangeRef.current({
        ...filtersRef.current,
        search: localSearch || undefined,
      });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  useEffect(() => {
    if (!cuisineMountedRef.current) {
      cuisineMountedRef.current = true;
      return;
    }
    const timer = setTimeout(() => {
      onChangeRef.current({
        ...filtersRef.current,
        filter_cuisine: localCuisine || undefined,
      });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localCuisine]);

  function toggleStatus(status: string) {
    const current = filters.filter_status
      ? filters.filter_status.split(",")
      : [];
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    onChange({
      ...filters,
      filter_status: next.length ? next.join(",") : undefined,
    });
  }

  function handlePriceCommit([v]: number[]) {
    setLocalPrice(v);
    onChange({
      ...filtersRef.current,
      filter_price_max: v < MAX_PRICE ? v : undefined,
    });
  }

  function toggleOrder() {
    onChange({
      ...filters,
      order: filters.order === "desc" ? "asc" : "desc",
    });
  }

  function clearFilters() {
    setLocalSearch("");
    setLocalCuisine("");
    setLocalPrice(MAX_PRICE);
    onChange({
      sort: filtersRef.current.sort,
      order: filtersRef.current.order,
    });
  }

  const selectedStatuses = filters.filter_status
    ? filters.filter_status.split(",")
    : [];

  // Count of non-search active filters (what lives in the panel)
  const panelFilterCount = [
    !!filters.filter_status,
    !!filters.filter_cuisine,
    filters.filter_price_max != null,
  ].filter(Boolean).length;

  // Total active filters including search, used for desktop "Clear" button
  const totalActiveFilters = panelFilterCount + (filters.search ? 1 : 0);

  // Shared status checkbox rows — used by both desktop and mobile popovers
  function StatusList() {
    return (
      <>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => toggleStatus(s)}
            className="flex w-full min-h-[44px] items-center gap-2 rounded px-3 text-sm hover:bg-accent"
          >
            <span
              className={cn(
                "flex h-4 w-4 shrink-0 items-center justify-center rounded border",
                selectedStatuses.includes(s)
                  ? "border-primary bg-primary"
                  : "border-input"
              )}
            >
              {selectedStatuses.includes(s) && (
                <svg
                  className="h-3 w-3 text-primary-foreground"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            {s}
          </button>
        ))}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* ── Top row ─────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {/* Search: always visible */}
        <Input
          placeholder="Search restaurants…"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="h-11 flex-1 sm:h-9"
        />

        {/* Sort + order: desktop only in top row */}
        <Select
          value={filters.sort ?? "reminder_date"}
          onValueChange={(v) =>
            onChange({ ...filters, sort: v as WishlistFilters["sort"] })
          }
        >
          <SelectTrigger className="hidden h-9 w-40 sm:flex">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="icon"
          className="hidden h-9 w-9 sm:flex"
          onClick={toggleOrder}
          title={filters.order === "desc" ? "Descending" : "Ascending"}
        >
          {filters.order === "desc" ? (
            <ArrowDown className="h-4 w-4" />
          ) : (
            <ArrowUp className="h-4 w-4" />
          )}
        </Button>

        {/* Mobile: filter toggle button */}
        <Button
          variant="outline"
          className="h-11 gap-1.5 px-3 sm:hidden"
          onClick={() => setShowFilters((p) => !p)}
          aria-expanded={showFilters}
        >
          <Filter className="h-4 w-4" />
          <span className="text-sm">Filters</span>
          {panelFilterCount > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {panelFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* ── Desktop filter row ──────────────────────────────────── */}
      <div className="hidden sm:flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              Status
              {selectedStatuses.length > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                  {selectedStatuses.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1.5" align="start">
            <StatusList />
          </PopoverContent>
        </Popover>

        <Input
          placeholder="Cuisine"
          value={localCuisine}
          onChange={(e) => setLocalCuisine(e.target.value)}
          className="h-8 w-28 text-sm"
        />

        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            Max
          </span>
          <div className="w-28">
            <Slider
              min={0}
              max={MAX_PRICE}
              step={5_000}
              value={[localPrice]}
              onValueChange={([v]) => setLocalPrice(v)}
              onValueCommit={handlePriceCommit}
            />
          </div>
          <span className="w-16 text-xs text-muted-foreground">
            {localPrice < MAX_PRICE ? `¥${localPrice.toLocaleString()}` : "Any"}
          </span>
        </div>

        {totalActiveFilters > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8"
            onClick={clearFilters}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* ── Mobile filter panel ─────────────────────────────────── */}
      {showFilters && (
        <div className="sm:hidden flex flex-col gap-3 rounded-xl border bg-background p-3 dark:border-zinc-800">
          {/* Sort + order */}
          <div className="flex gap-2">
            <Select
              value={filters.sort ?? "reminder_date"}
              onValueChange={(v) =>
                onChange({ ...filters, sort: v as WishlistFilters["sort"] })
              }
            >
              <SelectTrigger className="h-11 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              className="h-11 w-11 shrink-0 p-0"
              onClick={toggleOrder}
              title={filters.order === "desc" ? "Descending" : "Ascending"}
            >
              {filters.order === "desc" ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Status */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-11 w-full justify-between"
              >
                <span>
                  Status
                  {selectedStatuses.length > 0 &&
                    ` (${selectedStatuses.length})`}
                </span>
                <span className="text-muted-foreground">▾</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-2rem)] max-w-sm p-1.5"
              align="start"
            >
              <StatusList />
            </PopoverContent>
          </Popover>

          {/* Cuisine */}
          <Input
            placeholder="Filter by cuisine…"
            value={localCuisine}
            onChange={(e) => setLocalCuisine(e.target.value)}
            className="h-11"
          />

          {/* Price slider */}
          <div>
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Max price</span>
              <span className="font-medium text-foreground">
                {localPrice < MAX_PRICE
                  ? `¥${localPrice.toLocaleString()}`
                  : "Any"}
              </span>
            </div>
            {/* Extra vertical padding gives a larger touch zone around the thumb */}
            <div className="py-2">
              <Slider
                min={0}
                max={MAX_PRICE}
                step={5_000}
                value={[localPrice]}
                onValueChange={([v]) => setLocalPrice(v)}
                onValueCommit={handlePriceCommit}
              />
            </div>
          </div>

          {/* Clear */}
          {totalActiveFilters > 0 && (
            <Button
              variant="ghost"
              className="h-11 w-full"
              onClick={clearFilters}
            >
              <X className="mr-1.5 h-4 w-4" />
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
