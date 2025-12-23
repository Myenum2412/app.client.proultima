import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Annotation, Layer } from "@/lib/pdf-annotations/types";

export const dynamic = "force-dynamic";

export async function POST(
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

    const formData = await request.formData();
    const annotationsJson = formData.get("annotations") as string;
    const pdfBlob = formData.get("pdfBlob") as File;
    const revisionNumber = formData.get("revisionNumber") as string;
    const revisionStatus = formData.get("revisionStatus") as string;

    if (!annotationsJson || !pdfBlob) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const annotations = JSON.parse(annotationsJson);

    // Save annotated PDF to storage (Supabase Storage)
    const fileName = `drawing-${drawingId}-rev-${revisionNumber || 1}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("drawings")
      .upload(fileName, pdfBlob, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { message: "Failed to upload annotated PDF" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("drawings").getPublicUrl(fileName);

    // Save annotations metadata
    const { error: annotationError } = await supabase
      .from("drawing_annotations")
      .insert({
        drawing_id: drawingId,
        annotations: annotations,
        pdf_url: publicUrl,
        revision_number: revisionNumber || 1,
        revision_status: revisionStatus || "REVISION",
        corrected_date: new Date().toISOString(),
        editor_id: user.id,
        editor_name: user.user_metadata?.full_name || user.email,
        created_at: new Date().toISOString(),
      });

    if (annotationError) {
      console.error("Annotation save error:", annotationError);
      return NextResponse.json(
        { message: "Failed to save annotations" },
        { status: 500 }
      );
    }

    // Update drawing log entry
    const { error: updateError } = await supabase
      .from("drawings")
      .update({
        revision_status: revisionStatus || "REVISION",
        revision_number: revisionNumber || 1,
        corrected_date: new Date().toISOString(),
        editor_id: user.id,
        editor_name: user.user_metadata?.full_name || user.email,
        pdf_path: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", drawingId);

    if (updateError) {
      console.error("Update error:", updateError);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      message: "Drawing corrections saved successfully",
      pdfUrl: publicUrl,
      revisionNumber: revisionNumber || 1,
    });
  } catch (error) {
    console.error("Error saving annotations:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function GET(
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

    // Get latest annotations for this drawing
    const { data, error } = await supabase
      .from("drawing_annotations")
      .select("*")
      .eq("drawing_id", drawingId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" which is okay
      console.error("Error fetching annotations:", error);
      return NextResponse.json(
        { message: "Failed to fetch annotations" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      annotations: data?.annotations || [],
      pdfUrl: data?.pdf_url || null,
      revisionNumber: data?.revision_number || 0,
    });
  } catch (error) {
    console.error("Error fetching annotations:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

