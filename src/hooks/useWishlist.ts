"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WishlistFilters, WishlistItemEnriched } from "@/types/index";

export function useWishlist(filters: WishlistFilters = {}) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["wishlist", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.order) params.set("order", filters.order);
      if (filters.filter_status) params.set("filter_status", filters.filter_status);
      if (filters.filter_cuisine) params.set("filter_cuisine", filters.filter_cuisine);
      if (filters.filter_price_max != null)
        params.set("filter_price_max", String(filters.filter_price_max));
      if (filters.search) params.set("search", filters.search);

      const qs = params.toString();
      const res = await fetch(`/api/wishlist${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch wishlist");
      const data = await res.json();
      return data.items as WishlistItemEnriched[];
    },
    staleTime: 2 * 60 * 1000,
  });

  const addToWishlist = useMutation({
    mutationFn: async (body: { restaurant_id: string; notes?: string }) => {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add to wishlist");
      return json;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const removeFromWishlist = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/wishlist/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove from wishlist");
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["wishlist"] });
      const prev = qc.getQueryData<WishlistItemEnriched[]>(["wishlist", filters]);
      qc.setQueryData<WishlistItemEnriched[]>(["wishlist", filters], (old) =>
        old?.filter((item) => item.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["wishlist", filters], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const updateNotes = useMutation({
    mutationFn: async ({
      id,
      notes,
    }: {
      id: string;
      notes: string | null;
    }) => {
      const res = await fetch(`/api/wishlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to update notes");
      return res.json();
    },
    onMutate: async ({ id, notes }) => {
      await qc.cancelQueries({ queryKey: ["wishlist"] });
      const prev = qc.getQueryData<WishlistItemEnriched[]>(["wishlist", filters]);
      qc.setQueryData<WishlistItemEnriched[]>(["wishlist", filters], (old) =>
        old?.map((item) => (item.id === id ? { ...item, notes } : item))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["wishlist", filters], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  return { query, addToWishlist, removeFromWishlist, updateNotes };
}
