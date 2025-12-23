import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getMaterialListsByProject } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    const supabase = await createSupabaseServerClient();
    
    // Fetch material lists with related data from Supabase
    const materialLists = await getMaterialListsByProject(supabase, projectId);

    const blocks = (materialLists || []).map((ml: any) => ({
      id: ml.id,
      heading: ml.heading,
      status: ml.status,
      priority: ml.priority,
      note: ml.note ?? undefined,
      barList: (ml.bar_items || []).map((item: any) => ({
        id: item.id,
        dwgNo: item.dwg_no,
        releaseDescription: item.release_description,
        ctrlCode: item.ctrl_code,
        relNo: item.rel_no,
        weightLbs: item.weight_lbs,
        date: item.date,
        varyingBars: item.varying_bars,
        remarks: item.remarks,
      })),
      additionalFields: (ml.fields || []).map((field: any) => ({
        id: field.id,
        label: field.label,
        value: field.value,
      })),
    }));

    return NextResponse.json({ title: "Material List Management", blocks });
  } catch (error) {
    console.error("Error fetching material lists:", error);
    return NextResponse.json(
      { error: "Failed to fetch material lists" },
      { status: 500 }
    );
  }
}


