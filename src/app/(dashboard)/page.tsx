import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">My Wishlist</h1>
      <div className="mt-16 flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          Add your first restaurant to get started
        </p>
        <Button>Add Restaurant</Button>
      </div>
    </div>
  );
}
