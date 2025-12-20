import { type ReactNode } from "react";

export interface Project {
  id: number | string;
  supabaseId?: string; // Store original UUID from Supabase for API calls
  projectNumber: string;
  projectName: string;
  clientName: string;
  contractor: string;
  projectLocation: string;
  estimatedTonnage: number;
  detailingTonsPerApproval: number;
  detailingTonsPerLatestRevFFU: number;
  releasedTonsSoFar: number;
  completionPercentage: number;
  startDate: string;
  expectedDelivery: string;
  actualDelivery: string | null;
  status: {
    detailing: string;
    revision: string;
    release: string;
  };
  materialList: {
    totalItems: number;
    releasedItems: number;
    pendingItems: number;
    lastReleaseDate: string;
  };
  weightDetails: {
    drawing: string;
    rebarGrades: {
      grade: string;
      weight: number;
    }[];
    totalWeight: number;
  }[];
  invoices: {
    id: string;
    amount: number;
    date: string;
    status: string;
  }[];
  changeOrders: any[];
  meetings: any[];
  queries: any[];
  drawingsYetToReturn: {
    rebarGrade?: ReactNode;
    totalWeight?: any;
    dwg: string;
    status: string;
    description: string;
    releaseStatus: string;
    latestSubmittedDate: string;
    weeksSinceSent: string;
  }[];
  drawingsYetToRelease: {
    dwg: string;
    status: string;
    description: string;
    releaseStatus: string;
    latestSubmittedDate: string;
  }[];
  drawingLog?: {
    dwg: string;
    status: string;
    description: string;
    latestSubmittedDate: string;
    totalWeight: number;
    weeksSinceSent?: string;
    pdfPath?: string;
  }[];
}

