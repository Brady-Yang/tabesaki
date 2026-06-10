"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WishlistCard } from "@/components/WishlistCard";
import { WishlistDetail } from "@/components/WishlistDetail";
import { useWishlist } from "@/hooks/useWishlist";
import type { WishlistItemEnriched } from "@/types/index";
import { Plus } from "lucide-react";

function SkeletonCard() {
  return (
    <div className="h-28 w-full animate-pulse rounded-2xl border bg-zinc-100 dark:bg-zinc-800" />
  );
}

export default function WishlistPage() {
  const { query, removeFromWishlist, updateNotes } = useWishlist();
  const [selectedItem, setSelectedItem] =
    useState<WishlistItemEnriched | null>(null);
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

  // Keep detail item in sync with latest data
  const liveItem =
    selectedItem && items
      ? (items.find((i) => i.id === selectedItem.id) ?? selectedItem)
      : selectedItem;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">My Wishlist</h1>
        <Button asChild size="sm">
          <Link href="/restaurants/add">
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {isError && (
        <p className="mt-8 text-sm text-destructive">
          Failed to load wishlist. Please refresh.
        </p>
      )}

      {!isLoading && !isError && items?.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            Add your first restaurant to get started
          </p>
          <Button asChild>
            <Link href="/restaurants/add">Add Restaurant</Link>
          </Button>
        </div>
      )}

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
