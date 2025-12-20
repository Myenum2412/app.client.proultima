"use client"

import { useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { MaterialDetailView, MaterialDetail } from "@/components/material-detail-view"
import { Eye, Download, Package } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface MaterialListItem {
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
  loadCategory?: string
  coating?: string
  deliveryDate?: string
  grade?: string
  couplersFormSavers?: string
  accessories?: string
  specialShapes?: string
  pdfPath?: string
}

interface MaterialListTableProps {
  materials: MaterialListItem[]
  onMaterialClick?: (material: MaterialListItem) => void
}

export function MaterialListTable({ materials, onMaterialClick }: MaterialListTableProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialListItem | null>(null)
  const [viewMode, setViewMode] = useState<"list" | "detail">("list")

  const handleMaterialClick = (material: MaterialListItem) => {
    setSelectedMaterial(material)
    setViewMode("detail")
    onMaterialClick?.(material)
  }

  const handleCloseDetail = () => {
    setSelectedMaterial(null)
    setViewMode("list")
  }

  const handleViewDetails = () => {
    if (selectedMaterial) {
      // Navigate to full detail page or open modal
      console.log("View details for:", selectedMaterial.id)
    }
  }

  const handleDownload = () => {
    if (selectedMaterial?.pdfPath) {
      // Trigger download
      window.open(selectedMaterial.pdfPath, "_blank")
    } else {
      console.log("Download material:", selectedMaterial?.id)
    }
  }

  if (viewMode === "detail" && selectedMaterial) {
    return (
      <Card>
        <CardContent className="pt-6">
          <MaterialDetailView
            material={selectedMaterial as MaterialDetail}
            onClose={handleCloseDetail}
            onViewDetails={handleViewDetails}
            onDownload={handleDownload}
          />
        </CardContent>
      </Card>
    )
  }

  if (materials.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No materials found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Material List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>DWG #</TableHead>
                <TableHead>Release Description</TableHead>
                <TableHead>CTRL Code</TableHead>
                <TableHead>REL #</TableHead>
                <TableHead>WT (LBS)</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((material) => (
                <TableRow
                  key={material.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleMaterialClick(material)}
                >
                  <TableCell className="font-medium max-w-[200px] truncate" title={material.title}>
                    {material.title}
                  </TableCell>
                  <TableCell>{material.dwgNumber}</TableCell>
                  <TableCell className="max-w-[250px] truncate" title={material.releaseDescription}>
                    {material.releaseDescription}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800">
                      {material.ctrlCode}
                    </Badge>
                  </TableCell>
                  <TableCell>{material.relNumber}</TableCell>
                  <TableCell className="font-medium">
                    {material.weightLbs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    {material.date ? format(new Date(material.date), "yyyy-MM-dd") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={material.status === "released" ? "default" : "secondary"}
                      className={cn(
                        material.status === "released" && "bg-green-500 hover:bg-green-600 text-white border-green-600",
                        material.status === "in-progress" && "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600"
                      )}
                    >
                      {material.status === "released" ? "Released" : material.status === "in-progress" ? "In Progress" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>
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
                      <Badge variant="outline">
                        Low
                      </Badge>
                    )}
                    {!material.priority && <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMaterialClick(material)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (material.pdfPath) {
                            window.open(material.pdfPath, "_blank")
                          } else {
                            console.log("Download:", material.id)
                          }
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

