"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { AdvanceType, ExtractedPlatform, PlatformType } from "@/types/database";

const PLATFORM_OPTIONS: PlatformType[] = [
  "Omakase.in",
  "TableCheck",
  "Pocket Concierge",
  "TableAll",
  "Tabelog",
  "Ikyu",
  "Other",
];

interface PlatformEditorProps {
  platform: ExtractedPlatform;
  index: number;
  onChange: (index: number, platform: ExtractedPlatform) => void;
  onRemove: (index: number) => void;
}

export function PlatformEditor({
  platform,
  index,
  onChange,
  onRemove,
}: PlatformEditorProps) {
  function update(partial: Partial<ExtractedPlatform>) {
    onChange(index, { ...platform, ...partial });
  }

  function numField(val: number | undefined): string {
    return val !== undefined ? String(val) : "";
  }

  function parseNum(s: string): number | undefined {
    const n = parseInt(s, 10);
    return isNaN(n) ? undefined : n;
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Platform {index + 1}
          {platform.ai_extracted && (
            <span className="ml-2 text-xs text-blue-500">AI extracted</span>
          )}
        </span>
        <Button variant="ghost" size="icon" onClick={() => onRemove(index)}>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Platform</label>
          <Select
            value={platform.website}
            onValueChange={(v) => update({ website: v as PlatformType })}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLATFORM_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Booking type</label>
          <Select
            value={platform.advance_type ?? ""}
            onValueChange={(v) =>
              update({ advance_type: v ? (v as AdvanceType) : undefined })
            }
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Unknown" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rolling">Rolling (X days before)</SelectItem>
              <SelectItem value="fixed_calendar">Fixed calendar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium">Booking URL</label>
        <Input
          className="h-8 text-xs"
          placeholder="https://..."
          value={platform.url ?? ""}
          onChange={(e) => update({ url: e.target.value || undefined })}
        />
      </div>

      {platform.advance_type === "rolling" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Advance days</label>
          <Input
            className="h-8 text-xs"
            type="number"
            min={1}
            placeholder="e.g. 60"
            value={numField(platform.advance_days)}
            onChange={(e) => update({ advance_days: parseNum(e.target.value) })}
          />
        </div>
      )}

      {platform.advance_type === "fixed_calendar" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Open day of month</label>
            <Input
              className="h-8 text-xs"
              type="number"
              min={1}
              max={31}
              placeholder="e.g. 1"
              value={numField(platform.open_day_of_month)}
              onChange={(e) =>
                update({ open_day_of_month: parseNum(e.target.value) })
              }
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium">Months prior</label>
            <Input
              className="h-8 text-xs"
              type="number"
              min={1}
              placeholder="e.g. 2"
              value={numField(platform.open_months_prior)}
              onChange={(e) =>
                update({ open_months_prior: parseNum(e.target.value) })
              }
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Open hour (JST)</label>
          <Input
            className="h-8 text-xs"
            type="number"
            min={0}
            max={23}
            placeholder="10"
            value={numField(platform.booking_open_hour)}
            onChange={(e) =>
              update({ booking_open_hour: parseNum(e.target.value) })
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Open minute</label>
          <Input
            className="h-8 text-xs"
            type="number"
            min={0}
            max={59}
            placeholder="0"
            value={numField(platform.booking_open_minute)}
            onChange={(e) =>
              update({ booking_open_minute: parseNum(e.target.value) })
            }
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium">Course price (¥)</label>
          <Input
            className="h-8 text-xs"
            type="number"
            min={0}
            placeholder="30000"
            value={numField(platform.course_price)}
            onChange={(e) =>
              update({ course_price: parseNum(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium">Course description</label>
        <Input
          className="h-8 text-xs"
          placeholder="e.g. Omakase 12 courses"
          value={platform.course_description ?? ""}
          onChange={(e) =>
            update({ course_description: e.target.value || undefined })
          }
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium">Notes</label>
        <Input
          className="h-8 text-xs"
          placeholder="Special booking rules…"
          value={platform.notes ?? ""}
          onChange={(e) => update({ notes: e.target.value || undefined })}
        />
      </div>
    </div>
  );
}
