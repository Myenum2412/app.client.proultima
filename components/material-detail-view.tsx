"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Eye, Download, CheckCircle2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export interface MaterialDetail {
  id: string
  title: string
  dwgNumber: string
  releaseDescription: string
  ctrlCode: string
  relNumber: string
  weightLbs: number
  date: string
  varyingBars: boolean
  remarks: string
  status: "released" | "pending" | "in-progress"
  priority?: "high" | "medium" | "low"
  // Additional Fields
  loadCategory?: string
  coating?: string
  deliveryDate?: string
  grade?: string
  couplersFormSavers?: string
  accessories?: string
  specialShapes?: string
  pdfPath?: string
}

interface MaterialDetailViewProps {
  material: MaterialDetail
  onClose?: () => void
  onViewDetails?: () => void
  onDownload?: () => void
}

export function MaterialDetailView({
  material,
  onClose,
  onViewDetails,
  onDownload,
}: MaterialDetailViewProps) {
  const formatWeight = (lbs: number) => {
    return lbs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="space-y-6">
      {/* Header with Title and Status - matching image design */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-4">{material.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={material.status === "released" ? "default" : "secondary"}
            className={cn(
              material.status === "released" && "bg-green-500 hover:bg-green-600 text-white border-green-600",
              material.status === "in-progress" && "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600"
            )}
          >
            {material.status === "released" && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {material.status === "in-progress" && <AlertCircle className="h-3 w-3 mr-1" />}
            {material.status === "released" ? "Released" : material.status === "in-progress" ? "In Progress" : "Pending"}
          </Badge>
          {material.priority === "high" && (
            <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 text-white border-red-600">
              High
            </Badge>
          )}
          {material.priority === "medium" && (
            <Badge variant="secondary" className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600">
              Medium
            </Badge>
          )}
          {material.priority === "low" && (
            <Badge variant="outline" className="bg-gray-500 hover:bg-gray-600 text-white border-gray-600">
              Low
            </Badge>
          )}
        </div>
      </div>

      {/* Bar List Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Bar List Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>DWG #</TableHead>
                  <TableHead>Release Description</TableHead>
                  <TableHead>CTRL Code</TableHead>
                  <TableHead>REL #</TableHead>
                  <TableHead>WT (LBS)</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Varying Bars</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{material.dwgNumber}</TableCell>
                  <TableCell>{material.releaseDescription}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                      {material.ctrlCode}
                    </Badge>
                  </TableCell>
                  <TableCell>{material.relNumber}</TableCell>
                  <TableCell className="font-medium">{formatWeight(material.weightLbs)}</TableCell>
                  <TableCell>
                    {material.date ? format(new Date(material.date), "yyyy-MM-dd") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                      {material.varyingBars ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell>{material.remarks || "—"}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Additional Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Load Category</p>
                <p className="font-medium">{material.loadCategory || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Coating</p>
                <p className="font-medium">{material.coating || "N/A"}</p>
              </div>
            </div>

            {/* Middle Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Delivery Date</p>
                <p className="font-medium">
                  {material.deliveryDate 
                    ? format(new Date(material.deliveryDate), "yyyy-MM-dd")
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Grade</p>
                <p className="font-medium">{material.grade || "N/A"}</p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Couplers/Form Savers</p>
                <p className="font-medium">{material.couplersFormSavers || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Accessories</p>
                <p className="font-medium">{material.accessories || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Special Shapes</p>
                <p className="font-medium">{material.specialShapes || "N/A"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons - matching image design */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onViewDetails}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          View Details
        </Button>
        <Button
          variant="outline"
          onClick={onDownload}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="ml-auto">
            Close
          </Button>
        )}
      </div>
    </div>
  )
}

