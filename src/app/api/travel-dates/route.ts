import { createClient } from "@/lib/supabase/server";
import type { ReservationPlatform } from "@/types/index";

function calcBookingReminderDatetime(
  desiredDateStr: string,
  platform: ReservationPlatform
): string | null {
  if (!platform.advance_type) return null;

  const hour = platform.booking_open_hour ?? 10;
  const minute = platform.booking_open_minute ?? 0;
  const tz = platform.booking_open_tz ?? "Asia/Tokyo";

  let reminderDay: Date;

  if (platform.advance_type === "rolling") {
    if (platform.advance_days == null) return null;
    const d = new Date(desiredDateStr + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() - platform.advance_days);
    reminderDay = d;
  } else {
    // fixed_calendar
    if (
      platform.open_day_of_month == null ||
      platform.open_months_prior == null
    )
      return null;
    const d = new Date(desiredDateStr + "T00:00:00Z");
    const resYear = d.getUTCFullYear();
    const resMonth = d.getUTCMonth(); // 0-indexed
    const openMonthIdx = resMonth - platform.open_months_prior;
    const openYear =
      openMonthIdx < 0
        ? resYear + Math.floor(openMonthIdx / 12)
        : resYear;
    const openMonth = ((openMonthIdx % 12) + 12) % 12;
    reminderDay = new Date(
      Date.UTC(openYear, openMonth, platform.open_day_of_month)
    );
  }

  // Build local datetime string (treat as proxy UTC), then find real UTC offset
  const y = reminderDay.getUTCFullYear();
  const mo = String(reminderDay.getUTCMonth() + 1).padStart(2, "0");
  const d = String(reminderDay.getUTCDate()).padStart(2, "0");
  const h = String(hour).padStart(2, "0");
  const mi = String(minute).padStart(2, "0");
  const localStr = `${y}-${mo}-${d}T${h}:${mi}:00`;

  // Probe: treat local time as UTC, then measure tz offset
  const probe = new Date(localStr + "Z");
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(probe);
  const m: Record<string, string> = Object.fromEntries(
    parts.map((x) => [x.type, x.value])
  );
  // tzLocal is what `tz` shows for `probe` (treated as UTC)
  const tzLocal = new Date(
    `${m.year}-${m.month}-${m.day}T${m.hour}:${m.minute}:${m.second}Z`
  );
  // offset = tzLocal - probe (e.g. JST: +9h)
  const offsetMs = tzLocal.getTime() - probe.getTime();
  // trueUtc = probe - offset (corrects for the tz shift)
  return new Date(probe.getTime() - offsetMs).toISOString();
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const wishlistId = searchParams.get("wishlist_id");
  if (!wishlistId)
    return Response.json({ error: "wishlist_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("travel_dates")
    .select("*")
    .eq("wishlist_id", wishlistId)
    .order("priority", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ dates: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    wishlist_id: string;
    desired_date: string;
    priority: number;
    party_size: number;
  };

  const { wishlist_id, desired_date, priority, party_size } = body;
  if (!wishlist_id || !desired_date || !priority)
    return Response.json({ error: "wishlist_id, desired_date, priority required" }, { status: 400 });

  // Verify the wishlist item belongs to the user (RLS handles this, but we need the restaurant_id)
  const { data: wishlistRow, error: wErr } = await supabase
    .from("wishlist")
    .select("restaurant_id")
    .eq("id", wishlist_id)
    .single();
  if (wErr || !wishlistRow)
    return Response.json({ error: "Wishlist item not found" }, { status: 404 });

  // Get highest-priority platform for this restaurant
  const { data: platform } = await supabase
    .from("reservation_platforms")
    .select("*")
    .eq("restaurant_id", wishlistRow.restaurant_id)
    .order("priority", { ascending: true })
    .limit(1)
    .maybeSingle();

  const booking_reminder_datetime = platform
    ? calcBookingReminderDatetime(desired_date, platform as ReservationPlatform)
    : null;

  const { data, error } = await supabase
    .from("travel_dates")
    .insert({
      wishlist_id,
      desired_date,
      priority,
      party_size: party_size ?? 2,
      status: "Watching",
      booking_reminder_datetime,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      return Response.json(
        { error: "A travel date with this date or priority already exists" },
        { status: 409 }
      );
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ date: data }, { status: 201 });
}
