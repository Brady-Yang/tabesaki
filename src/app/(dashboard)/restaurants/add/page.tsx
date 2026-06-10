"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { SearchForm } from "@/components/restaurant-search/SearchForm";
import { CandidateList } from "@/components/restaurant-search/CandidateList";
import { ConfirmationCard } from "@/components/restaurant-search/ConfirmationCard";
import { ReviewScreen } from "@/components/restaurant-search/ReviewScreen";
import { usePlacesSearch } from "@/hooks/usePlacesSearch";
import { useRestaurantExtract } from "@/hooks/useRestaurantExtract";
import type {
  CuisineType,
  ExtractionResult,
  ExtractedPlatform,
  PlaceCandidate,
  PlaceDetails,
} from "@/types/database";
import type { SearchParams } from "@/components/restaurant-search/SearchForm";

type Step = "search" | "confirm" | "extracting" | "review";

export default function AddRestaurantPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("search");
  const [searchParams, setSearchParams] = useState<SearchParams>({
    name: "",
    cuisine: "",
    city: "",
  });
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [selectedCandidate, setSelectedCandidate] =
    useState<PlaceCandidate | null>(null);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: candidates, isFetching } = usePlacesSearch(
    searchParams,
    searchEnabled
  );
  const { mutate: extract } = useRestaurantExtract();

  function handleSearch(params: SearchParams) {
    setSearchParams(params);
    setSearchEnabled(true);
    setSelectedCandidate(null);
    setError(null);
  }

  async function handleSelect(candidate: PlaceCandidate) {
    setError(null);

    // Dedup check — if already saved, add to wishlist and go home
    const dupRes = await fetch(
      `/api/restaurants?google_place_id=${candidate.placeId}`
    );
    const dupData = await dupRes.json();
    if (dupData.restaurant) {
      await addToWishlist(dupData.restaurant.id);
      return;
    }

    // Fetch full place details
    const detRes = await fetch(
      `/api/places/details?placeId=${candidate.placeId}`
    );
    if (!detRes.ok) {
      setError("Failed to fetch restaurant details. Please try again.");
      return;
    }
    const detData = await detRes.json();
    setPlaceDetails(detData.details as PlaceDetails);
    setSelectedCandidate(candidate);
    setStep("confirm");
  }

  function handleConfirm() {
    if (!placeDetails) return;
    setStep("extracting");

    extract(
      {
        websiteUrl: placeDetails.website ?? "",
        restaurantName: placeDetails.name,
        address: placeDetails.address,
        city: searchParams.city,
        reservationUri: undefined,
      },
      {
        onSuccess: (result) => {
          setExtraction({
            ...result,
            closed_days_of_week:
              placeDetails.closedDaysOfWeek !== undefined
                ? placeDetails.closedDaysOfWeek
                : result.closed_days_of_week,
          });
          setStep("review");
        },
        onError: () => {
          setExtraction({
            platforms: [],
            closed_days_of_week: placeDetails.closedDaysOfWeek ?? null,
          });
          setStep("review");
        },
      }
    );
  }

  async function addToWishlist(restaurantId: string) {
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurant_id: restaurantId }),
      });
      // 409 means already wishlisted — that's fine, just navigate
      if (!res.ok && res.status !== 409) {
        throw new Error("Failed to add to wishlist");
      }
    } catch {
      // Non-fatal — restaurant is saved, just skip wishlist silently
    }
    router.push("/");
  }

  async function handleSave(platforms: ExtractedPlatform[]) {
    if (!placeDetails || !selectedCandidate) return;
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/restaurants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: placeDetails.name,
          google_place_id: selectedCandidate.placeId,
          address: placeDetails.address,
          cuisine: (searchParams.cuisine as CuisineType) || undefined,
          website: placeDetails.website,
          phone: placeDetails.phone,
          price_range_min: extraction?.price_range_min,
          price_range_max: extraction?.price_range_max,
          price_notes: extraction?.price_notes,
          closed_days_of_week: extraction?.closed_days_of_week,
          ai_extracted_at: platforms.some((p) => p.ai_extracted)
            ? new Date().toISOString()
            : null,
          platforms,
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      const data = await res.json();
      await addToWishlist(data.restaurantId);
    } catch {
      setError("Failed to save. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">Add restaurant</h1>
      </div>

      {error && (
        <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {step === "search" && (
        <div className="flex flex-col gap-4">
          <SearchForm onSearch={handleSearch} isLoading={isFetching} />
          {searchEnabled && (
            <CandidateList
              candidates={candidates ?? []}
              onSelect={handleSelect}
              isLoading={isFetching}
            />
          )}
        </div>
      )}

      {step === "confirm" && placeDetails && (
        <ConfirmationCard
          details={placeDetails}
          onConfirm={handleConfirm}
          onBack={() => setStep("search")}
        />
      )}

      {step === "extracting" && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Extracting reservation info…
          </p>
          <p className="text-xs text-muted-foreground">
            This may take 10–20 seconds
          </p>
        </div>
      )}

      {step === "review" && placeDetails && extraction && (
        <ReviewScreen
          details={placeDetails}
          cuisine={(searchParams.cuisine as CuisineType) || ""}
          extraction={extraction}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
