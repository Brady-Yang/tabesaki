export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type CuisineType =
  | "Omakase Sushi"
  | "Kaiseki"
  | "Tempura"
  | "Soba/Kappo"
  | "Teppanyaki"
  | "Yakiniku"
  | "Other";

export type PlatformType =
  | "Omakase.in"
  | "TableCheck"
  | "Pocket Concierge"
  | "TableAll"
  | "Tabelog"
  | "Ikyu"
  | "Other";

export type AdvanceType = "rolling" | "fixed_calendar";

export type TravelDateStatus =
  | "Watching"
  | "Booking Soon"
  | "Booked"
  | "Visited"
  | "Missed";

export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          google_place_id: string | null;
          name: string;
          address: string | null;
          cuisine: CuisineType | null;
          website: string | null;
          phone: string | null;
          price_range_min: number | null;
          price_range_max: number | null;
          price_notes: string | null;
          closed_days_of_week: number[] | null;
          ai_extracted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          google_place_id?: string | null;
          name: string;
          address?: string | null;
          cuisine?: CuisineType | null;
          website?: string | null;
          phone?: string | null;
          price_range_min?: number | null;
          price_range_max?: number | null;
          price_notes?: string | null;
          closed_days_of_week?: number[] | null;
          ai_extracted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          google_place_id?: string | null;
          name?: string;
          address?: string | null;
          cuisine?: CuisineType | null;
          website?: string | null;
          phone?: string | null;
          price_range_min?: number | null;
          price_range_max?: number | null;
          price_notes?: string | null;
          closed_days_of_week?: number[] | null;
          ai_extracted_at?: string | null;
        };
        Relationships: [];
      };
      reservation_platforms: {
        Row: {
          id: string;
          restaurant_id: string;
          website: PlatformType;
          url: string | null;
          priority: number;
          advance_type: AdvanceType | null;
          advance_days: number | null;
          open_day_of_month: number | null;
          open_months_prior: number | null;
          booking_open_hour: number | null;
          booking_open_minute: number | null;
          booking_open_tz: string | null;
          course_price: number | null;
          course_description: string | null;
          notes: string | null;
          ai_extracted: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          website: PlatformType;
          url?: string | null;
          priority?: number;
          advance_type?: AdvanceType | null;
          advance_days?: number | null;
          open_day_of_month?: number | null;
          open_months_prior?: number | null;
          booking_open_hour?: number | null;
          booking_open_minute?: number | null;
          booking_open_tz?: string | null;
          course_price?: number | null;
          course_description?: string | null;
          notes?: string | null;
          ai_extracted?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          website?: PlatformType;
          url?: string | null;
          priority?: number;
          advance_type?: AdvanceType | null;
          advance_days?: number | null;
          open_day_of_month?: number | null;
          open_months_prior?: number | null;
          booking_open_hour?: number | null;
          booking_open_minute?: number | null;
          booking_open_tz?: string | null;
          course_price?: number | null;
          course_description?: string | null;
          notes?: string | null;
          ai_extracted?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "reservation_platforms_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      wishlist: {
        Row: {
          id: string;
          user_id: string;
          restaurant_id: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          restaurant_id: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "wishlist_restaurant_id_fkey";
            columns: ["restaurant_id"];
            isOneToOne: false;
            referencedRelation: "restaurants";
            referencedColumns: ["id"];
          }
        ];
      };
      travel_dates: {
        Row: {
          id: string;
          wishlist_id: string;
          desired_date: string;
          priority: number;
          party_size: number;
          status: TravelDateStatus;
          booking_reminder_datetime: string | null;
          booked_at: string | null;
          confirmation_notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          wishlist_id: string;
          desired_date: string;
          priority?: number;
          party_size?: number;
          status?: TravelDateStatus;
          booking_reminder_datetime?: string | null;
          booked_at?: string | null;
          confirmation_notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          desired_date?: string;
          priority?: number;
          party_size?: number;
          status?: TravelDateStatus;
          booking_reminder_datetime?: string | null;
          booked_at?: string | null;
          confirmation_notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "travel_dates_wishlist_id_fkey";
            columns: ["wishlist_id"];
            isOneToOne: false;
            referencedRelation: "wishlist";
            referencedColumns: ["id"];
          }
        ];
      };
      push_tokens: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          updated_at?: string;
        };
        Update: {
          token?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      cuisine_type: CuisineType;
      platform_type: PlatformType;
      advance_type: AdvanceType;
      travel_date_status: TravelDateStatus;
    };
  };
};

export interface PlaceCandidate {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  ratingCount?: number;
  isPermanentlyClosed: boolean;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  ratingCount?: number;
  mapsUrl: string;
  closedDaysOfWeek?: number[] | null;
}

export interface ExtractedPlatform {
  website: PlatformType;
  url?: string;
  priority: number;
  advance_type?: AdvanceType;
  advance_days?: number;
  open_day_of_month?: number;
  open_months_prior?: number;
  booking_open_hour?: number;
  booking_open_minute?: number;
  booking_open_tz?: string;
  course_price?: number;
  course_description?: string;
  notes?: string;
  ai_extracted: boolean;
}

export interface ExtractionResult {
  platforms: ExtractedPlatform[];
  closed_days_of_week: number[] | null;
  price_range_min?: number;
  price_range_max?: number;
  price_notes?: string;
  extraction_notes?: string;
}
