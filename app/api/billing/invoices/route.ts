import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePaginationParams, createPaginatedResponse } from "@/lib/api/pagination";
import { getInvoices, getProjects } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page = 1, pageSize = 20 } = parsePaginationParams(searchParams);

    const supabase = await createSupabaseServerClient();
    
    // Fetch invoices and projects
    const [invoices, projects] = await Promise.all([
      getInvoices(supabase),
      getProjects(supabase),
    ]);

    // Create project lookup map by project number
    const projectByNumber = new Map();
    for (const p of projects) {
      projectByNumber.set(p.project_number, p);
    }

    // Map invoices to the expected format
    const invoiceRows = invoices.map((inv) => {
      const proj = projectByNumber.get(inv.project_number);
      return {
        id: inv.id,
        invoiceNo: inv.invoice_id,
        projectNo: inv.project_number,
        contractor: proj?.contractor_name ?? "",
        projectName: inv.project_name,
        billedTonnage: inv.billed_tonnage || 0,
        unitPriceOrLumpSum: `$${inv.unit_price_lump_sum || 0}`,
        tonsBilledAmount: inv.tons_billed_amount || 0,
        billedHoursCo: inv.billed_hours_co || 0,
        coPrice: inv.co_price || 0,
        coBilledAmount: inv.co_billed_amount || 0,
        totalAmountBilled: inv.total_amount_billed || 0,
        status: inv.status || "Draft", // Add status field
      };
    });

    // Return paginated response
    const paginated = createPaginatedResponse(invoiceRows, page, pageSize);
    return NextResponse.json(paginated);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}


