"use client";

import type { WishlistItemEnriched } from "@/types/index";
import { cn } from "@/lib/utils";

const CUISINE_COLORS: Record<string, string> = {
  "Omakase Sushi": "bg-rose-100 text-rose-700",
  Kaiseki: "bg-amber-100 text-amber-700",
  Tempura: "bg-orange-100 text-orange-700",
  "Soba/Kappo": "bg-stone-100 text-stone-700",
  Teppanyaki: "bg-red-100 text-red-700",
  Yakiniku: "bg-yellow-100 text-yellow-700",
  Other: "bg-zinc-100 text-zinc-600",
};

function getReminderBadge(nextReminder: string | null) {
  if (!nextReminder) return null;
  const reminderMs = new Date(nextReminder).getTime();
  const nowMs = Date.now();
  const daysUntil = Math.floor((reminderMs - nowMs) / (1000 * 60 * 60 * 24));

  if (daysUntil <= 0) {
    return { label: "Book now", className: "bg-red-100 text-red-700 font-semibold" };
  }
  if (daysUntil <= 7) {
    return {
      label: `Book in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`,
      className: "bg-amber-100 text-amber-700 font-semibold",
    };
  }
  const d = new Date(nextReminder);
  const formatted = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return {
    label: `Book on ${formatted}`,
    className: "bg-zinc-100 text-zinc-500",
  };
}

interface Props {
  item: WishlistItemEnriched;
  onClick: () => void;
}

export function WishlistCard({ item, onClick }: Props) {
  const { restaurant, travel_date_count, next_reminder } = item;
  const badge = getReminderBadge(next_reminder);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:shadow-md dark:bg-zinc-900"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold leading-tight">{restaurant.name}</h3>
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

      {(restaurant.price_range_min != null ||
        restaurant.price_range_max != null) && (
        <p className="mt-1 text-sm text-muted-foreground">
          {restaurant.price_range_min != null
            ? `¥${restaurant.price_range_min.toLocaleString()}`
            : ""}
          {restaurant.price_range_max != null &&
          restaurant.price_range_max !== restaurant.price_range_min
            ? ` – ¥${restaurant.price_range_max.toLocaleString()}`
            : ""}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {badge ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs",
              badge.className
            )}
          >
            {badge.label}
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-400">
            Set travel dates
          </span>
        )}

        {travel_date_count > 0 && (
          <span className="text-xs text-muted-foreground">
            {travel_date_count} date{travel_date_count !== 1 ? "s" : ""} saved
          </span>
        )}
      </div>
    </button>
  );
}
