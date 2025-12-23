import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePaginationParams, createPaginatedResponse } from "@/lib/api/pagination";
import { getSubmissions } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export type SubmissionRow = {
  id: string;
  proultimaPm: string;
  jobNo: string;
  projectName: string;
  submissionType: string;
  workDescription: string;
  drawingNo: string;
  submissionDate: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = parsePaginationParams(searchParams);
    
    const supabase = await createSupabaseServerClient();
    
    // Fetch submissions with project data
    const submissions = await getSubmissions(supabase);

    // Map submissions to the expected format
    const submissionRows: SubmissionRow[] = (submissions || []).map((s: any) => {
      const project = s.projects as any;
      return {
        id: s.id,
        proultimaPm: s.submitted_by || "PROULTIMA PM",
        jobNo: project?.project_number ?? "",
        projectName: project?.project_name ?? "",
        submissionType: s.submission_type,
        workDescription: s.work_description || "",
        drawingNo: s.drawing_number || "",
        submissionDate: s.submission_date,
      };
    });

    // Return paginated response
    const paginated = createPaginatedResponse(submissionRows, page, pageSize);
    return NextResponse.json(paginated);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}

