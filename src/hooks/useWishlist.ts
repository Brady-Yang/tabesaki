"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { WishlistItemEnriched } from "@/types/index";

export function useWishlist() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await fetch("/api/wishlist");
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
      const prev = qc.getQueryData<WishlistItemEnriched[]>(["wishlist"]);
      qc.setQueryData<WishlistItemEnriched[]>(["wishlist"], (old) =>
        old?.filter((item) => item.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["wishlist"], ctx.prev);
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
      const prev = qc.getQueryData<WishlistItemEnriched[]>(["wishlist"]);
      qc.setQueryData<WishlistItemEnriched[]>(["wishlist"], (old) =>
        old?.map((item) => (item.id === id ? { ...item, notes } : item))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["wishlist"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  return { query, addToWishlist, removeFromWishlist, updateNotes };
}
