import { createClient } from "@/lib/supabase/server";
import type { PlaceDetails } from "@/types/database";

interface OpeningPeriod {
  open: { day: number; hour: number; minute: number };
  close?: { day: number; hour: number; minute: number };
}

interface GooglePlaceDetails {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: { periods?: OpeningPeriod[] };
}

function extractClosedDays(periods: OpeningPeriod[] | undefined): number[] | null {
  if (!periods || periods.length === 0) return null;
  const openDays = new Set(periods.map((p) => p.open.day));
  return [0, 1, 2, 3, 4, 5, 6].filter((d) => !openDays.has(d));
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId");
  if (!placeId)
    return Response.json({ error: "placeId required" }, { status: 400 });

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      headers: {
        "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,rating,userRatingCount,regularOpeningHours",
      },
    }
  );

  if (!res.ok) {
    return Response.json({ error: "Places API error" }, { status: 502 });
  }

  const data: GooglePlaceDetails = await res.json();

  const details: PlaceDetails = {
    placeId: data.id,
    name: data.displayName?.text ?? "",
    address: data.formattedAddress ?? "",
    phone: data.nationalPhoneNumber,
    website: data.websiteUri,
    rating: data.rating,
    ratingCount: data.userRatingCount,
    mapsUrl: `https://www.google.com/maps/place/?q=place_id:${data.id}`,
    closedDaysOfWeek: extractClosedDays(data.regularOpeningHours?.periods),
  };

  return Response.json({ details });
}
