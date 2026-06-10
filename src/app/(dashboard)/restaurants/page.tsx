import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CUISINE_COLORS: Record<string, string> = {
  "Omakase Sushi": "bg-rose-100 text-rose-700",
  "Kaiseki": "bg-amber-100 text-amber-700",
  "Tempura": "bg-orange-100 text-orange-700",
  "Soba/Kappo": "bg-stone-100 text-stone-700",
  "Teppanyaki": "bg-red-100 text-red-700",
  "Yakiniku": "bg-yellow-100 text-yellow-700",
  "Other": "bg-zinc-100 text-zinc-600",
};

export default async function RestaurantsPage() {
  const supabase = await createClient();
  const { data: restaurants } = await supabase
    .from("restaurants")
    .select("*, reservation_platforms(*)")
    .order("name");

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Restaurants</h1>
        <Link
          href="/restaurants/add"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Add
        </Link>
      </div>

      {!restaurants || restaurants.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">No restaurants yet.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {restaurants.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-2 rounded-xl border bg-white px-4 py-3 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium leading-tight">{r.name}</span>
                  {r.address && (
                    <span className="text-xs text-muted-foreground">
                      {r.address}
                    </span>
                  )}
                </div>
                {r.cuisine && (
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      CUISINE_COLORS[r.cuisine] ?? CUISINE_COLORS["Other"]
                    )}
                  >
                    {r.cuisine}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {r.price_range_min != null && (
                  <span>
                    ¥{r.price_range_min.toLocaleString()}
                    {r.price_range_max != null &&
                      r.price_range_max !== r.price_range_min &&
                      ` – ¥${r.price_range_max.toLocaleString()}`}
                  </span>
                )}
                {r.closed_days_of_week != null &&
                  r.closed_days_of_week.length > 0 && (
                    <span>
                      Closed {r.closed_days_of_week.map((d: number) => DAY_NAMES[d]).join(", ")}
                    </span>
                  )}
                {r.reservation_platforms?.length > 0 && (
                  <span>
                    {r.reservation_platforms
                      .map((p: { website: string }) => p.website)
                      .join(" · ")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
