"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { fetchJson } from "@/lib/api/fetch-json";
import { queryKeys } from "@/lib/query/keys";
import type { ProjectsListItem } from "@/app/api/projects/route";

type TableType =
  | "projects"
  | "drawings"
  | "submissions"
  | "invoices"
  | "change_orders"
  | "payments"
  | "chat_messages";

type UploadFormat = "csv" | "json";

interface UploadResult {
  success: boolean;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
  warnings: string[];
  message: string;
}

const TABLE_OPTIONS: Array<{ value: TableType; label: string; description: string }> = [
  { value: "projects", label: "Projects", description: "Project master records" },
  { value: "drawings", label: "Drawings", description: "Drawing records (all sections)" },
  { value: "submissions", label: "Submissions", description: "RFI and Submittal records" },
  { value: "invoices", label: "Invoices", description: "Invoice records" },
  { value: "change_orders", label: "Change Orders", description: "Change order records" },
  { value: "payments", label: "Payments", description: "Payment records" },
  { value: "chat_messages", label: "Chat Messages", description: "Chat message records" },
];

export function UploadDemoClient() {
  const [selectedTable, setSelectedTable] = useState<TableType>("projects");
  const [selectedFormat, setSelectedFormat] = useState<UploadFormat>("csv");
  const [fileContent, setFileContent] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch projects for project-dependent tables
  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects(),
    queryFn: () => fetchJson<ProjectsListItem[]>("/api/projects"),
    staleTime: 60_000,
  });

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setFileContent(content);
        setUploadResult(null);
      };
      reader.readAsText(file);
    },
    []
  );

  const handleTextareaChange = useCallback((value: string) => {
    setFileContent(value);
    setUploadResult(null);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!fileContent.trim()) {
      alert("Please provide file content or paste data");
      return;
    }

    setUploadResult(null);
    setIsUploading(true);

    try {
      // Parse data based on format
      let data: string | unknown = fileContent;
      if (selectedFormat === "json") {
        try {
          data = JSON.parse(fileContent);
        } catch {
          alert("Invalid JSON format");
          setIsUploading(false);
          return;
        }
      }

      const response = await fetch("/upload-demo/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: selectedTable,
          format: selectedFormat,
          data,
          options: {
            skipDuplicates,
            projectId: projectId || undefined,
          },
        }),
      });

      const result = await response.json();
      setUploadResult(result);
    } catch (error) {
      setUploadResult({
        success: false,
        inserted: 0,
        updated: 0,
        skipped: 0,
        errors: [{ row: 0, error: error instanceof Error ? error.message : "Upload failed" }],
        warnings: [],
        message: "Upload failed",
      });
    } finally {
      setIsUploading(false);
    }
  }, [fileContent, selectedTable, selectedFormat, skipDuplicates, projectId]);

  const needsProjectId =
    selectedTable !== "projects" &&
    selectedTable !== "payments" &&
    selectedTable !== "chat_messages";

  const showProjectSelector = needsProjectId && projects.length > 0;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Data to Supabase
          </CardTitle>
          <CardDescription>
            Upload CSV or JSON data to any table in your Supabase database
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Table Selection */}
          <div className="space-y-2">
            <Label htmlFor="table">Select Table</Label>
            <Select value={selectedTable} onValueChange={(v) => setSelectedTable(v as TableType)}>
              <SelectTrigger id="table">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TABLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="format">File Format</Label>
            <Select
              value={selectedFormat}
              onValueChange={(v) => setSelectedFormat(v as UploadFormat)}
            >
              <SelectTrigger id="format">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Comma-separated values)</SelectItem>
                <SelectItem value="json">JSON (JavaScript Object Notation)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project Selection (for project-dependent tables) */}
          {showProjectSelector && (
            <div className="space-y-2">
              <Label htmlFor="project">Project (Optional - can also use Job Number in data)</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (use Job Number from data)</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.jobNumber} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                If not selected, the system will try to resolve project_id from "Job Number" column in your data
              </p>
            </div>
          )}

          {/* Options */}
          <div className="space-y-2">
            <Label>Options</Label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="skipDuplicates"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="skipDuplicates" className="font-normal cursor-pointer">
                Skip duplicates (check for existing records before inserting)
              </Label>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">Upload File or Paste Data</Label>
            <div className="flex gap-2">
              <input
                type="file"
                id="file"
                accept={selectedFormat === "csv" ? ".csv" : ".json"}
                onChange={handleFileUpload}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
            </div>
          </div>

          {/* Data Input */}
          <div className="space-y-2">
            <Label htmlFor="data">Data Content ({selectedFormat.toUpperCase()})</Label>
            <Textarea
              id="data"
              value={fileContent}
              onChange={(e) => handleTextareaChange(e.target.value)}
              placeholder={
                selectedFormat === "csv"
                  ? `Job Number,Name,Contractor,Location\nPRO-2025-001,Project Name,ABC Construction,PA`
                  : `[\n  {\n    "Job Number": "PRO-2025-001",\n    "Name": "Project Name"\n  }\n]`
              }
              className="min-h-[200px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Paste your {selectedFormat.toUpperCase()} data here or upload a file above
            </p>
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!fileContent.trim() || isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload to Supabase
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {uploadResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {uploadResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              Upload Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={uploadResult.success ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{uploadResult.success ? "Upload Successful" : "Upload Failed"}</AlertTitle>
              <AlertDescription>{uploadResult.message}</AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold text-green-600">{uploadResult.inserted}</div>
                <div className="text-sm text-muted-foreground">Inserted</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold text-yellow-600">{uploadResult.skipped}</div>
                <div className="text-sm text-muted-foreground">Skipped</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-2xl font-bold text-red-600">{uploadResult.errors.length}</div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <Label>Errors</Label>
                <div className="rounded-lg border p-4 max-h-[200px] overflow-y-auto">
                  {uploadResult.errors.map((error, idx) => (
                    <div key={idx} className="text-sm text-red-600 mb-2">
                      <Badge variant="destructive" className="mr-2">
                        Row {error.row}
                      </Badge>
                      {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadResult.warnings && uploadResult.warnings.length > 0 && (
              <div className="space-y-2">
                <Label>Warnings</Label>
                <div className="rounded-lg border p-4 max-h-[200px] overflow-y-auto">
                  {uploadResult.warnings.map((warning, idx) => (
                    <div key={idx} className="text-sm text-yellow-600 mb-2">
                      {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Column Mapping Help
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium mb-2">The system automatically recognizes these column name variations:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Projects:</strong> Job Number, Job # → job_number</li>
                <li><strong>Drawings:</strong> DWG #, DWG No, Drawing Number → dwg_no</li>
                <li><strong>Invoices:</strong> Invoice #, Invoice No → invoice_no</li>
                <li><strong>Submissions:</strong> Drawing #, Drawing No → drawing_no</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>For project-dependent tables, include "Job Number" column to auto-resolve project_id</li>
                <li>Dates should be in YYYY-MM-DD format</li>
                <li>Numeric fields are automatically converted</li>
                <li>Empty values are treated as null for optional fields</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

