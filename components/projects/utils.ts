import type { Project } from "./types";
import type { MaterialListBlock } from "./material-list-management-card";

/**
 * Convert Supabase project to the format expected by this component
 * 🚀 OPTIMIZATION: Removed heavy dummy data generation from here
 * Dummy data is now loaded lazily when the component needs it
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
    supabaseId: typeof dbProject.id === 'string' ? dbProject.id : dbProject.id?.toString(),
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
    drawingsYetToReturn: [],
    drawingsYetToRelease: [],
    drawingLog: [],
    // 🚀 OPTIMIZATION: Lazy load this data only when MaterialListManagementCard is rendered
    materialListManagement: undefined, // Will be loaded lazily
  };
}

/**
 * Generate dummy material list management data for demonstration
 * 🚀 OPTIMIZATION: Exported for lazy loading
 */
export function getDummyMaterialListManagement(): MaterialListBlock[] {
  return [
    {
      id: "block-1",
      heading: "Foundation Rebar - Phase 1",
      status: "released",
      priority: "High",
      note: "All foundation rebar materials have been approved and released for Phase 1 construction.",
      barList: [
        {
          id: "row-1",
          dwgNo: "F-101",
          releaseDescription: "Foundation Wall Reinforcement - East Side",
          ctrlCode: "CTRL-001",
          relNo: 1,
          weightLbs: 12500,
          date: "2024-01-15",
          varyingBars: "#4, #5, #6",
          remarks: "Approved for field use",
        },
        {
          id: "row-2",
          dwgNo: "F-102",
          releaseDescription: "Foundation Wall Reinforcement - West Side",
          ctrlCode: "CTRL-002",
          relNo: 1,
          weightLbs: 11800,
          date: "2024-01-15",
          varyingBars: "#4, #5",
          remarks: "Approved for field use",
        },
        {
          id: "row-3",
          dwgNo: "F-103",
          releaseDescription: "Footing Reinforcement - Main Building",
          ctrlCode: "CTRL-003",
          relNo: 2,
          weightLbs: 15200,
          date: "2024-01-20",
          varyingBars: "#5, #6, #7",
          remarks: "Revision 2 - Approved",
        },
        {
          id: "row-4",
          dwgNo: "F-104",
          releaseDescription: "Foundation Column Reinforcement",
          ctrlCode: "CTRL-004",
          relNo: 1,
          weightLbs: 8900,
          date: "2024-01-18",
          varyingBars: "#6, #8",
          remarks: "Standard approval",
        },
      ],
      additionalFields: [
        {
          id: "field-1",
          label: "Total Weight",
          value: "48,400 LBS",
        },
        {
          id: "field-2",
          label: "Accessories",
          value: "View Details",
        },
        {
          id: "field-3",
          label: "Couplers & Form Savers",
          value: "View Details",
        },
        {
          id: "field-4",
          label: "Release Date",
          value: "2024-01-20",
        },
      ],
    },
    {
      id: "block-2",
      heading: "Structural Frame - Level 1",
      status: "under_review",
      priority: "Medium",
      note: "Currently under review by engineering team. Expected approval within 2-3 business days.",
      barList: [
        {
          id: "row-5",
          dwgNo: "S-201",
          releaseDescription: "Beam Reinforcement - Level 1 North",
          ctrlCode: "CTRL-005",
          relNo: 1,
          weightLbs: 14200,
          date: "2024-02-05",
          varyingBars: "#6, #8, #10",
          remarks: "Pending review",
        },
        {
          id: "row-6",
          dwgNo: "S-202",
          releaseDescription: "Column Reinforcement - Level 1",
          ctrlCode: "CTRL-006",
          relNo: 1,
          weightLbs: 16800,
          date: "2024-02-05",
          varyingBars: "#8, #10, #11",
          remarks: "Pending review",
        },
        {
          id: "row-7",
          dwgNo: "S-203",
          releaseDescription: "Slab Reinforcement - Level 1",
          ctrlCode: "CTRL-007",
          relNo: 1,
          weightLbs: 22100,
          date: "2024-02-08",
          varyingBars: "#4, #5",
          remarks: "Initial submission",
        },
      ],
      additionalFields: [
        {
          id: "field-5",
          label: "Total Weight",
          value: "53,100 LBS",
        },
        {
          id: "field-6",
          label: "Accessories",
          value: "View Details",
        },
        {
          id: "field-7",
          label: "Status",
          value: "Under Review",
        },
        {
          id: "field-8",
          label: "Submitted Date",
          value: "2024-02-08",
        },
      ],
    },
    {
      id: "block-3",
      heading: "Structural Frame - Level 2",
      status: "released",
      priority: "High",
      barList: [
        {
          id: "row-8",
          dwgNo: "S-301",
          releaseDescription: "Beam Reinforcement - Level 2",
          ctrlCode: "CTRL-008",
          relNo: 1,
          weightLbs: 13800,
          date: "2024-02-15",
          varyingBars: "#6, #8",
          remarks: "Approved",
        },
        {
          id: "row-9",
          dwgNo: "S-302",
          releaseDescription: "Column Reinforcement - Level 2",
          ctrlCode: "CTRL-009",
          relNo: 2,
          weightLbs: 15600,
          date: "2024-02-18",
          varyingBars: "#8, #10",
          remarks: "Revision 2 - Approved",
        },
      ],
      additionalFields: [
        {
          id: "field-9",
          label: "Total Weight",
          value: "29,400 LBS",
        },
        {
          id: "field-10",
          label: "Accessories",
          value: "View Details",
        },
        {
          id: "field-11",
          label: "Couplers & Form Savers",
          value: "View Details",
        },
        {
          id: "field-12",
          label: "Release Date",
          value: "2024-02-18",
        },
      ],
    },
  ];
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

