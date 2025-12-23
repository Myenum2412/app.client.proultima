import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePaginationParams, createPaginatedResponse } from "@/lib/api/pagination";
import { 
  getProjectById, 
  getDrawingLogByProject, 
  getDrawingsYetToReleaseByProject, 
  getDrawingsYetToReturnByProject,
  getInvoicesByProjectNumber,
  getSubmissionsByProject 
} from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

type SectionKey =
  | "drawings_yet_to_return"
  | "drawings_yet_to_release"
  | "drawing_log"
  | "invoice_history"
  | "upcoming_submissions"
  | "change_orders";

function isSectionKey(value: string | null): value is SectionKey {
  return (
    value === "drawings_yet_to_return" ||
    value === "drawings_yet_to_release" ||
    value === "drawing_log" ||
    value === "invoice_history" ||
    value === "upcoming_submissions" ||
    value === "change_orders"
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");
    const { page, pageSize } = parsePaginationParams(searchParams);

    if (!isSectionKey(section)) {
      return NextResponse.json({ message: "Invalid section" }, { status: 400 });
    }

    const supabase = await createSupabaseServerClient();
    
    // Fetch the project
    const project = await getProjectById(supabase, projectId);
    if (!project) {
      return NextResponse.json({ message: "Project not found" }, { status: 404 });
    }

    const jobNumber = project.project_number;

    if (
      section === "drawings_yet_to_return" ||
      section === "drawings_yet_to_release" ||
      section === "drawing_log"
    ) {
      let drawings;
      
      if (section === "drawing_log") {
        drawings = await getDrawingLogByProject(supabase, projectId);
      } else if (section === "drawings_yet_to_release") {
        drawings = await getDrawingsYetToReleaseByProject(supabase, projectId);
      } else {
        drawings = await getDrawingsYetToReturnByProject(supabase, projectId);
      }

      // Sort by latest submitted date (descending)
      drawings.sort((a, b) => {
        const dateA = new Date(a.latest_submitted_date || 0).getTime();
        const dateB = new Date(b.latest_submitted_date || 0).getTime();
        return dateB - dateA;
      });

      const mappedDrawings = drawings.map((d: any) => ({
        id: d.id,
        dwgNo: d.dwg || d.dwg_no,
        status: d.status || null,
        description: d.description || "",
        totalWeightTons: d.total_weight || d.total_weight_tons || 0,
        latestSubmittedDate: d.latest_submitted_date || "",
        releaseStatus: d.release_status || "",
        pdfPath: d.pdf_path || `/assets/${jobNumber}/Drawing-Log/${d.dwg || d.dwg_no}.pdf`,
      }));

      // Return paginated response
      const paginated = createPaginatedResponse(mappedDrawings, page, pageSize);
      return NextResponse.json(paginated);
    }

    if (section === "invoice_history") {
      // Filter invoices by project number
      const invoices = await getInvoicesByProjectNumber(supabase, project.project_number);

      // Sort by invoice number (descending)
      invoices.sort((a, b) => b.invoice_id.localeCompare(a.invoice_id));

      const mappedInvoices = invoices.map((inv) => ({
        id: inv.id,
        invoiceNo: inv.invoice_id,
        projectNo: inv.project_number,
        contractor: project.contractor_name,
        projectName: project.project_name,
        billedTonnage: inv.billed_tonnage || 0,
        unitPriceOrLumpSum: `$${inv.unit_price_lump_sum || 0}`,
        tonsBilledAmount: inv.tons_billed_amount || 0,
        billedHoursCo: inv.billed_hours_co || 0,
        coPrice: inv.co_price || 0,
        coBilledAmount: inv.co_billed_amount || 0,
        totalAmountBilled: inv.total_amount_billed || 0,
      }));

      // Return paginated response
      const paginated = createPaginatedResponse(mappedInvoices, page, pageSize);
      return NextResponse.json(paginated);
    }

    if (section === "upcoming_submissions") {
      // Filter submissions by project
      const submissions = await getSubmissionsByProject(supabase, projectId);

      // Sort by submission date (descending)
      submissions.sort((a, b) => {
        const dateA = new Date(a.submission_date || 0).getTime();
        const dateB = new Date(b.submission_date || 0).getTime();
        return dateB - dateA;
      });

      const mappedSubmissions = submissions.map((s) => ({
        id: s.id,
        proultimaPm: s.submitted_by || "PROULTIMA PM",
        jobNo: jobNumber,
        projectName: project.project_name,
        submissionType: s.submission_type,
        workDescription: s.work_description || "",
        drawingNo: s.drawing_number || "",
        submissionDate: s.submission_date,
      }));

      // Return paginated response
      const paginated = createPaginatedResponse(mappedSubmissions, page, pageSize);
      return NextResponse.json(paginated);
    }

    // change_orders - Return empty for now (not in current data)
    const mappedChangeOrders: any[] = [];

    // Return paginated response
    const paginated = createPaginatedResponse(mappedChangeOrders, page, pageSize);
    return NextResponse.json(paginated);
  } catch (error) {
    console.error("Error fetching project sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch project sections" },
      { status: 500 }
    );
  }
}
