import { useMutation } from "@tanstack/react-query";
import type { ExtractionResult } from "@/types/database";

interface ExtractParams {
  websiteUrl: string;
  restaurantName: string;
  address: string;
  city: string;
  reservationUri?: string;
}

async function extractRestaurant(params: ExtractParams): Promise<ExtractionResult> {
  const res = await fetch("/api/restaurants/extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error("Extraction failed");
  return res.json() as Promise<ExtractionResult>;
}

export function useRestaurantExtract() {
  return useMutation({ mutationFn: extractRestaurant });
}
