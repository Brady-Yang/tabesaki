"use client";

import { useState } from "react";
import type { WishlistItemEnriched } from "@/types/index";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TravelDateRow } from "@/components/TravelDateRow";
import { AddTravelDateForm } from "@/components/AddTravelDateForm";
import { useTravelDates } from "@/hooks/useTravelDates";
import { cn } from "@/lib/utils";
import { ExternalLink, Plus, Trash2 } from "lucide-react";

const ADVANCE_TYPE_LABELS: Record<string, string> = {
  rolling: "Rolling",
  fixed_calendar: "Fixed calendar",
};

interface DetailBodyProps {
  item: WishlistItemEnriched;
  onRemove: (id: string) => void;
  onUpdateNotes: (id: string, notes: string | null) => void;
  isRemoving?: boolean;
  onRequestClose: () => void;
}

function DetailBody({
  item,
  onRemove,
  onUpdateNotes,
  isRemoving,
  onRequestClose,
}: DetailBodyProps) {
  const [showAddDate, setShowAddDate] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notes, setNotes] = useState(item.notes ?? "");
  const [editingNotes, setEditingNotes] = useState(false);

  const { query: datesQuery, addDate, updateDate, deleteDate } =
    useTravelDates(item.id);

  const dates = datesQuery.data ?? [];
  const nextPriority =
    dates.length > 0 ? Math.max(...dates.map((d) => d.priority)) + 1 : 1;

  const restaurant = item.restaurant;
  const platforms = restaurant.reservation_platforms ?? [];
  const topPlatform =
    platforms.length > 0
      ? [...platforms].sort((a, b) => a.priority - b.priority)[0]
      : null;

  function handleSaveNotes() {
    onUpdateNotes(item.id, notes.trim() || null);
    setEditingNotes(false);
  }

  return (
    <>
      <SheetHeader className="pb-4">
        <SheetTitle className="text-xl leading-tight">
          {restaurant.name}
        </SheetTitle>
        {restaurant.address && (
          <p className="text-sm text-muted-foreground">{restaurant.address}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {restaurant.cuisine && (
            <Badge variant="secondary">{restaurant.cuisine}</Badge>
          )}
          {(restaurant.price_range_min != null ||
            restaurant.price_range_max != null) && (
            <span className="text-sm text-muted-foreground">
              {restaurant.price_range_min != null
                ? `¥${restaurant.price_range_min.toLocaleString()}`
                : ""}
              {restaurant.price_range_max != null &&
              restaurant.price_range_max !== restaurant.price_range_min
                ? ` – ¥${restaurant.price_range_max.toLocaleString()}`
                : ""}
            </span>
          )}
        </div>
      </SheetHeader>

      {/* Reservation platforms */}
      {platforms.length > 0 && (
        <section className="mb-5">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Reservation Platforms
          </h4>
          <ul className="flex flex-col gap-2">
            {[...platforms]
              .sort((a, b) => a.priority - b.priority)
              .map((p) => (
                <li
                  key={p.id}
                  className="rounded-lg border bg-zinc-50 px-3 py-2.5 text-sm dark:bg-zinc-800/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        #{p.priority}
                      </span>
                      <span className="font-medium">{p.website}</span>
                    </div>
                    {p.url && (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Book
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {p.advance_type && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ADVANCE_TYPE_LABELS[p.advance_type] ?? p.advance_type}
                      {p.advance_type === "rolling" &&
                        p.advance_days != null && (
                          <span> · {p.advance_days} days advance</span>
                        )}
                      {p.advance_type === "fixed_calendar" &&
                        p.open_day_of_month != null &&
                        p.open_months_prior != null && (
                          <span>
                            {" "}
                            · Day {p.open_day_of_month},{" "}
                            {p.open_months_prior} month
                            {p.open_months_prior !== 1 ? "s" : ""} prior
                          </span>
                        )}
                      {p.booking_open_hour != null && (
                        <span>
                          {" "}
                          · Opens{" "}
                          {String(p.booking_open_hour).padStart(2, "0")}:
                          {String(p.booking_open_minute ?? 0).padStart(2, "0")}{" "}
                          {p.booking_open_tz ?? "Asia/Tokyo"}
                        </span>
                      )}
                    </p>
                  )}
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* Travel dates */}
      <section className="mb-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Travel Dates
        </h4>

        {datesQuery.isLoading ? (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        ) : dates.length === 0 && !showAddDate ? (
          <p className="text-sm text-muted-foreground">No travel dates yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {dates.map((d) => (
              <TravelDateRow
                key={d.id}
                date={d}
                onUpdate={(id, updates) =>
                  updateDate.mutate({ id, ...updates })
                }
                onDelete={(id) => deleteDate.mutate(id)}
                isUpdating={updateDate.isPending}
                isDeleting={deleteDate.isPending}
              />
            ))}
          </div>
        )}

        {showAddDate ? (
          <div className="mt-3">
            <AddTravelDateForm
              wishlistId={item.id}
              closedDaysOfWeek={restaurant.closed_days_of_week}
              topPlatform={topPlatform}
              nextPriority={nextPriority}
              onAdd={(params) => {
                addDate.mutate(params, {
                  onSuccess: () => setShowAddDate(false),
                });
              }}
              isAdding={addDate.isPending}
              onCancel={() => setShowAddDate(false)}
            />
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setShowAddDate(true)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add date
          </Button>
        )}

        {addDate.isError && (
          <p className="mt-2 text-xs text-destructive">
            {addDate.error?.message ?? "Failed to add date"}
          </p>
        )}
      </section>

      {/* Personal notes */}
      <section className="mb-5">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notes
        </h4>
        {editingNotes ? (
          <div className="flex flex-col gap-2">
            <textarea
              className="w-full rounded-md border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-900"
              rows={3}
              placeholder="Add personal notes…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNotes(item.notes ?? "");
                  setEditingNotes(false);
                }}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveNotes}>
                Save
              </Button>
            </div>
          </div>
        ) : (
          <button
            className="w-full rounded-md px-0 text-left"
            onClick={() => setEditingNotes(true)}
          >
            <p
              className={cn(
                "text-sm",
                item.notes ? "text-foreground" : "text-muted-foreground italic"
              )}
            >
              {item.notes ?? "Add notes…"}
            </p>
          </button>
        )}
      </section>

      {/* Remove from wishlist */}
      <div className="mt-auto border-t pt-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirmDelete(true)}
          disabled={isRemoving}
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          Remove from wishlist
        </Button>
      </div>

      {/* Confirm remove dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove from wishlist?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will remove{" "}
            <span className="font-medium text-foreground">
              {restaurant.name}
            </span>{" "}
            and all its saved travel dates. This cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isRemoving}
              onClick={() => {
                onRemove(item.id);
                setConfirmDelete(false);
                onRequestClose();
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface Props {
  item: WishlistItemEnriched | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: (id: string) => void;
  onUpdateNotes: (id: string, notes: string | null) => void;
  isRemoving?: boolean;
}

export function WishlistDetail({
  item,
  open,
  onOpenChange,
  onRemove,
  onUpdateNotes,
  isRemoving,
}: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto sm:max-w-md"
      >
        {item && (
          <DetailBody
            key={item.id}
            item={item}
            onRemove={onRemove}
            onUpdateNotes={onUpdateNotes}
            isRemoving={isRemoving}
            onRequestClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
