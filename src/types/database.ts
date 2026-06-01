export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      restaurants: {
        Row: {
          id: string;
          name: string;
          name_ja: string | null;
          address: string | null;
          city: string | null;
          prefecture: string | null;
          cuisine_type: string | null;
          price_min: number | null;
          price_max: number | null;
          google_place_id: string | null;
          image_url: string | null;
          website_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_ja?: string | null;
          address?: string | null;
          city?: string | null;
          prefecture?: string | null;
          cuisine_type?: string | null;
          price_min?: number | null;
          price_max?: number | null;
          google_place_id?: string | null;
          image_url?: string | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          name_ja?: string | null;
          address?: string | null;
          city?: string | null;
          prefecture?: string | null;
          cuisine_type?: string | null;
          price_min?: number | null;
          price_max?: number | null;
          google_place_id?: string | null;
          image_url?: string | null;
          website_url?: string | null;
          updated_at?: string;
        };
      };
      reservation_platforms: {
        Row: {
          id: string;
          restaurant_id: string;
          website: ReservationWebsite;
          url: string | null;
          booking_window_days: number | null;
          booking_opens_time: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          restaurant_id: string;
          website: ReservationWebsite;
          url?: string | null;
          booking_window_days?: number | null;
          booking_opens_time?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          website?: ReservationWebsite;
          url?: string | null;
          booking_window_days?: number | null;
          booking_opens_time?: string | null;
          notes?: string | null;
        };
      };
      wishlist: {
        Row: {
          id: string;
          user_id: string;
          restaurant_id: string;
          travel_date_id: string | null;
          status: ReservationStatus;
          notes: string | null;
          priority: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          restaurant_id: string;
          travel_date_id?: string | null;
          status?: ReservationStatus;
          notes?: string | null;
          priority?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          restaurant_id?: string;
          travel_date_id?: string | null;
          status?: ReservationStatus;
          notes?: string | null;
          priority?: number | null;
          updated_at?: string;
        };
      };
      travel_dates: {
        Row: {
          id: string;
          user_id: string;
          name: string | null;
          start_date: string;
          end_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string | null;
          start_date: string;
          end_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          start_date?: string;
          end_date?: string;
          updated_at?: string;
        };
      };
    };
    Enums: {
      reservation_status: ReservationStatus;
      reservation_website: ReservationWebsite;
    };
  };
};

export type ReservationStatus =
  | "wishlist"
  | "booking_open"
  | "booked"
  | "visited"
  | "cancelled";

export type ReservationWebsite =
  | "tableall"
  | "ikyu"
  | "omakase"
  | "tablecheck"
  | "pocket_concierge"
  | "direct"
  | "other";
