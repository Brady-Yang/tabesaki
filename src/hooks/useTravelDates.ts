"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TravelDate } from "@/types/index";
import type { TravelDateStatus } from "@/types/database";

export function useTravelDates(wishlistId: string | null) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["travel-dates", wishlistId],
    queryFn: async () => {
      const res = await fetch(`/api/travel-dates?wishlist_id=${wishlistId}`);
      if (!res.ok) throw new Error("Failed to fetch travel dates");
      const data = await res.json();
      return data.dates as TravelDate[];
    },
    enabled: !!wishlistId,
    staleTime: 2 * 60 * 1000,
  });

  const addDate = useMutation({
    mutationFn: async (body: {
      wishlist_id: string;
      desired_date: string;
      priority: number;
      party_size: number;
    }) => {
      const res = await fetch("/api/travel-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to add travel date");
      return json;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["travel-dates", wishlistId] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const updateDate = useMutation({
    mutationFn: async ({
      id,
      ...body
    }: {
      id: string;
      status?: TravelDateStatus;
      confirmation_notes?: string | null;
      booked_at?: string | null;
      priority?: number;
    }) => {
      const res = await fetch(`/api/travel-dates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update travel date");
      return res.json();
    },
    onMutate: async ({ id, ...updates }) => {
      await qc.cancelQueries({ queryKey: ["travel-dates", wishlistId] });
      const prev = qc.getQueryData<TravelDate[]>(["travel-dates", wishlistId]);
      qc.setQueryData<TravelDate[]>(["travel-dates", wishlistId], (old) =>
        old?.map((d) => (d.id === id ? { ...d, ...updates } : d))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev)
        qc.setQueryData(["travel-dates", wishlistId], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["travel-dates", wishlistId] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const deleteDate = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/travel-dates/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete travel date");
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["travel-dates", wishlistId] });
      const prev = qc.getQueryData<TravelDate[]>(["travel-dates", wishlistId]);
      qc.setQueryData<TravelDate[]>(["travel-dates", wishlistId], (old) =>
        old?.filter((d) => d.id !== id)
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev)
        qc.setQueryData(["travel-dates", wishlistId], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["travel-dates", wishlistId] });
      qc.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  return { query, addDate, updateDate, deleteDate };
}
