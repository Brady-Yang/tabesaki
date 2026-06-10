import { createClient } from "@/lib/supabase/server";
import type { CuisineType, ExtractedPlatform } from "@/types/database";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const googlePlaceId = searchParams.get("google_place_id");
  if (!googlePlaceId)
    return Response.json({ error: "google_place_id required" }, { status: 400 });

  const { data, error } = await supabase
    .from("restaurants")
    .select("*, reservation_platforms(*)")
    .eq("google_place_id", googlePlaceId)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ restaurant: data });
}

interface RestaurantPayload {
  name: string;
  google_place_id: string;
  address?: string;
  cuisine?: CuisineType;
  website?: string;
  phone?: string;
  price_range_min?: number;
  price_range_max?: number;
  price_notes?: string;
  closed_days_of_week?: number[] | null;
  ai_extracted_at?: string | null;
  platforms: ExtractedPlatform[];
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body: RestaurantPayload = await request.json();

  // Dedup check — return existing if already saved
  const { data: existing } = await supabase
    .from("restaurants")
    .select("id")
    .eq("google_place_id", body.google_place_id)
    .maybeSingle();

  if (existing) {
    return Response.json({ restaurantId: existing.id, existed: true });
  }

  const { data: restaurant, error: rErr } = await supabase
    .from("restaurants")
    .insert({
      name: body.name,
      google_place_id: body.google_place_id,
      address: body.address ?? null,
      cuisine: body.cuisine ?? null,
      website: body.website ?? null,
      phone: body.phone ?? null,
      price_range_min: body.price_range_min ?? null,
      price_range_max: body.price_range_max ?? null,
      price_notes: body.price_notes ?? null,
      closed_days_of_week: body.closed_days_of_week ?? null,
      ai_extracted_at: body.ai_extracted_at ?? null,
    })
    .select("id")
    .single();

  if (rErr || !restaurant) {
    return Response.json(
      { error: rErr?.message ?? "Insert failed" },
      { status: 500 }
    );
  }

  if (body.platforms.length > 0) {
    const platformRows = body.platforms.map((p, i) => ({
      restaurant_id: restaurant.id,
      website: p.website,
      url: p.url ?? null,
      priority: p.priority ?? i + 1,
      advance_type: p.advance_type ?? null,
      advance_days: p.advance_days ?? null,
      open_day_of_month: p.open_day_of_month ?? null,
      open_months_prior: p.open_months_prior ?? null,
      booking_open_hour: p.booking_open_hour ?? null,
      booking_open_minute: p.booking_open_minute ?? 0,
      booking_open_tz: p.booking_open_tz ?? "Asia/Tokyo",
      course_price: p.course_price ?? null,
      course_description: p.course_description ?? null,
      notes: p.notes ?? null,
      ai_extracted: p.ai_extracted,
    }));

    const { error: pErr } = await supabase
      .from("reservation_platforms")
      .insert(platformRows);

    if (pErr) {
      return Response.json({
        restaurantId: restaurant.id,
        existed: false,
        platformError: pErr.message,
      });
    }
  }

  return Response.json({ restaurantId: restaurant.id, existed: false });
}
