"use client";

import type { UrgencyLevel, WishlistItemEnriched } from "@/types/index";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

const URGENCY_BORDER: Record<UrgencyLevel, string> = {
  overdue: "border-l-red-500",
  urgent: "border-l-amber-500",
  upcoming: "border-l-blue-500",
  watching: "border-l-zinc-300",
  no_dates: "border-l-zinc-200",
};

const URGENCY_LABEL: Record<
  UrgencyLevel,
  { text: string; className: string } | null
> = {
  overdue: { text: "Book now — overdue", className: "text-red-600 font-semibold" },
  urgent: { text: "Book this week", className: "text-amber-600 font-semibold" },
  upcoming: { text: "Book this month", className: "text-blue-600" },
  watching: null,
  no_dates: null,
};

const CUISINE_COLORS: Record<string, string> = {
  "Omakase Sushi": "bg-rose-100 text-rose-700",
  Kaiseki: "bg-amber-100 text-amber-700",
  Tempura: "bg-orange-100 text-orange-700",
  "Soba/Kappo": "bg-stone-100 text-stone-700",
  Teppanyaki: "bg-red-100 text-red-700",
  Yakiniku: "bg-yellow-100 text-yellow-700",
  Other: "bg-zinc-100 text-zinc-600",
};

function formatDate(dateStr: string) {
  // desired_date is a date-only string (YYYY-MM-DD); parse as local
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatReminderDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPrice(min: number | null, max: number | null) {
  if (min == null && max == null) return null;
  if (min != null && max != null && min !== max)
    return `¥${min.toLocaleString()} – ¥${max.toLocaleString()}`;
  if (min != null) return `¥${min.toLocaleString()}`;
  return `¥${max!.toLocaleString()}`;
}

interface Props {
  item: WishlistItemEnriched;
  onClick: () => void;
}

export function WishlistCard({ item, onClick }: Props) {
  const {
    restaurant,
    travel_date_count,
    urgency,
    next_travel_date,
    next_reminder_date,
    next_party_size,
    top_platform,
  } = item;

  const priceStr = formatPrice(
    restaurant.price_range_min,
    restaurant.price_range_max
  );
  const urgencyLabel = URGENCY_LABEL[urgency];

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border border-l-4 bg-white p-4 text-left shadow-sm transition hover:shadow-md dark:bg-zinc-900",
        URGENCY_BORDER[urgency]
      )}
    >
      {/* Name + cuisine */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-tight">
          {restaurant.name}
        </h3>
        {restaurant.cuisine && (
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
              CUISINE_COLORS[restaurant.cuisine] ?? CUISINE_COLORS["Other"]
            )}
          >
            {restaurant.cuisine}
          </span>
        )}
      </div>

      {/* Price */}
      {priceStr && (
        <p className="mt-1 text-sm text-muted-foreground">{priceStr}</p>
      )}

      {/* Next travel date */}
      {next_travel_date && (
        <p className="mt-2 text-sm">
          {formatDate(next_travel_date)}
          {next_party_size != null && (
            <span className="ml-2 text-muted-foreground">
              · {next_party_size} guest{next_party_size !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      )}

      {/* Urgency label + reminder date */}
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {urgencyLabel && (
          <span className={cn("text-xs", urgencyLabel.className)}>
            {urgencyLabel.text}
          </span>
        )}
        {next_reminder_date && (
          <span className="text-xs text-muted-foreground">
            Reminder: {formatReminderDate(next_reminder_date)}
          </span>
        )}
        {!next_travel_date && !next_reminder_date && (
          <span className="text-xs italic text-muted-foreground">
            No travel dates set
          </span>
        )}
      </div>

      {/* Platform + date count */}
      <div className="mt-3 flex items-center justify-between gap-2">
        {top_platform ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {top_platform.website}
            {top_platform.url && <ExternalLink className="h-3 w-3" />}
          </span>
        ) : (
          <span />
        )}
        {travel_date_count > 0 && (
          <span className="text-xs text-muted-foreground">
            {travel_date_count} date{travel_date_count !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </button>
  );
}
