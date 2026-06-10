"use client";

import { useState } from "react";
import type { ReservationPlatform } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function calcReminderPreview(
  dateStr: string,
  platform: ReservationPlatform | null
): string | null {
  if (!platform || !platform.advance_type || !dateStr) return null;

  const date = new Date(dateStr + "T00:00:00");

  if (platform.advance_type === "rolling" && platform.advance_days != null) {
    const d = new Date(date);
    d.setDate(d.getDate() - platform.advance_days);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (
    platform.advance_type === "fixed_calendar" &&
    platform.open_day_of_month != null &&
    platform.open_months_prior != null
  ) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const openMonthIdx = month - platform.open_months_prior;
    const openYear = openMonthIdx < 0 ? year - 1 : year;
    const openMonth = ((openMonthIdx % 12) + 12) % 12;
    const d = new Date(openYear, openMonth, platform.open_day_of_month);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  return null;
}

interface Props {
  wishlistId: string;
  closedDaysOfWeek: number[] | null;
  topPlatform: ReservationPlatform | null;
  nextPriority: number;
  onAdd: (params: {
    wishlist_id: string;
    desired_date: string;
    priority: number;
    party_size: number;
  }) => void;
  isAdding: boolean;
  onCancel: () => void;
}

export function AddTravelDateForm({
  wishlistId,
  closedDaysOfWeek,
  topPlatform,
  nextPriority,
  onAdd,
  isAdding,
  onCancel,
}: Props) {
  const [desiredDate, setDesiredDate] = useState("");
  const [priority, setPriority] = useState(String(nextPriority));
  const [partySize, setPartySize] = useState("2");
  const [error, setError] = useState<string | null>(null);

  // Today's date in YYYY-MM-DD for the min attribute
  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  })();

  const reminderPreview = calcReminderPreview(desiredDate, topPlatform);

  // Warn if the selected date falls on a closed day
  const selectedDayOfWeek = desiredDate
    ? new Date(desiredDate + "T00:00:00").getDay()
    : null;
  const isClosedDay =
    selectedDayOfWeek !== null &&
    closedDaysOfWeek !== null &&
    closedDaysOfWeek.includes(selectedDayOfWeek);

  function handleSubmit() {
    if (!desiredDate) {
      setError("Please select a date.");
      return;
    }
    const prio = parseInt(priority, 10);
    const size = parseInt(partySize, 10);
    if (isNaN(prio) || prio < 1) {
      setError("Priority must be a positive number.");
      return;
    }
    if (isNaN(size) || size < 1) {
      setError("Party size must be at least 1.");
      return;
    }
    if (isClosedDay) {
      setError(
        `The restaurant is closed on ${DAY_NAMES[selectedDayOfWeek!]}s. Please choose a different day.`
      );
      return;
    }
    setError(null);
    onAdd({
      wishlist_id: wishlistId,
      desired_date: desiredDate,
      priority: prio,
      party_size: size,
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-zinc-50 p-4 dark:bg-zinc-800/50">
      <p className="text-sm font-medium">Add travel date</p>

      {closedDaysOfWeek === null && (
        <div className="flex items-start gap-1.5 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Closure days unknown — verify the restaurant is open on your chosen
            date.
          </span>
        </div>
      )}

      {isClosedDay && (
        <div className="flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            This restaurant is closed on{" "}
            {DAY_NAMES[selectedDayOfWeek!]}s.
          </span>
        </div>
      )}

      {closedDaysOfWeek !== null && closedDaysOfWeek.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Closed: {closedDaysOfWeek.map((d) => DAY_NAMES[d]).join(", ")}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Date
        </label>
        <Input
          type="date"
          min={todayStr}
          value={desiredDate}
          onChange={(e) => {
            setDesiredDate(e.target.value);
            setError(null);
          }}
          className="h-9 text-sm"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Priority
          </label>
          <Input
            type="number"
            min="1"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">
            Party size
          </label>
          <Input
            type="number"
            min="1"
            value={partySize}
            onChange={(e) => setPartySize(e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {reminderPreview && (
        <p className="text-xs text-muted-foreground">
          Booking reminder:{" "}
          <span className="font-medium text-foreground">{reminderPreview}</span>
        </p>
      )}
      {!reminderPreview && !topPlatform && desiredDate && (
        <p className="text-xs text-muted-foreground">
          No reminder — add a reservation platform first.
        </p>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isAdding}
        >
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={isAdding}>
          {isAdding ? "Adding…" : "Add date"}
        </Button>
      </div>
    </div>
  );
}
