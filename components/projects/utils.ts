import type { Project } from "./types";

/**
 * Convert Supabase project to the format expected by this component
 */
export function convertSupabaseProject(dbProject: any): Project {
  // Generate a numeric ID from UUID if needed, or use the string ID
  const numericId = dbProject.id
    ? typeof dbProject.id === "string"
      ? parseInt(dbProject.id.replace(/-/g, "").substring(0, 10), 16) ||
        Date.now()
      : dbProject.id
    : Date.now();

  const estimatedTons = dbProject.estimatedTons || 0;
  const detailedTonsPerApproval = dbProject.detailedTonsPerApproval || 0;
  const detailedTonsPerLatestRev = dbProject.detailedTonsPerLatestRev || 0;
  const releasedTons = dbProject.releasedTons || 0;

  const completionPercentage =
    estimatedTons > 0
      ? Math.round((detailedTonsPerApproval / estimatedTons) * 100)
      : 0;

  return {
    id: numericId,
    supabaseId: typeof dbProject.id === 'string' ? dbProject.id : dbProject.id?.toString(), // Store original UUID for API calls
    projectNumber: dbProject.projectNumber || dbProject.jobNumber || dbProject.projectName || "",
    projectName: dbProject.projectName || "",
    clientName: dbProject.clientName || "PSG",
    contractor: dbProject.contractorName || "TBD",
    projectLocation: dbProject.projectLocation || "TBD",
    estimatedTonnage: estimatedTons,
    detailingTonsPerApproval: detailedTonsPerApproval,
    detailingTonsPerLatestRevFFU: detailedTonsPerLatestRev,
    releasedTonsSoFar: releasedTons,
    completionPercentage: completionPercentage,
    startDate: dbProject.createdAt
      ? new Date(dbProject.createdAt).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    expectedDelivery: dbProject.dueDate
      ? new Date(dbProject.dueDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    actualDelivery: null,
    status: {
      detailing: dbProject.detailingStatus || "IN PROCESS",
      revision: dbProject.revisionStatus || "IN PROCESS",
      release: dbProject.releaseStatus || "IN PROCESS",
    },
    materialList: {
      totalItems: 0,
      releasedItems: 0,
      pendingItems: 0,
      lastReleaseDate: new Date().toISOString().split("T")[0],
    },
    weightDetails: [],
    invoices: [],
    changeOrders: [],
    meetings: [],
    queries: [],
    drawingsYetToReturn: [], // Empty array - tables will fetch from Supabase when projectId is provided
    drawingsYetToRelease: [], // Empty array - tables will fetch from Supabase when projectId is provided
    drawingLog: [], // Empty array - tables will fetch from Supabase when projectId is provided
  };
}

export function getStatusColor(status: string): string {
  if (status.includes("COMPLETED")) return "bg-green-500";
  if (status.includes("IN PROCESS")) return "bg-yellow-500";
  if (status.includes("PENDING") || status.includes("ON HOLD"))
    return "bg-yellow-500";
  if (status.includes("NOT STARTED")) return "bg-gray-500";
  return "bg-gray-500";
}

export function getInvoiceStatusColor(status: string): string {
  switch (status) {
    case "Paid":
      return "bg-green-500";
    case "Pending":
      return "bg-yellow-500";
    case "Overdue":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

export function getChangeOrderStatusColor(status: string): string {
  switch (status) {
    case "Approved":
      return "bg-green-500";
    case "Under Review":
      return "bg-yellow-500";
    case "Rejected":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

