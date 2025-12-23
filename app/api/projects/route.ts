import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getProjects } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export type ProjectsListItem = {
  id: string;
  jobNumber: string;
  name: string;
  estimatedTons?: number | null;
  releasedTons?: number | null;
  detailingStatus?: string | null;
  revisionStatus?: string | null;
  releaseStatus?: string | null;
};

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    
    // Fetch projects from Supabase
    const projects = await getProjects(supabase);

    const items: ProjectsListItem[] = projects.map((p) => ({
      id: p.id,
      jobNumber: p.project_number,
      name: p.project_name,
      estimatedTons: p.estimated_tons,
      releasedTons: p.released_tons,
      detailingStatus: p.detailing_status,
      revisionStatus: p.revision_status,
      releaseStatus: p.release_status,
    }));

    return NextResponse.json(items);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}


