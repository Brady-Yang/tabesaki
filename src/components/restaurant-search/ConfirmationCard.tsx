"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExternalLink, Globe, MapPin, Phone } from "lucide-react";
import type { PlaceDetails } from "@/types/database";

interface ConfirmationCardProps {
  details: PlaceDetails;
  onConfirm: () => void;
  onBack: () => void;
}

export function ConfirmationCard({
  details,
  onConfirm,
  onBack,
}: ConfirmationCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{details.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{details.address}</span>
          </div>
          {details.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{details.phone}</span>
            </div>
          )}
          {details.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a
                href={details.website}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-blue-600 hover:underline"
              >
                {details.website}
              </a>
            </div>
          )}
          <a
            href={details.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            View on Google Maps
          </a>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        Is this the right restaurant? Confirming will trigger AI extraction of
        reservation info from the website.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button onClick={onConfirm} className="flex-1">
          Confirm &amp; Extract
        </Button>
      </div>
    </div>
  );
}
