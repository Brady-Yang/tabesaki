"use client";

import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import type { WishlistItemEnriched } from "@/types/index";

interface Props {
  items: WishlistItemEnriched[];
}

export function UrgencyBanner({ items }: Props) {
  const urgentItems = items.filter(
    (i) => i.urgency === "overdue" || i.urgency === "urgent"
  );

  const dismissKey = urgentItems
    .map((i) => i.restaurant_id)
    .sort()
    .join(",");

  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (!dismissKey) return;
    const stored = localStorage.getItem("urgency_banner_dismissed");
    setDismissed(stored === dismissKey);
  }, [dismissKey]);

  function dismiss() {
    localStorage.setItem("urgency_banner_dismissed", dismissKey);
    setDismissed(true);
  }

  if (urgentItems.length === 0 || dismissed || !dismissKey) return null;

  return (
    <div className="relative rounded-xl border border-amber-200 bg-amber-50 px-4 pb-3 pt-3 dark:border-amber-800 dark:bg-amber-950/20">
      {/* Dismiss button — 44×44px touch target */}
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-0 top-0 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-amber-600 hover:text-amber-800 dark:text-amber-400"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="pr-10 text-sm font-medium text-amber-800 dark:text-amber-200">
        {urgentItems.length === 1
          ? "1 restaurant to book this week"
          : `${urgentItems.length} restaurants to book this week`}
        {urgentItems.some((i) => i.urgency === "overdue") && " (some overdue)"}
      </p>

      {/* Scrollable list — capped at ~4 items before scrolling */}
      <ul className="mt-2 max-h-36 overflow-y-auto flex flex-col gap-0.5">
        {urgentItems.map((item) => (
          <li
            key={item.id}
            className="flex min-h-[36px] items-center gap-2 text-sm"
          >
            <span
              className={
                item.urgency === "overdue"
                  ? "font-medium text-red-700 dark:text-red-400"
                  : "text-amber-700 dark:text-amber-300"
              }
            >
              {item.restaurant.name}
            </span>
            {item.top_platform && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                {item.top_platform.url ? (
                  <a
                    href={item.top_platform.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[36px] items-center gap-0.5 text-xs text-amber-600 hover:underline dark:text-amber-400"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.top_platform.website}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {item.top_platform.website}
                  </span>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
