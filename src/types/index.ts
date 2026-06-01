import type { Database, ReservationStatus, ReservationWebsite } from "./database";

export type { ReservationStatus, ReservationWebsite };

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
  wishlist: WishlistWithRestaurant[];
};
