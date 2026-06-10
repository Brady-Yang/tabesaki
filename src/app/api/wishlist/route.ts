import { createClient } from "@/lib/supabase/server";
import type { TravelDate } from "@/types/index";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("wishlist")
    .select(
      `
      *,
      restaurant:restaurants(
        *,
        reservation_platforms(*)
      ),
      travel_dates(id, booking_reminder_datetime, status)
    `
    )
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  type RawRow = (typeof data)[0] & {
    travel_dates: Pick<TravelDate, "id" | "booking_reminder_datetime" | "status">[];
  };

  const items = (data as RawRow[]).map((row) => {
    const dates = row.travel_dates ?? [];
    const activeReminders = dates
      .filter(
        (d) =>
          d.booking_reminder_datetime &&
          d.status !== "Visited" &&
          d.status !== "Missed"
      )
      .map((d) => d.booking_reminder_datetime as string)
      .sort();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { travel_dates, ...rest } = row;
    return {
      ...rest,
      travel_date_count: dates.length,
      next_reminder: activeReminders[0] ?? null,
    };
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
