import type { Database } from "./database";

type Tables = Database["public"]["Tables"];

export type Restaurant = Tables["restaurants"]["Row"];
export type ReservationPlatform = Tables["reservation_platforms"]["Row"];
export type Wishlist = Tables["wishlist"]["Row"];
export type TravelDate = Tables["travel_dates"]["Row"];

export type WishlistWithRestaurant = Wishlist & {
  restaurant: Restaurant & {
    reservation_platforms: ReservationPlatform[];
  };
};

export type TravelDateWithWishlist = TravelDate & {
  wishlist: WishlistWithRestaurant;
};

export type UrgencyLevel =
  | "overdue"
  | "urgent"
  | "upcoming"
  | "watching"
  | "no_dates";

export type WishlistItemEnriched = Wishlist & {
  restaurant: Restaurant & {
    reservation_platforms: ReservationPlatform[];
  };
  travel_date_count: number;
  next_travel_date: string | null;
  next_reminder_date: string | null;
  next_party_size: number | null;
  urgency: UrgencyLevel;
  top_platform: ReservationPlatform | null;
};

export type WishlistFilters = {
  sort?: "reminder_date" | "name" | "cuisine" | "price" | "status";
  order?: "asc" | "desc";
  filter_status?: string;
  filter_cuisine?: string;
  filter_price_max?: number;
  search?: string;
};
