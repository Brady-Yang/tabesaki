import { redirect } from "next/navigation";
import { getUser } from "@/lib/supabase/auth";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { BottomNav } from "@/components/nav/BottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <SidebarNav email={user.email ?? ""} />
      <main className="flex-1 pb-16 md:pb-0 md:pl-60">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</div>
      </main>
      <BottomNav />
    </div>
  );
}
