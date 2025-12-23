import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export type ReleaseStatus = "Partially Released" | "Yet to Be Released";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ drawingId: string }> }
) {
  try {
    const { drawingId } = await params;
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { releaseStatus } = body;

    if (!releaseStatus || (releaseStatus !== "Partially Released" && releaseStatus !== "Yet to Be Released")) {
      return NextResponse.json(
        { message: "Invalid release status. Must be 'Partially Released' or 'Yet to Be Released'" },
        { status: 400 }
      );
    }

    // Update drawing release status
    const { error } = await supabase
      .from("drawings")
      .update({
        release_status: releaseStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", drawingId);

    if (error) {
      console.error("Error updating release status:", error);
      return NextResponse.json(
        { message: "Failed to update release status" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Release status updated successfully",
      releaseStatus,
    });
  } catch (error) {
    console.error("Error updating release status:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

