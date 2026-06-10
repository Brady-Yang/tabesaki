import { createClient } from "@/lib/supabase/server";
import type { TravelDateStatus, Database } from "@/types/database";

type TravelDateUpdate = Database["public"]["Tables"]["travel_dates"]["Update"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await request.json()) as {
    status?: TravelDateStatus;
    confirmation_notes?: string | null;
    booked_at?: string | null;
    priority?: number;
  };

  const update: TravelDateUpdate = {};
  if (body.status !== undefined) update.status = body.status;
  if (body.confirmation_notes !== undefined)
    update.confirmation_notes = body.confirmation_notes;
  if (body.booked_at !== undefined) update.booked_at = body.booked_at;
  if (body.priority !== undefined) update.priority = body.priority;

  if (Object.keys(update).length === 0)
    return Response.json({ error: "No fields to update" }, { status: 400 });

  const { data, error } = await supabase
    .from("travel_dates")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505")
      return Response.json(
        { error: "That priority is already taken for this wishlist item" },
        { status: 409 }
      );
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ date: data });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const { error } = await supabase
    .from("travel_dates")
    .delete()
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return new Response(null, { status: 204 });
}
