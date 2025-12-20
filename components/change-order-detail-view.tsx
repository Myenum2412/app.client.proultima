"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { ChangeOrder } from "./change-orders-table"
import { PDFViewer } from "@/components/pdf-viewer"

interface ChangeOrderDetailViewProps {
  changeOrder: ChangeOrder | null
  changeOrders: ChangeOrder[]
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole?: "staff" | "manager"
  userName?: string
  projectNumber?: string // For generating PDF paths for different projects
}

// Helper function to generate PDF paths for multiple projects
function generatePdfPaths(changeOrder: ChangeOrder, projectNumber?: string): string[] {
  const paths: string[] = []
  
  // If explicit PDF path is provided, use it first
  if (changeOrder.pdfPath) {
    paths.push(changeOrder.pdfPath)
    // Also try URL-encoded versions
    const encodedPath = changeOrder.pdfPath.split('/').map(part => encodeURIComponent(part)).join('/')
    if (encodedPath !== changeOrder.pdfPath) {
      paths.push(encodedPath)
    }
    const plusEncoded = changeOrder.pdfPath.replace(/ /g, '+')
    if (plusEncoded !== changeOrder.pdfPath && plusEncoded !== encodedPath) {
      paths.push(plusEncoded)
    }
    return [...new Set(paths)]
  }

  // Extract project number from pdfPath if available, or use provided projectNumber
  let projectNum = projectNumber || "PRO-2025-001"
  
  // Try to extract project number from existing pdfPath if it exists
  if (changeOrder.pdfPath) {
    const pathMatch = changeOrder.pdfPath.match(/\/assets\/([^\/]+)\//)
    if (pathMatch) {
      projectNum = pathMatch[1]
    }
  }

  // Generate paths for the specific project
  const basePath = `/assets/${projectNum}/Change-order`
  paths.push(`${basePath}/${changeOrder.id}.pdf`)
  paths.push(`${basePath}/${changeOrder.id.replace(/-/g, '_')}.pdf`)
  paths.push(`${basePath}/CO_${changeOrder.id.replace('CO-', '')}.pdf`)
  
  // Also try alternative project numbers if current one doesn't match
  if (projectNum !== "PRO-2025-001") {
    const altBasePath = `/assets/PRO-2025-001/Change-order`
    paths.push(`${altBasePath}/${changeOrder.id}.pdf`)
    paths.push(`${altBasePath}/${changeOrder.id.replace(/-/g, '_')}.pdf`)
  }
  
  return [...new Set(paths)]
}

export function ChangeOrderDetailView({
  changeOrder,
  changeOrders,
  open,
  onOpenChange,
  userRole = "staff",
  userName = "User",
  projectNumber,
}: ChangeOrderDetailViewProps) {
  const [pageNumber, setPageNumber] = React.useState<number>(1)
  const [numPages, setNumPages] = React.useState<number>(0)
  const [scale, setScale] = React.useState<number>(1.0)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [pdfError, setPdfError] = React.useState<string | null>(null)
  const [pdfPath, setPdfPath] = React.useState<string | null>(null)
  const [pdfBlob, setPdfBlob] = React.useState<Blob | null>(null)
  const [pdfPathAttempts, setPdfPathAttempts] = React.useState<string[]>([])
  const [currentPathIndex, setCurrentPathIndex] = React.useState<number>(0)
  const [isRetrying, setIsRetrying] = React.useState(false)
  const loadingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Check if PDF file exists and get it as blob
  const findAndLoadPdf = React.useCallback(async (paths: string[]): Promise<{ url: string; blob?: Blob } | null> => {
    for (const path of paths) {
      try {
        const headResponse = await fetch(path, { 
          method: 'HEAD', 
          cache: 'no-cache',
          headers: { 'Accept': 'application/pdf' }
        })
        
        if (headResponse.ok) {
          const blobResponse = await fetch(path, {
            cache: 'no-cache',
            headers: { 'Accept': 'application/pdf' }
          })
          
          if (blobResponse.ok) {
            const blob = await blobResponse.blob()
            return { url: path, blob }
          }
        }
      } catch (error) {
        console.log(`Path ${path} not accessible:`, error)
        continue
      }
    }
    return null
  }, [])

  const currentIndex = changeOrder ? changeOrders.findIndex((o) => o.id === changeOrder.id) : -1
  const canNavigatePrev = currentIndex > 0
  const canNavigateNext = currentIndex < changeOrders.length - 1

  // Initialize PDF paths when change order changes
  React.useEffect(() => {
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }

    if (changeOrder) {
      const paths = generatePdfPaths(changeOrder, projectNumber)
      const allPaths: string[] = []
      paths.forEach(path => {
        allPaths.push(path)
        const encodedPath = path.split('/').map(part => encodeURIComponent(part)).join('/')
        if (encodedPath !== path) {
          allPaths.push(encodedPath)
        }
        const plusEncoded = path.replace(/ /g, '+')
        if (plusEncoded !== path && plusEncoded !== encodedPath) {
          allPaths.push(plusEncoded)
        }
      })
      const uniquePaths = Array.from(new Set(allPaths))
      setPdfPathAttempts(uniquePaths)
      setCurrentPathIndex(0)
      setPdfPath(uniquePaths[0] || null)
      setPageNumber(1)
      setScale(1.0)
      setIsLoading(true)
      setPdfError(null)
      setIsRetrying(false)

      // Use fetch-based method to find and load PDF
      if (uniquePaths.length > 0) {
        setPdfBlob(null)

        findAndLoadPdf(uniquePaths).then((result) => {
          if (result && result.blob) {
            setPdfBlob(result.blob)
            setPdfPath(result.url)
            setIsLoading(false)
            setPdfError(null)
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current)
              loadingTimeoutRef.current = null
            }
          } else {
            setIsLoading(true)
          }
        }).catch((error) => {
          console.error("Error finding PDF:", error)
          setIsLoading(true)
        })
      }

      // Set 5 second timeout for loading
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading((prevLoading) => {
          if (prevLoading) {
            setPdfError(
              `PDF took too long to load (5 seconds). The file may be missing or inaccessible.`
            )
          }
          return false
        })
      }, 5000)
    }

    // Cleanup timeout on unmount or when changeOrder changes
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }
  }, [changeOrder, projectNumber, findAndLoadPdf])

  const onDocumentLoadSuccess = (numPages: number) => {
    // Clear loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
    setNumPages(numPages)
    setIsLoading(false)
    setPdfError(null)
    setIsRetrying(false)
  }

  const tryNextPath = React.useCallback(() => {
    // Clear existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }

    if (currentPathIndex < pdfPathAttempts.length - 1) {
      const nextIndex = currentPathIndex + 1
      setCurrentPathIndex(nextIndex)
      setPdfPath(pdfPathAttempts[nextIndex])
      setIsRetrying(true)
      setIsLoading(true)
      setPdfError(null)

      // Set new 5 second timeout
      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoading((prevLoading) => {
          if (prevLoading) {
            setPdfError(
              `PDF took too long to load (5 seconds). Trying next path...`
            )
          }
          return false
        })
      }, 5000)
    } else {
      setIsLoading(false)
      setPdfError(
        `PDF file not found. Tried ${pdfPathAttempts.length} different path variations.`
      )
      setIsRetrying(false)
    }
  }, [currentPathIndex, pdfPathAttempts])

  const onDocumentLoadError = (error: Error) => {
    // Clear loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }

    if (currentPathIndex < pdfPathAttempts.length - 1) {
      setTimeout(() => tryNextPath(), 500)
    } else {
      setIsLoading(false)
      setPdfError(
        `Failed to load PDF. The file may not exist or may be corrupted. Tried ${pdfPathAttempts.length} different path variations.`
      )
      setIsRetrying(false)
    }
  }

  const handleZoom = (delta: number) => {
    setScale((prev) => Math.max(0.5, Math.min(3.0, prev + delta)))
  }

  const handlePage = (direction: "prev" | "next") => {
    if (direction === "prev" && pageNumber > 1) {
      setPageNumber(pageNumber - 1)
    } else if (direction === "next" && pageNumber < numPages) {
      setPageNumber(pageNumber + 1)
    }
  }

  const handleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setIsFullscreen(!isFullscreen)
  }

  const handleDownload = () => {
    if (pdfPath && userRole === "manager") {
      const link = document.createElement("a")
      link.href = pdfPath
      link.download = `${changeOrder?.id || "change-order"}.pdf`
      link.click()
    }
  }

  const handleNavigate = (direction: "prev" | "next") => {
    if (!changeOrder) return
    const newIndex = direction === "prev" ? currentIndex - 1 : currentIndex + 1
    if (newIndex >= 0 && newIndex < changeOrders.length) {
      const newOrder = changeOrders[newIndex]
      window.dispatchEvent(
        new CustomEvent("change-order-navigate", {
          detail: { changeOrder: newOrder },
        })
      )
    }
  }

  if (!changeOrder) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] max-h-[95vh] h-[95vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">
            Change Order Details
          </DialogTitle>
          <DialogDescription>
            View and manage change order information and documents
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="pdf" className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-4 border-b">
            <TabsList>
              <TabsTrigger value="pdf">PDF Viewer</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pdf" className="flex-1 flex flex-col min-h-0 mt-0 p-6">
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              {/* PDF Controls */}
              <div className="flex items-center justify-between gap-4 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleZoom(-0.1)}
                          disabled={scale <= 0.5}
                        >
                          <ZoomOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zoom Out</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <span className="text-sm font-medium min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleZoom(0.1)}
                          disabled={scale >= 3.0}
                        >
                          <ZoomIn className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Zoom In</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="h-6 w-px bg-border mx-2" />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePage("prev")}
                          disabled={pageNumber <= 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Previous Page</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <span className="text-sm font-medium min-w-[100px] text-center">
                    Page {pageNumber} of {numPages || "—"}
                  </span>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePage("next")}
                          disabled={pageNumber >= numPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Next Page</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="h-6 w-px bg-border mx-2" />

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleFullscreen}
                        >
                          {isFullscreen ? (
                            <Minimize className="h-4 w-4" />
                          ) : (
                            <Maximize className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {userRole === "manager" && (
                    <>
                      <div className="h-6 w-px bg-border mx-2" />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDownload}
                              disabled={!pdfPath}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download PDF</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNavigate("prev")}
                          disabled={!canNavigatePrev}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Previous Change Order</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleNavigate("next")}
                          disabled={!canNavigateNext}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Next Change Order</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>

              {/* PDF Viewer */}
              <ScrollArea className="flex-1 border rounded-lg p-4 bg-muted/30">
                {isLoading && (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">
                      {isRetrying ? "Retrying..." : "Loading PDF..."}
                    </p>
                  </div>
                )}

                {pdfError && (
                  <div className="flex flex-col items-center justify-center h-full p-8">
                    <AlertCircle className="h-8 w-8 text-destructive mb-4" />
                    <p className="text-sm text-destructive text-center">{pdfError}</p>
                  </div>
                )}

                {pdfBlob && !pdfError && (
                  <div className="flex justify-center">
                    <PDFViewer
                      file={pdfBlob}
                      pageNumber={pageNumber}
                      scale={scale}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      onPageChange={(page) => setPageNumber(page)}
                      renderTextLayer={true}
                      className="w-full"
                    />
                  </div>
                )}
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="details" className="flex-1 mt-0 p-6">
            <ScrollArea className="h-full">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Change Order ID
                    </label>
                    <p className="text-lg font-semibold">{changeOrder.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <div className="mt-1">
                      <Badge variant="outline">{changeOrder.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Description
                    </label>
                    <p className="text-base">{changeOrder.description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Amount
                    </label>
                    <p className="text-lg font-semibold">
                      ${changeOrder.amount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Date
                    </label>
                    <p className="text-base">{changeOrder.date}</p>
                  </div>
                  {changeOrder.weightChanges && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Weight Changes (lbs)
                      </label>
                      <p className="text-base">{changeOrder.weightChanges.toLocaleString()}</p>
                    </div>
                  )}
                  {changeOrder.totalHours && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Total Hours
                      </label>
                      <p className="text-base">{changeOrder.totalHours}</p>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

