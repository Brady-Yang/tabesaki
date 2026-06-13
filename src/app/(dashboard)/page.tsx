"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WishlistCard } from "@/components/WishlistCard";
import { WishlistDetail } from "@/components/WishlistDetail";
import { WishlistToolbar } from "@/components/WishlistToolbar";
import { UrgencyBanner } from "@/components/UrgencyBanner";
import { useWishlist } from "@/hooks/useWishlist";
import type { WishlistFilters, WishlistItemEnriched } from "@/types/index";
import { Plus } from "lucide-react";

function SkeletonCard() {
  return (
    <div className="h-36 w-full animate-pulse rounded-2xl border bg-zinc-100 dark:bg-zinc-800" />
  );
}

export default function WishlistPage() {
  const [filters, setFilters] = useState<WishlistFilters>({
    sort: "reminder_date",
    order: "asc",
  });

  const { query, removeFromWishlist, updateNotes } = useWishlist(filters);
  const [selectedItem, setSelectedItem] = useState<WishlistItemEnriched | null>(
    null
  );
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: items, isLoading, isError } = query;

  function handleCardClick(item: WishlistItemEnriched) {
    setSelectedItem(item);
    setDetailOpen(true);
  }

  function handleRemove(id: string) {
    removeFromWishlist.mutate(id, {
      onSuccess: () => {
        setDetailOpen(false);
        setSelectedItem(null);
      },
    });
  }

  function handleUpdateNotes(id: string, notes: string | null) {
    updateNotes.mutate({ id, notes });
  }

  const liveItem =
    selectedItem && items
      ? (items.find((i) => i.id === selectedItem.id) ?? selectedItem)
      : selectedItem;

  const hasActiveFilters =
    !!filters.filter_status ||
    !!filters.filter_cuisine ||
    filters.filter_price_max != null ||
    !!filters.search;

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Wishlist</h1>
          {!isLoading && items != null && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {items.length} restaurant{items.length !== 1 ? "s" : ""}
              {hasActiveFilters && " matching filters"}
            </p>
          )}
        </div>
        <Button asChild size="sm" className="min-h-[44px]">
          <Link href="/restaurants/add">
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Link>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="mt-4">
        <WishlistToolbar filters={filters} onChange={setFilters} />
      </div>

      {/* Urgency banner */}
      {items && items.length > 0 && (
        <div className="mt-4">
          <UrgencyBanner items={items} />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <p className="mt-8 text-sm text-destructive">
          Failed to load wishlist. Please refresh.
        </p>
      )}

      {/* Empty state */}
      {!isLoading && !isError && items?.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          {hasActiveFilters ? (
            <p className="text-sm text-muted-foreground">
              No restaurants match your filters.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Add your first restaurant to get started.
              </p>
              <Button asChild>
                <Link href="/restaurants/add">Add Restaurant</Link>
              </Button>
            </>
          )}
        </div>
      )}

      {/* List */}
      {!isLoading && items && items.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              onClick={() => handleCardClick(item)}
            />
          ))}
        </div>
      )}

      <WishlistDetail
        item={liveItem}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onRemove={handleRemove}
        onUpdateNotes={handleUpdateNotes}
        isRemoving={removeFromWishlist.isPending}
      />
    </div>
  );
}
