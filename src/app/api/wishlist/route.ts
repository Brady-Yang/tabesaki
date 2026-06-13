import { createClient } from "@/lib/supabase/server";
import type { TravelDateStatus } from "@/types/database";
import type { ReservationPlatform, UrgencyLevel, WishlistFilters } from "@/types/index";

const URGENCY_ORDER: Record<UrgencyLevel, number> = {
  overdue: 0,
  urgent: 1,
  upcoming: 2,
  watching: 3,
  no_dates: 4,
};

function computeUrgency(nextReminderDate: string | null): UrgencyLevel {
  if (!nextReminderDate) return "no_dates";
  const diffDays =
    (new Date(nextReminderDate).getTime() - Date.now()) / 86_400_000;
  if (diffDays < 0) return "overdue";
  if (diffDays <= 7) return "urgent";
  if (diffDays <= 30) return "upcoming";
  return "watching";
}

type TravelDateSlim = {
  id: string;
  desired_date: string;
  party_size: number;
  booking_reminder_datetime: string | null;
  status: TravelDateStatus;
};

type RawRestaurant = Restaurant & {
  reservation_platforms: ReservationPlatform[];
};

type Restaurant = {
  id: string;
  google_place_id: string | null;
  name: string;
  address: string | null;
  cuisine: string | null;
  website: string | null;
  phone: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  price_notes: string | null;
  closed_days_of_week: number[] | null;
  ai_extracted_at: string | null;
  created_at: string;
};

type RawRow = {
  id: string;
  user_id: string;
  restaurant_id: string;
  notes: string | null;
  created_at: string;
  restaurant: RawRestaurant;
  travel_dates: TravelDateSlim[];
};

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const sort =
    (url.searchParams.get("sort") as WishlistFilters["sort"]) ??
    "reminder_date";
  const order =
    (url.searchParams.get("order") as "asc" | "desc") ?? "asc";
  const filter_status = url.searchParams.get("filter_status");
  const filter_cuisine = url.searchParams.get("filter_cuisine");
  const filter_price_max = url.searchParams.get("filter_price_max")
    ? Number(url.searchParams.get("filter_price_max"))
    : null;
  const search = url.searchParams.get("search");

  const { data, error } = await supabase.from("wishlist").select(
    `*,
    restaurant:restaurants(*, reservation_platforms(*)),
    travel_dates(id, desired_date, party_size, booking_reminder_datetime, status)`
  );

  if (error) return Response.json({ error: error.message }, { status: 500 });

  let rawItems = data as unknown as RawRow[];

  // Status filter — show item if any travel_date matches
  if (filter_status) {
    const statuses = new Set(filter_status.split(",").map((s) => s.trim()));
    rawItems = rawItems.filter((row) =>
      (row.travel_dates ?? []).some((d) => statuses.has(d.status))
    );
  }

  // Map to enriched items
  let items = rawItems.map((row) => {
    const allDates = row.travel_dates ?? [];
    const activeDates = allDates
      .filter((d) => d.status !== "Visited" && d.status !== "Missed")
      .sort((a, b) => a.desired_date.localeCompare(b.desired_date));

    const nextDate = activeDates[0] ?? null;
    const next_travel_date = nextDate?.desired_date ?? null;
    const next_reminder_date = nextDate?.booking_reminder_datetime ?? null;
    const next_party_size = nextDate?.party_size ?? null;
    const urgency = computeUrgency(next_reminder_date);

    const platforms = (row.restaurant?.reservation_platforms ?? []) as ReservationPlatform[];
    const top_platform: ReservationPlatform | null =
      platforms.length > 0
        ? [...platforms].sort((a, b) => a.priority - b.priority)[0]
        : null;

    return {
      id: row.id,
      user_id: row.user_id,
      restaurant_id: row.restaurant_id,
      notes: row.notes,
      created_at: row.created_at,
      restaurant: row.restaurant,
      travel_date_count: allDates.length,
      next_travel_date,
      next_reminder_date,
      next_party_size,
      urgency,
      top_platform,
    };
  });

  // Cuisine filter
  if (filter_cuisine) {
    const q = filter_cuisine.toLowerCase();
    items = items.filter((item) =>
      item.restaurant?.cuisine?.toLowerCase().includes(q)
    );
  }

  // Price max filter
  if (filter_price_max !== null) {
    items = items.filter(
      (item) =>
        item.restaurant?.price_range_min == null ||
        item.restaurant.price_range_min <= filter_price_max
    );
  }

  // Search by restaurant name
  if (search) {
    const q = search.toLowerCase();
    items = items.filter((item) =>
      item.restaurant?.name?.toLowerCase().includes(q)
    );
  }

  // Sort
  const dir = order === "desc" ? -1 : 1;
  items.sort((a, b) => {
    switch (sort) {
      case "name":
        return (
          dir *
          (a.restaurant?.name ?? "").localeCompare(b.restaurant?.name ?? "")
        );
      case "cuisine":
        return (
          dir *
          (a.restaurant?.cuisine ?? "").localeCompare(
            b.restaurant?.cuisine ?? ""
          )
        );
      case "price":
        return (
          dir *
          ((a.restaurant?.price_range_min ?? 0) -
            (b.restaurant?.price_range_min ?? 0))
        );
      case "status":
        return dir * (URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency]);
      case "reminder_date":
      default: {
        if (!a.next_reminder_date && !b.next_reminder_date) return 0;
        if (!a.next_reminder_date) return 1;
        if (!b.next_reminder_date) return -1;
        return dir * a.next_reminder_date.localeCompare(b.next_reminder_date);
      }
    }
  });

  return Response.json({ items });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { restaurant_id, notes } = body as {
    restaurant_id: string;
    notes?: string;
  };

  if (!restaurant_id)
    return Response.json({ error: "restaurant_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("wishlist")
    .insert({ user_id: user.id, restaurant_id, notes: notes ?? null })
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      return Response.json(
        { error: "Restaurant is already in your wishlist" },
        { status: 409 }
      );
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ item: data }, { status: 201 });
}
