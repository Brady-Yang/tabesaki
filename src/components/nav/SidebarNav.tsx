"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, UtensilsCrossed, Calendar, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "My Wishlist", icon: Heart },
  { href: "/restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { href: "/travel-dates", label: "Travel Dates", icon: Calendar },
];

export function SidebarNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-zinc-200 bg-white px-4 py-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex">
      <div className="mb-8 px-2">
        <span className="text-base font-semibold tracking-tight">Tabesaki</span>
        <p className="mt-0.5 text-xs text-muted-foreground">食べ先</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="mb-3 truncate px-2 text-xs text-muted-foreground">{email}</p>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-zinc-500"
          onClick={handleSignOut}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}
