/**
 * Local Demo Data Assets - REFERENCE ONLY
 * 
 * ⚠️ IMPORTANT: This file is now FOR REFERENCE ONLY
 * All data is now stored in and fetched from Supabase database.
 * 
 * This file has been migrated to Supabase and is kept as:
 * - Reference documentation for data structure
 * - Backup of original demo data
 * - Type inference for TypeScript
 * 
 * See:
 * - Database schema: supabase/migrations/001_unified_schema.sql
 * - Seed data: supabase/migrations/002_seed_data.sql
 * - Query functions: lib/supabase/queries.ts
 * - Type definitions: lib/database.types.ts
 */

// ============================================================================
// PROJECTS DATA
// ============================================================================
export const demoProjects = [
  {
    jobNumber: "U2524",
    name: "Valley View Business Park Tilt Panels",
    fabricatorName: "RE-STEEL",
    contractorName: "T&T CONSTRUCTION",
    location: "JESSUP, PA",
    estimatedTons: 398.9,
    detailingStatus: "COMPLETED",
    revisionStatus: "COMPLETED",
    releaseStatus: "RELEASED COMPLETELY",
  },  
  {
    jobNumber: "U2532",
    name: "MID-WAY SOUTH LOGISTIC CENTER, PANELS",
    fabricatorName: "RE-STEEL",
    contractorName: "T&T CONSTRUCTION",
    location: "BETHEL, PA",
    estimatedTons: 189,
    detailingStatus: "IN PROCESS",
    revisionStatus: "IN PROCESS",
    releaseStatus: "IN PROCESS",
  },  
  {
    jobNumber: "U3223P",
    name: "PANATTONI LEHIGH 309 BUILDING B TILT PANELS",
    fabricatorName: "RE-STEEL",
    contractorName: "FORCINE CONCRETE",
    location: "UPPER SAUCON TWP, PA",
    
    estimatedTons: 412.5,
    detailingStatus: "COMPLETED",
    revisionStatus: "IN PROCESS",
    releaseStatus: "IN PROCESS",
  }, 
] as const;

// ============================================================================
// DRAWINGS DATA
// ============================================================================
export const demoDrawings = [
  // Drawings Yet to Return
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-1",
      status: "FFU",
      description: "FOUNDATION PANELS F1 TO F4",
      totalWeightTons: 12.32,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
    },
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-2",
      status: "FFU",
      description: "FOUNDATION PANELS F5 TO F8",
      totalWeightTons: 12.31,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
    },
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-3",
      status: "FFU",
      description: "NORTH WALL PANELS N1 TO N4",
      totalWeightTons: 14.89,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
    },
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-4",
      status: "FFU",
      description: "NORTH WALL PANELS N1 TO N8",
      totalWeightTons: 17.77,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
    },
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-5",
      status: "FFU",
      description: "NORTH WALL PANELS N9 TO N15",
      totalWeightTons: 19.70,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
    },
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-6",
      status: "FFU",
      description: "NORTH WALL PANELS N16 TO N22",
      totalWeightTons: 14.59,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
    },
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-7",
      status: "FFU",
      description: "NORTH WALL PANELS N23 TO N29",
      totalWeightTons: 18.99,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
    },
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-8",
      status: "FFU",
      description: "NORTH WALL PANELS N30 TO N36",
      totalWeightTons: 18.50,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
    },
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-9",
      status: "FFU",
      description: "NORTH WALL PANELS N37 TO N43",
      totalWeightTons: 15.53,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
    },
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-10",
      status: "FFU",
      description: "NORTH WALL PANELS N44 TO N50",
      totalWeightTons: 19.68,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
    },
  
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-11",
      status: "FFU",
      description: "NORTH WALL PANELS N51 TO N58",
      totalWeightTons: 18.10,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
    },
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-12",
      status: "FFU",
      description: "NORTH WALL PANELS N59 TO N66",
      totalWeightTons: 21.96,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
    },
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-13",
      status: "FFU",
      description: "NORTH WALL PANELS N67 TO N73",
      totalWeightTons: 15.54,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
    },
  
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-14",
      status: "FFU",
      description: "SOUTH WALL PANELS S1 TO S6",
      totalWeightTons: 20.41,
      latestSubmittedDate: "2019-09-28",
      releaseStatus: "Released",
    },
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-15",
      status: "FFU",
      description: "SOUTH WALL PANELS S7 TO S14",
      totalWeightTons: 19.88,
      latestSubmittedDate: "2019-09-28",
      releaseStatus: "Released",
    },
    {
      jobNumber: "U2524",
      section: "released_drawings",
      dwgNo: "R-16",
      status: "FFU",
      description: "WEST WALL PANELS W9 TO W16",
      totalWeightTons: 17.57,
      latestSubmittedDate: "2019-09-19",
      releaseStatus: "Released",
    },
  
    {
      jobNumber: "U2524",
      section: "drawings_yet_to_return",
      dwgNo: "R-17",
      status: "APP/R&R",
      description: "WEST WALL PANELS W17 TO W24",
      totalWeightTons: 18.42,
      latestSubmittedDate: "2019-11-02",
      releaseStatus: "Pending",
    },
  
    {
      jobNumber: "U2524",
      section: "drawings_yet_to_return",
      dwgNo: "R-18",
      status: "APP/R&R",
      description: "EAST WALL PANELS E1 TO E8",
      totalWeightTons: 21.11,
      latestSubmittedDate: "2019-11-02",
      releaseStatus: "Pending",
    },
  
    {
      jobNumber: "U2524",
      section: "drawings_yet_to_return",
      dwgNo: "R-19",
      status: "APP/R&R",
      description: "EAST WALL PANELS E9 TO E16",
      totalWeightTons: 20.96,
      latestSubmittedDate: "2019-11-02",
      releaseStatus: "Pending",
    },
  
    {
      jobNumber: "U2524",
      section: "drawings_yet_to_return",
      dwgNo: "R-20",
      status: "APP/R&R",
      description: "EAST WALL PANELS E17 TO E24",
      totalWeightTons: 19.84,
      latestSubmittedDate: "2019-11-02",
      releaseStatus: "Pending",
    },
  
    {
      jobNumber: "U2524",
      section: "drawings_yet_to_return",
      dwgNo: "R-21",
      status: "APP/R&R",
      description: "ROOF PANELS RP1 TO RP6",
      totalWeightTons: 22.05,
      latestSubmittedDate: "2019-11-10",
      releaseStatus: "Pending",
    },
  
    {
      jobNumber: "U2524",
      section: "drawings_yet_to_return",
      dwgNo: "R-22",
      status: "APP/R&R",
      description: "ROOF PANELS RP7 TO RP12",
      totalWeightTons: 21.78,
      latestSubmittedDate: "2019-11-10",
      releaseStatus: "Pending",
    },
  
    {
      jobNumber: "U2524",
      section: "drawings_yet_to_return",
      dwgNo: "R-23",
      status: "APP/R&R",
      description: "ROOF PANELS RP13 TO RP18",
      totalWeightTons: 22.31,
      latestSubmittedDate: "2019-11-10",
      releaseStatus: "Pending",
    },
  
    {
      jobNumber: "U2524",
      section: "drawings_yet_to_return",
      dwgNo: "R-24",
      status: "APP/R&R",
      description: "ROOF PANELS RP19 TO RP24",
      totalWeightTons: 21.64,
      latestSubmittedDate: "2019-11-10",
      releaseStatus: "Pending",
    },
  
    {
      jobNumber: "U2524",
      section: "drawings_yet_to_return",
      dwgNo: "R-25",
      status: "APP/R&R",
      description: "MEZZANINE PANELS M1 TO M6",
      totalWeightTons: 18.97,
      latestSubmittedDate: "2019-11-15",
      releaseStatus: "Pending",
    },
  
    {
      jobNumber: "U2524",
      section: "drawings_yet_to_return",
      dwgNo: "R-26",
      status: "APP/R&R",
      description: "MEZZANINE PANELS M7 TO M12",
      totalWeightTons: 19.21,
      latestSubmittedDate: "2019-11-15",
      releaseStatus: "Pending",
    },
  
    {
      jobNumber: "U2524",
      section: "drawings_yet_to_return",
      dwgNo: "R-27",
      status: "APP/R&R",
      description: "STAIR / RAMP DETAILS",
      totalWeightTons: 9.84,
      latestSubmittedDate: "2019-11-20",
      releaseStatus: "Pending",
    },
  
    {
      jobNumber: "U2524",
      section: "drawings_yet_to_return",
      dwgNo: "R-28",
      status: "APP/R&R",
      description: "MISCELLANEOUS DETAILS",
      totalWeightTons: 6.32,
      latestSubmittedDate: "2019-11-20",
      releaseStatus: "Pending",
    },
    // Drawing Log entries for U2524
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-1",
      status: "FFU",
      description: "EAST WALL PANELS E1 TO E8",
      totalWeightTons: 24.64,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "https://drive.google.com/file/d/1ESxOdyph8kZkaBmhjA7eIC7cFwrmiAnJ/view?usp=sharing",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-2",
      status: "FFU",
      description: "EAST WALL PANELS E9 TO E16",
      totalWeightTons: 15.81,
      latestSubmittedDate: "2019-07-17",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-2.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-3",
      status: "FFU",
      description: "EAST WALL PANELS E17 TO E23",
      totalWeightTons: 13.23,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-3.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-4",
      status: "FFU",
      description: "NORTH WALL PANELS N1 TO N8",
      totalWeightTons: 17.77,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-4.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-5",
      status: "FFU",
      description: "NORTH WALL PANELS N9 TO N15",
      totalWeightTons: 19.70,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-5.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-6",
      status: "FFU",
      description: "NORTH WALL PANELS N16 TO N22",
      totalWeightTons: 14.59,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-6.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-7",
      status: "FFU",
      description: "NORTH WALL PANELS N23 TO N29",
      totalWeightTons: 19.00,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-7.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-8",
      status: "FFU",
      description: "NORTH WALL PANELS N30 TO N36",
      totalWeightTons: 18.50,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-8.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-9",
      status: "FFU",
      description: "NORTH WALL PANELS N37 TO N43",
      totalWeightTons: 15.53,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-9.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-10",
      status: "FFU",
      description: "NORTH WALL PANELS N44 TO N50",
      totalWeightTons: 19.68,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-10.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-11",
      status: "FFU",
      description: "NORTH WALL PANELS N51 TO N58",
      totalWeightTons: 18.10,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-11.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-12",
      status: "FFU",
      description: "NORTH WALL PANELS N59 TO N66",
      totalWeightTons: 21.96,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-12.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-13",
      status: "FFU",
      description: "NORTH WALL PANELS N67 TO N73",
      totalWeightTons: 15.54,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-13.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-14",
      status: "FFU",
      description: "NORTH WALL PANELS N74 TO N81",
      totalWeightTons: 16.50,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-14.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-15",
      status: "FFU",
      description: "WEST WALL PANELS W1 TO W8",
      totalWeightTons: 15.87,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-15.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-16",
      status: "FFU",
      description: "WEST WALL PANELS W9 TO W16",
      totalWeightTons: 17.57,
      latestSubmittedDate: "2019-09-19",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-16.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-17",
      status: "FFU",
      description: "WEST WALL PANELS W17 TO W22",
      totalWeightTons: 23.13,
      latestSubmittedDate: "2019-10-01",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-17.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-18",
      status: "FFU",
      description: "SOUTH WALL PANELS S-1 TO S-8",
      totalWeightTons: 16.62,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-18.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-19",
      status: "FFU",
      description: "SOUTH WALL PANELS S-9 TO S-15",
      totalWeightTons: 15.54,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-19.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-20",
      status: "FFU",
      description: "SOUTH WALL PANELS S-16 TO S-22",
      totalWeightTons: 18.51,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-20.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-21",
      status: "FFU",
      description: "SOUTH WALL PANELS S-23 TO S-30",
      totalWeightTons: 19.07,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-21.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-22",
      status: "FFU",
      description: "SOUTH WALL PANELS S-31 TO S-37",
      totalWeightTons: 18.31,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-22.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-23",
      status: "FFU",
      description: "SOUTH WALL PANELS S-38 TO S-44",
      totalWeightTons: 18.52,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-23.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-24",
      status: "FFU",
      description: "SOUTH WALL PANELS S-45 TO S-51",
      totalWeightTons: 15.53,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-24.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-25",
      status: "FFU",
      description: "SOUTH WALL PANELS S-52 TO S-58",
      totalWeightTons: 19.37,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-25.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-26",
      status: "FFU",
      description: "SOUTH WALL PANELS S-59 TO S-66",
      totalWeightTons: 17.47,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-26.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-27",
      status: "FFU",
      description: "SOUTH WALL PANELS S-67 TO S-73",
      totalWeightTons: 18.29,
      latestSubmittedDate: "2019-10-05",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-27.pdf",
    },
    {
      jobNumber: "U2524",
      section: "drawing_log",
      dwgNo: "R-28",
      status: "FFU",
      description: "SOUTH WALL PANELS S-74 TO S-80",
      totalWeightTons: 10.85,
      latestSubmittedDate: "2019-10-01",
      releaseStatus: "Released",
      pdfPath: "/assets/U2524/Drawing-Log/R-28.pdf",
    },
] as const;

// ============================================================================
// INVOICES DATA
// ============================================================================
export const demoInvoices = [
  {
    jobNumber: "U2524",
    invoiceNo: "INV-1001",
    billedTonnage: 12.4,
    unitPriceOrLumpSum: "$150 / Ton",
    tonsBilledAmount: 1860.0,
    billedHoursCo: 6.5,
    coPrice: 975.0,
    coBilledAmount: 975.0,
    totalAmountBilled: 2835.0,
  },
  {
    jobNumber: "U2524",
    invoiceNo: "INV-1003",
    billedTonnage: 8.2,
    unitPriceOrLumpSum: "$150 / Ton",
    tonsBilledAmount: 1230.0,
    billedHoursCo: 0.0,
    coPrice: 0.0,
    coBilledAmount: 0.0,
    totalAmountBilled: 1230.0,
  },
  {
    jobNumber: "U2524",
    invoiceNo: "INV-1007",
    billedTonnage: 15.8,
    unitPriceOrLumpSum: "$150 / Ton",
    tonsBilledAmount: 2370.0,
    billedHoursCo: 8.0,
    coPrice: 1200.0,
    coBilledAmount: 1200.0,
    totalAmountBilled: 3570.0,
  },
  {
    jobNumber: "PRO-2025-002",
    invoiceNo: "INV-1002",
    billedTonnage: 18.2,
    unitPriceOrLumpSum: "Lump Sum",
    tonsBilledAmount: 0.0,
    billedHoursCo: 12.0,
    coPrice: 1800.0,
    coBilledAmount: 1200.0,
    totalAmountBilled: 1200.0,
  },
  {
    jobNumber: "PRO-2025-002",
    invoiceNo: "INV-1005",
    billedTonnage: 22.5,
    unitPriceOrLumpSum: "$145 / Ton",
    tonsBilledAmount: 3262.5,
    billedHoursCo: 10.5,
    coPrice: 1575.0,
    coBilledAmount: 1575.0,
    totalAmountBilled: 4837.5,
  },
  {
    jobNumber: "PRO-2025-003",
    invoiceNo: "INV-1004",
    billedTonnage: 25.3,
    unitPriceOrLumpSum: "$155 / Ton",
    tonsBilledAmount: 3921.5,
    billedHoursCo: 15.0,
    coPrice: 2250.0,
    coBilledAmount: 2250.0,
    totalAmountBilled: 6171.5,
  },
  {
    jobNumber: "PRO-2025-003",
    invoiceNo: "INV-1008",
    billedTonnage: 19.7,
    unitPriceOrLumpSum: "$155 / Ton",
    tonsBilledAmount: 3053.5,
    billedHoursCo: 0.0,
    coPrice: 0.0,
    coBilledAmount: 0.0,
    totalAmountBilled: 3053.5,
  },
  {
    jobNumber: "PRO-2025-004",
    invoiceNo: "INV-1006",
    billedTonnage: 30.1,
    unitPriceOrLumpSum: "$160 / Ton",
    tonsBilledAmount: 4816.0,
    billedHoursCo: 20.0,
    coPrice: 3000.0,
    coBilledAmount: 3000.0,
    totalAmountBilled: 7816.0,
  },
  {
    jobNumber: "PRO-2025-004",
    invoiceNo: "INV-1009",
    billedTonnage: 28.4,
    unitPriceOrLumpSum: "$160 / Ton",
    tonsBilledAmount: 4544.0,
    billedHoursCo: 0.0,
    coPrice: 0.0,
    coBilledAmount: 0.0,
    totalAmountBilled: 4544.0,
  },
  {
    jobNumber: "PRO-2025-005",
    invoiceNo: "INV-1010",
    billedTonnage: 35.2,
    unitPriceOrLumpSum: "$148 / Ton",
    tonsBilledAmount: 5209.6,
    billedHoursCo: 18.5,
    coPrice: 2775.0,
    coBilledAmount: 2775.0,
    totalAmountBilled: 7984.6,
  },
  {
    jobNumber: "PRO-2025-005",
    invoiceNo: "INV-1011",
    billedTonnage: 32.8,
    unitPriceOrLumpSum: "$148 / Ton",
    tonsBilledAmount: 4854.4,
    billedHoursCo: 0.0,
    coPrice: 0.0,
    coBilledAmount: 0.0,
    totalAmountBilled: 4854.4,
  },
  {
    jobNumber: "U2524",
    invoiceNo: "INV-1012",
    billedTonnage: 10.5,
    unitPriceOrLumpSum: "$150 / Ton",
    tonsBilledAmount: 1575.0,
    billedHoursCo: 4.5,
    coPrice: 675.0,
    coBilledAmount: 675.0,
    totalAmountBilled: 2250.0,
  },
  {
    jobNumber: "PRO-2025-002",
    invoiceNo: "INV-1013",
    billedTonnage: 20.3,
    unitPriceOrLumpSum: "$145 / Ton",
    tonsBilledAmount: 2943.5,
    billedHoursCo: 8.0,
    coPrice: 1200.0,
    coBilledAmount: 1200.0,
    totalAmountBilled: 4143.5,
  },
  {
    jobNumber: "PRO-2025-004",
    invoiceNo: "INV-1014",
    billedTonnage: 32.8,
    unitPriceOrLumpSum: "$160 / Ton",
    tonsBilledAmount: 5248.0,
    billedHoursCo: 12.5,
    coPrice: 1875.0,
    coBilledAmount: 1875.0,
    totalAmountBilled: 7123.0,
  },
  {
    jobNumber: "PRO-2025-006",
    invoiceNo: "INV-1015",
    billedTonnage: 18.5,
    unitPriceOrLumpSum: "$152 / Ton",
    tonsBilledAmount: 2812.0,
    billedHoursCo: 9.0,
    coPrice: 1350.0,
    coBilledAmount: 1350.0,
    totalAmountBilled: 4162.0,
  },
  {
    jobNumber: "PRO-2025-007",
    invoiceNo: "INV-1016",
    billedTonnage: 14.2,
    unitPriceOrLumpSum: "$158 / Ton",
    tonsBilledAmount: 2243.6,
    billedHoursCo: 6.0,
    coPrice: 900.0,
    coBilledAmount: 900.0,
    totalAmountBilled: 3143.6,
  },
  {
    jobNumber: "PRO-2025-008",
    invoiceNo: "INV-1017",
    billedTonnage: 28.9,
    unitPriceOrLumpSum: "$150 / Ton",
    tonsBilledAmount: 4335.0,
    billedHoursCo: 14.0,
    coPrice: 2100.0,
    coBilledAmount: 2100.0,
    totalAmountBilled: 6435.0,
  },
] as const;

// ============================================================================
// SUBMISSIONS DATA
// ============================================================================
export const demoSubmissions = [
  {
    jobNumber: "U2524",
    proultimaPm: "PROULTIMA PM",
    submissionType: "RFI",
    workDescription: "Anchor bolt plan update",
    drawingNo: "R-71",
    submissionDate: "2024-12-22",
  },
  {
    jobNumber: "U2524",
    proultimaPm: "PROULTIMA PM",
    submissionType: "SUBMITTAL",
    workDescription: "Embed layout confirmation",
    drawingNo: "R-16",
    submissionDate: "2024-12-18",
  },
  {
    jobNumber: "PRO-2025-002",
    proultimaPm: "PROULTIMA PM",
    submissionType: "SUBMITTAL",
    workDescription: "Beam connection shop drawings",
    drawingNo: "R-28",
    submissionDate: "2025-03-15",
  },
  {
    jobNumber: "PRO-2025-002",
    proultimaPm: "PROULTIMA PM",
    submissionType: "RFI",
    workDescription: "Wall panel installation sequence",
    drawingNo: "R-35",
    submissionDate: "2025-02-25",
  },
  {
    jobNumber: "PRO-2025-003",
    proultimaPm: "PROULTIMA PM",
    submissionType: "SUBMITTAL",
    workDescription: "Column splice details",
    drawingNo: "S-12",
    submissionDate: "2025-01-28",
  },
  {
    jobNumber: "PRO-2025-004",
    proultimaPm: "PROULTIMA PM",
    submissionType: "SUBMITTAL",
    workDescription: "Mat slab reinforcement layout",
    drawingNo: "R-88",
    submissionDate: "2024-11-15",
  },
  {
    jobNumber: "PRO-2025-005",
    proultimaPm: "PROULTIMA PM",
    submissionType: "RFI",
    workDescription: "Warehouse column base requirements",
    drawingNo: "R-67",
    submissionDate: "2025-04-05",
  },
] as const;

// ============================================================================
// CHANGE ORDERS DATA
// ============================================================================
export const demoChangeOrders = [
  {
    jobNumber: "PRO-2025-002",
    changeOrderId: "CO-22",
    description: "Beam connection adjustments",
    hours: 9.0,
    date: "2025-03-10",
    status: "In Review",
  },
  {
    jobNumber: "PRO-2025-003",
    changeOrderId: "CO-31",
    description: "Column splice redesign",
    hours: 14.0,
    date: "2025-01-20",
    status: "Pending",
  },
  {
    jobNumber: "PRO-2025-004",
    changeOrderId: "CO-40",
    description: "Mat slab thickness adjustment",
    hours: 10.5,
    date: "2024-11-05",
    status: "Approved",
  },
  {
    jobNumber: "PRO-2025-005",
    changeOrderId: "CO-45",
    description: "Warehouse column spacing change",
    hours: 13.0,
    date: "2025-04-02",
    status: "In Review",
  },
] as const;

// ============================================================================
// PAYMENTS DATA
// ============================================================================
export const demoPayments = [
  {
    amount: 316,
    status: "success",
    email: "demo+ken99@example.com",
  },
  {
    amount: 242,
    status: "success",
    email: "demo+abe45@example.com",
  },
  {
    amount: 837,
    status: "processing",
    email: "demo+monserrat44@example.com",
  },
  {
    amount: 874,
    status: "success",
    email: "demo+silas22@example.com",
  },
  {
    amount: 721,
    status: "failed",
    email: "demo+carmella@example.com",
  },
  {
    amount: 1250,
    status: "success",
    email: "demo+client1@example.com",
  },
  {
    amount: 980,
    status: "success",
    email: "demo+client2@example.com",
  },
  {
    amount: 1540,
    status: "processing",
    email: "demo+client3@example.com",
  },
] as const;

// ============================================================================
// CHAT MESSAGES DATA
// ============================================================================
export const demoChatMessages = [
  {
    jobNumber: null,
    role: "system",
    text: "Welcome to Chat!",
  },
  {
    jobNumber: "U2524",
    role: "me",
    text: "Can we confirm the delivery date for PRO-2025-001?",
  },
  {
    jobNumber: "U2524",
    role: "system",
    text: "Noted. The current delivery date is 2024-05-14.",
  },
  {
    jobNumber: "PRO-2025-002",
    role: "me",
    text: "Beam connections are under review — any update?",
  },
  {
    jobNumber: "PRO-2025-002",
    role: "system",
    text: "The review is scheduled for completion by 2025-03-20.",
  },
] as const;

// ============================================================================
// MATERIAL LISTS DATA
// ============================================================================
// ============================================================================
// EVALUATION LOG DATA
// ============================================================================
export const demoEvaluationLog = [
  {
    category: "PANELS",
    element: "Wall Panel Type A",
    dwgNo: "R-71",
    description: "AREA-H STAIR-H2 SOG",
    rev0: {
      dos: "2024-05-13",
      weightLbs: 118214.11,
    },
  },
  {
    category: "PANELS",
    element: "Wall Panel Type B",
    dwgNo: "R-45",
    description: "FOUNDATION BEAMS F9-F16",
    rev0: {
      dos: "2024-04-20",
      weightLbs: 44360.0,
    },
  },
  {
    category: "PANELS",
    element: "Wall Panel Type C",
    dwgNo: "R-12",
    description: "NORTH AREA WALL PANEL",
    rev0: {
      dos: "2025-03-01",
      weightLbs: 82020.0,
    },
  },
  {
    category: "PANELS",
    element: "Wall Panel Type D",
    dwgNo: "R-28",
    description: "LEVEL-2 BEAM CONNECTIONS",
    rev0: {
      dos: "2025-03-14",
      weightLbs: 145678.0,
    },
  },
  {
    category: "PANELS",
    element: "Wall Panel Type E",
    dwgNo: "S-03",
    description: "STAIR TOWER BRACING",
    rev0: {
      dos: "2024-12-03",
      weightLbs: 24900.0,
    },
  },
  {
    category: "PANELS",
    element: "Wall Panel Type F",
    dwgNo: "S-15",
    description: "ROOF TRUSS CONNECTIONS",
    rev0: {
      dos: "2024-12-10",
      weightLbs: 31560.0,
    },
  },
  {
    category: "PANELS",
    element: "Wall Panel Type G",
    dwgNo: "S-08",
    description: "MEZZANINE FLOOR SYSTEM",
    rev0: {
      dos: "2025-03-18",
      weightLbs: 62500.0,
    },
  },
  {
    category: "PANELS",
    element: "Wall Panel Type H",
    dwgNo: "R-16",
    description: "FOUNDATION PANELS F1 TO F8",
    rev0: {
      dos: "2024-12-01",
      weightLbs: 49280.0,
    },
  },
  {
    category: "PANELS",
    element: "Wall Panel Type I",
    dwgNo: "R-22",
    description: "WALL PANELS EAST SIDE",
    rev0: {
      dos: "2024-11-15",
      weightLbs: 36640.0,
    },
  },
  {
    category: "PANELS",
    element: "Wall Panel Type J",
    dwgNo: "R-35",
    description: "WEST WALL PANELS",
    rev0: {
      dos: "2025-02-20",
      weightLbs: 57820.0,
    },
  },
] as const;

// ============================================================================
// MATERIAL LISTS DATA
// ============================================================================
export const demoMaterialLists = [
  {
    jobNumber: "U2524",
    heading: "SLAB ON GRADE AREA-H (STAIR-H2)",
    status: "released",
    priority: "High",
    note: null,
    barItems: [
      {
        dwgNo: "R-71",
        releaseDescription: "R71 AREA-H STAIR-H2 SOG",
        ctrlCode: "BEQ",
        relNo: "42",
        weightLbs: 591.07,
        date: "2024-05-13",
        varyingBars: "No",
        remarks: "AW BAR LIST",
      },
    ],
    fields: [
      { label: "Load Category", value: "N/A" },
      { label: "Delivery Date", value: "2024-05-14" },
      { label: "Couplers/Form Savers", value: "N/A" },
      { label: "Special Shapes", value: "N/A" },
      { label: "Coating", value: "N/A" },
      { label: "Grade", value: "N/A" },
      { label: "Accessories", value: "N/A" },
    ],
  },
  {
    jobNumber: "U2524",
    heading: "BEAM CONNECTIONS LEVEL-2",
    status: "under_review",
    priority: "Medium",
    note: "Requires coordination with structural team",
    barItems: [
      {
        dwgNo: "R-28",
        releaseDescription: "R28 LEVEL-2 BEAM CONNECTIONS",
        ctrlCode: "BCN",
        relNo: "28",
        weightLbs: 728.39,
        date: "2025-03-14",
        varyingBars: "No",
        remarks: "UNDER REVIEW",
      },
    ],
    fields: [
      { label: "Load Category", value: "STRUCTURAL" },
      { label: "Delivery Date", value: "2025-03-15" },
      { label: "Couplers/Form Savers", value: "N/A" },
      { label: "Special Shapes", value: "YES" },
      { label: "Coating", value: "EPOXY" },
      { label: "Grade", value: "A706" },
      { label: "Accessories", value: "N/A" },
    ],
  },
] as const;

// ============================================================================
// ACCESSORIES DATA
// ============================================================================
export const demoAccessories = [
  {
    dwgNo: "R-71",
    elements: "Anchor Bolts",
    description: "M16 x 150mm Anchor Bolts",
    supportHeight: "150mm",
    type: "Type A",
    qty: 24,
    lft: 36.0,
    remarks: "Standard installation",
  },
  {
    dwgNo: "R-45",
    elements: "Welded Plates",
    description: "Base Plate 300x300x20mm",
    supportHeight: "20mm",
    type: "Type B",
    qty: 12,
    lft: 18.0,
    remarks: "Grade A36",
  },
  {
    dwgNo: "R-28",
    elements: "Connectors",
    description: "Beam-to-Column Connector",
    supportHeight: "N/A",
    type: "Type C",
    qty: 8,
    lft: 12.0,
    remarks: "Pre-fabricated",
  },
  {
    dwgNo: "S-12",
    elements: "Brackets",
    description: "Angle Bracket 100x100x10mm",
    supportHeight: "10mm",
    type: "Type A",
    qty: 16,
    lft: 24.0,
    remarks: "Hot-dip galvanized",
  },
  {
    dwgNo: "R-88",
    elements: "Stiffeners",
    description: "Web Stiffener Plate",
    supportHeight: "8mm",
    type: "Type D",
    qty: 20,
    lft: 30.0,
    remarks: "As per drawing",
  },
] as const;

// ============================================================================
// COUPLERS/FORM SAVERS DATA
// ============================================================================
export const demoCouplersFormSavers = [
  {
    sNo: 1,
    dwgNo: "R-71",
    description: "Mechanical Coupler Type A",
    type: "Coupler",
    code: "CPL-A",
    qtyPerBarSize: {
      bar4: 12,
      bar5: 8,
      bar6: 15,
      bar7: 0,
      bar8: 20,
      bar9: 0,
      bar10: 10,
      bar11: 0,
      bar14: 5,
      bar18: 0,
    },
    remarks: "Standard installation",
  },
  {
    sNo: 2,
    dwgNo: "R-45",
    description: "Form Saver Type B",
    type: "Form Saver",
    code: "FS-B",
    qtyPerBarSize: {
      bar4: 0,
      bar5: 6,
      bar6: 10,
      bar7: 8,
      bar8: 12,
      bar9: 0,
      bar10: 0,
      bar11: 4,
      bar14: 0,
      bar18: 2,
    },
    remarks: "Pre-fabricated",
  },
  {
    sNo: 3,
    dwgNo: "R-28",
    description: "Threaded Coupler Type C",
    type: "Coupler",
    code: "CPL-C",
    qtyPerBarSize: {
      bar4: 5,
      bar5: 0,
      bar6: 8,
      bar7: 12,
      bar8: 15,
      bar9: 10,
      bar10: 8,
      bar11: 0,
      bar14: 6,
      bar18: 4,
    },
    remarks: "As per drawing",
  },
  {
    sNo: 4,
    dwgNo: "S-12",
    description: "Form Saver Type D",
    type: "Form Saver",
    code: "FS-D",
    qtyPerBarSize: {
      bar4: 8,
      bar5: 10,
      bar6: 0,
      bar7: 6,
      bar8: 8,
      bar9: 12,
      bar10: 0,
      bar11: 5,
      bar14: 0,
      bar18: 0,
    },
    remarks: "Hot-dip galvanized",
  },
  {
    sNo: 5,
    dwgNo: "R-88",
    description: "Mechanical Coupler Type E",
    type: "Coupler",
    code: "CPL-E",
    qtyPerBarSize: {
      bar4: 0,
      bar5: 4,
      bar6: 6,
      bar7: 8,
      bar8: 10,
      bar9: 0,
      bar10: 12,
      bar11: 8,
      bar14: 6,
      bar18: 3,
    },
    remarks: "Grade A36",
  },
] as const;

// ============================================================================
// EXPORT ALL DATA AS JSON (for upload system)
// ============================================================================
export const allDemoData = {
  projects: demoProjects,
  drawings: demoDrawings,
  invoices: demoInvoices,
  submissions: demoSubmissions,
  changeOrders: demoChangeOrders,
  payments: demoPayments,
  chatMessages: demoChatMessages,
  materialLists: demoMaterialLists,
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert demo data to CSV format
 */
export function toCSV(data: readonly any[], headers: string[]): string {
  const headerRow = headers.join(",");
  const dataRows = data.map((row) =>
    headers.map((header) => {
      const value = row[header] ?? "";
      return typeof value === "string" && value.includes(",")
        ? `"${value}"`
        : value;
    }).join(",")
  );
  return [headerRow, ...dataRows].join("\n");
}

/**
 * Get invoices as JSON (for upload)
 */
export function getInvoicesJSON(): string {
  return JSON.stringify(
    demoInvoices.map((inv) => ({
      "Job Number": inv.jobNumber,
      "Invoice #": inv.invoiceNo,
      "Billed Tonnage": inv.billedTonnage,
      "Unit Price / Lump Sum": inv.unitPriceOrLumpSum,
      "Tons Billed Amount": inv.tonsBilledAmount,
      "CO Hours": inv.billedHoursCo,
      "CO Price": inv.coPrice,
      "CO Billed Amount": inv.coBilledAmount,
      "Total Amount Billed": inv.totalAmountBilled,
    })),
    null,
    2
  );
}

/**
 * Get projects as CSV
 */
export function getProjectsCSV(): string {
  return toCSV(demoProjects, [
    "jobNumber",
    "name",
    "contractorName",
    "location",
    "estimatedTons",
  ]);
}

/**
 * Get drawings as CSV
 */
export function getDrawingsCSV(): string {
  return toCSV(demoDrawings, [
    "jobNumber",
    "section",
    "dwgNo",
    "status",
    "description",
    "totalWeightTons",
    "latestSubmittedDate",
    "releaseStatus",
  ]);
}

