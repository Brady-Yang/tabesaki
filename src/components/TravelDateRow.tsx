"use client";

import { useState } from "react";
import type { TravelDate } from "@/types/index";
import type { TravelDateStatus } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";

const PRIORITY_SYMBOLS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"];

const STATUS_STYLES: Record<
  TravelDateStatus,
  { className: string }
> = {
  Watching: { className: "bg-zinc-100 text-zinc-600" },
  "Booking Soon": { className: "bg-amber-100 text-amber-700" },
  Booked: { className: "bg-green-100 text-green-700" },
  Visited: { className: "bg-blue-100 text-blue-700" },
  Missed: { className: "bg-red-100 text-red-700" },
};

const ALL_STATUSES: TravelDateStatus[] = [
  "Watching",
  "Booking Soon",
  "Booked",
  "Visited",
  "Missed",
];

interface Props {
  date: TravelDate;
  onUpdate: (id: string, updates: { status?: TravelDateStatus; confirmation_notes?: string | null }) => void;
  onDelete: (id: string) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function TravelDateRow({
  date,
  onUpdate,
  onDelete,
  isUpdating,
  isDeleting,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmNotes, setConfirmNotes] = useState(
    date.confirmation_notes ?? ""
  );

  const prioritySymbol =
    PRIORITY_SYMBOLS[date.priority - 1] ?? `#${date.priority}`;
  const statusStyle = STATUS_STYLES[date.status];

  const desiredDate = new Date(date.desired_date + "T00:00:00");
  const formattedDate = desiredDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const reminderDate = date.booking_reminder_datetime
    ? new Date(date.booking_reminder_datetime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  function handleStatusChange(status: TravelDateStatus) {
    onUpdate(date.id, {
      status,
      ...(status === "Booked"
        ? { booked_at: new Date().toISOString() }
        : {}),
    });
  }

  function handleSaveNotes() {
    onUpdate(date.id, {
      confirmation_notes: confirmNotes.trim() || null,
    });
    setIsEditing(false);
  }

  return (
    <div className="rounded-xl border bg-zinc-50 p-3 dark:bg-zinc-800/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="shrink-0 text-lg font-medium text-zinc-400"
            aria-label={`Priority ${date.priority}`}
          >
            {prioritySymbol}
          </span>
          <div>
            <p className="text-sm font-medium">{formattedDate}</p>
            <p className="text-xs text-muted-foreground">
              Party of {date.party_size}
              {reminderDate && (
                <span className="ml-2">· Book by {reminderDate}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              statusStyle.className
            )}
          >
            {date.status}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-zinc-400 hover:text-destructive"
            onClick={() => onDelete(date.id)}
            disabled={isDeleting}
            aria-label="Delete travel date"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!isEditing ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex-1">
            <Select
              value={date.status}
              onValueChange={(v) => handleStatusChange(v as TravelDateStatus)}
              disabled={isUpdating}
            >
              <SelectTrigger className="h-7 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            className="max-w-[140px] truncate text-left text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setIsEditing(true)}
          >
            {date.confirmation_notes ?? (
              <span className="italic opacity-50">Add notes…</span>
            )}
          </button>
        </div>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            className="w-full rounded-md border bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring dark:bg-zinc-900"
            rows={2}
            placeholder="Confirmation code, notes…"
            value={confirmNotes}
            onChange={(e) => setConfirmNotes(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={handleSaveNotes}
              disabled={isUpdating}
            >
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
