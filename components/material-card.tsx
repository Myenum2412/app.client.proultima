"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
import { Download, CheckCircle2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { MaterialDetail } from "@/components/material-detail-view"

interface MaterialCardProps {
  material: MaterialDetail
  onDownload?: () => void
}

export function MaterialCard({
  material,
  onDownload,
}: MaterialCardProps) {
  const formatWeight = (lbs: number) => {
    return lbs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        {/* Header with Title, Status, and Download icon */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-bold leading-tight">{material.title}</h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant={material.status === "released" ? "default" : "secondary"}
              className={cn(
                "text-xs",
                material.status === "released" && "bg-green-500 hover:bg-green-600 text-white border-green-600",
                material.status === "in-progress" && "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600"
              )}
            >
              {material.status === "released" && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {material.status === "in-progress" && <AlertCircle className="h-3 w-3 mr-1" />}
              {material.status === "released" ? "Released" : material.status === "in-progress" ? "In Progress" : "Pending"}
            </Badge>
            {material.priority === "high" && (
              <Badge variant="destructive" className="text-xs bg-red-500 hover:bg-red-600 text-white border-red-600">
                High
              </Badge>
            )}
            {material.priority === "medium" && (
              <Badge variant="secondary" className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600">
                Medium
              </Badge>
            )}
            {material.priority === "low" && (
              <Badge variant="outline" className="text-xs bg-gray-500 hover:bg-gray-600 text-white border-gray-600">
                Low
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="h-8 w-8 p-0"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bar List Summary - Table format with all fields in one row */}
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Bar List Summary</h3>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-50 dark:bg-green-950/20">
                  <TableHead className="bg-green-50 dark:bg-green-950/20 text-black dark:text-white font-semibold">DWG #</TableHead>
                  <TableHead className="bg-green-50 dark:bg-green-950/20 text-black dark:text-white font-semibold">Release Description</TableHead>
                  <TableHead className="bg-green-50 dark:bg-green-950/20 text-black dark:text-white font-semibold">CTRL Code</TableHead>
                  <TableHead className="bg-green-50 dark:bg-green-950/20 text-black dark:text-white font-semibold">REL #</TableHead>
                  <TableHead className="bg-green-50 dark:bg-green-950/20 text-black dark:text-white font-semibold">WT (LBS)</TableHead>
                  <TableHead className="bg-green-50 dark:bg-green-950/20 text-black dark:text-white font-semibold">Date</TableHead>
                  <TableHead className="bg-green-50 dark:bg-green-950/20 text-black dark:text-white font-semibold">Varying Bars</TableHead>
                  <TableHead className="bg-green-50 dark:bg-green-950/20 text-black dark:text-white font-semibold">Remarks</TableHead>
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
        </div>

        {/* Additional Fields - 2 rows, 4 columns each */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Additional Fields</h3>
           <div className="grid grid-cols-4 gap-4 text-sm">
             {/* First Row - 4 columns */}
             <div>
               <p className="text-muted-foreground text-xs mb-1">Load Category</p>
               <p className="font-medium">{material.loadCategory || "N/A"}</p>
             </div>
             <div>
               <p className="text-muted-foreground text-xs mb-1">Coating</p>
               <p className="font-medium">{material.coating || "N/A"}</p>
             </div>
             <div>
               <p className="text-muted-foreground text-xs mb-1">Delivery Date</p>
               <p className="font-medium">
                 {material.deliveryDate 
                   ? format(new Date(material.deliveryDate), "yyyy-MM-dd")
                   : "N/A"}
               </p>
             </div>
             <div>
               <p className="text-muted-foreground text-xs mb-1">Grade</p>
               <p className="font-medium">{material.grade || "N/A"}</p>
             </div>
             
             {/* Second Row - 4 columns */}
             <div>
               <p className="text-muted-foreground text-xs mb-1">Couplers/Form Savers</p>
               <p className="font-medium">{material.couplersFormSavers || "N/A"}</p>
             </div>
             <div>
               <p className="text-muted-foreground text-xs mb-1">Accessories</p>
               <p className="font-medium">{material.accessories || "N/A"}</p>
             </div>
             <div>
               <p className="text-muted-foreground text-xs mb-1">Special Shapes</p>
               <p className="font-medium">{material.specialShapes || "N/A"}</p>
             </div>
             <div>
               {/* Empty column to maintain 4-column layout */}
             </div>
           </div>
          </div>
      </CardContent>
    </Card>
  )
}

