import { createClient } from "@/lib/supabase/server";
import type { PlaceCandidate } from "@/types/database";

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.trim() ?? "";
  const cuisine = searchParams.get("cuisine")?.trim() ?? "";
  const city = searchParams.get("city")?.trim() ?? "";

  if (!name) return Response.json({ candidates: [] });

  const textQuery = [name, cuisine, city].filter(Boolean).join(" ");

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY!,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.businessStatus",
    },
    body: JSON.stringify({ textQuery, maxResultCount: 5 }),
  });

  if (!res.ok) {
    return Response.json({ error: "Places API error" }, { status: 502 });
  }

  const data: { places?: GooglePlace[] } = await res.json();

  const candidates: PlaceCandidate[] = (data.places ?? []).map((p) => ({
    placeId: p.id,
    name: p.displayName?.text ?? "",
    address: p.formattedAddress ?? "",
    rating: p.rating,
    ratingCount: p.userRatingCount,
    isPermanentlyClosed: p.businessStatus === "CLOSED_PERMANENTLY",
  }));

  return Response.json({ candidates });
}
