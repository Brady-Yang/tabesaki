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

export type WishlistItemEnriched = Wishlist & {
  restaurant: Restaurant & {
    reservation_platforms: ReservationPlatform[];
  };
  travel_date_count: number;
  next_reminder: string | null;
};
