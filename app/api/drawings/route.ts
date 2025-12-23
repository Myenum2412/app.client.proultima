import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePaginationParams, createPaginatedResponse } from "@/lib/api/pagination";
import { getAllDrawingLogs, getAllDrawingsYetToRelease, getAllDrawingsYetToReturn, calculateWeeksSince } from "@/lib/supabase/queries";

export const dynamic = "force-dynamic";

export type DrawingRow = {
  id: string;
  dwgNo: string;
  status: "APP" | "REV" | "REJ" | "PND" | "FFU";
  description: string;
  totalWeightTons: number;
  latestSubmittedDate: string; // ISO or display string
  weeksSinceSent: number;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize } = parsePaginationParams(searchParams);

    const supabase = await createSupabaseServerClient();
    
    // Fetch all drawings from all three tables
    const [drawingLogs, yetToRelease, yetToReturn] = await Promise.all([
      getAllDrawingLogs(supabase),
      getAllDrawingsYetToRelease(supabase),
      getAllDrawingsYetToReturn(supabase),
    ]);

    // Map status to valid DrawingRow status
    const statusMap: Record<string, DrawingRow["status"]> = {
      "APP": "APP",
      "R&R": "REV",
      "REV": "REV",
      "REJ": "REJ",
      "PND": "PND",
      "FFU": "FFU",
    };

    // Combine all drawings
    const rows: DrawingRow[] = [
      ...drawingLogs.map((d) => ({
        id: d.id,
        dwgNo: d.dwg,
        status: d.status ? (statusMap[d.status] ?? "PND") : "PND",
        description: d.description || "",
        totalWeightTons: d.total_weight || 0,
        latestSubmittedDate: d.latest_submitted_date || "",
        weeksSinceSent: calculateWeeksSince(d.latest_submitted_date),
      })),
      ...yetToRelease.map((d) => ({
        id: d.id,
        dwgNo: d.dwg_no,
        status: "FFU" as const,
        description: d.description || "",
        totalWeightTons: d.total_weight_tons || 0,
        latestSubmittedDate: d.latest_submitted_date || "",
        weeksSinceSent: calculateWeeksSince(d.latest_submitted_date),
      })),
      ...yetToReturn.map((d) => ({
        id: d.id,
        dwgNo: d.dwg_no,
        status: "PND" as const,
        description: d.description || "",
        totalWeightTons: d.total_weight_tons || 0,
        latestSubmittedDate: d.latest_submitted_date || "",
        weeksSinceSent: calculateWeeksSince(d.latest_submitted_date),
      })),
    ];

    // Sort by latest submitted date (descending)
    rows.sort((a, b) => {
      const dateA = new Date(a.latestSubmittedDate).getTime();
      const dateB = new Date(b.latestSubmittedDate).getTime();
      return dateB - dateA;
    });

    // Return paginated response
    const paginated = createPaginatedResponse(rows, page, pageSize);
    return NextResponse.json(paginated);
  } catch (error) {
    console.error("Error fetching drawings:", error);
    return NextResponse.json(
      { error: "Failed to fetch drawings" },
      { status: 500 }
    );
  }
}


