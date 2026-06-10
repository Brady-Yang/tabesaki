import { useQuery } from "@tanstack/react-query";
import type { PlaceCandidate } from "@/types/database";

interface SearchParams {
  name: string;
  cuisine: string;
  city: string;
}

async function fetchCandidates(params: SearchParams): Promise<PlaceCandidate[]> {
  const q = new URLSearchParams({
    name: params.name,
    cuisine: params.cuisine,
    city: params.city,
  });
  const res = await fetch(`/api/places/search?${q}`);
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.candidates as PlaceCandidate[];
}

export function usePlacesSearch(params: SearchParams, enabled: boolean) {
  return useQuery({
    queryKey: ["places-search", params],
    queryFn: () => fetchCandidates(params),
    enabled: enabled && params.name.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}
