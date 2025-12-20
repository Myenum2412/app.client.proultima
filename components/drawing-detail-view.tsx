"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Clock,
  User,
  MessageSquare,
  History,
  Eye,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { DrawingYetToRelease } from "@/hooks/use-assets"
import { PDFViewer } from "@/components/pdf-viewer"

interface DrawingDetailViewProps {
  drawing: DrawingYetToRelease | null
  drawings: DrawingYetToRelease[]
  open: boolean
  onOpenChange: (open: boolean) => void
  userRole?: "staff" | "manager"
  userName?: string
}

interface Comment {
  id: string
  text: string
  author: string
  timestamp: Date
}

interface VersionHistory {
  id: string
  version: string
  date: Date
  author: string
  changes: string
}

interface ActivityLog {
  id: string
  action: string
  user: string
  timestamp: Date
}

// Helper function to generate multiple PDF path attempts for complex file names
function generatePdfPaths(drawing: DrawingYetToRelease): string[] {
  const basePath = "/assets/PRO-2025-001/Drawings-Yet-to-Release"
  const dwg = drawing.dwg
  const description = drawing.description
  
  // If explicit PDF path is provided, use it first and also try URL-encoded version
  if (drawing.pdfPath) {
    const paths = [drawing.pdfPath]
    // Also try with spaces URL encoded
    const pathParts = drawing.pdfPath.split('/')
    const filename = pathParts.pop() || ''
    const directory = pathParts.join('/')
    // Try with spaces as %20
    paths.push(`${directory}/${filename.replace(/ /g, '%20')}`)
    // Try with spaces as +
    paths.push(`${directory}/${filename.replace(/ /g, '+')}`)
    return paths
  }
  
  // Extract area from description (EAST, NORTH, WEST, SOUTH)
  const areaMatch = description.match(/(EAST|NORTH|WEST|SOUTH)/i)
  const area = areaMatch ? areaMatch[1].toUpperCase() : ""
  
  // Generate multiple path variations to handle different naming conventions
  const paths: string[] = []
  
  // Pattern 1: U2524_R-{number}_FFU {version}_{AREA} AREA WALL PANEL.pdf
  // Prioritize higher FFU versions first (05, 04, 03, 02) - most recent versions
  if (area) {
    for (const version of ["05", "04", "03", "02", "01"]) {
      // Standard pattern: U2524_R-1_FFU 04_EAST AREA WALL PANEL.pdf
      paths.push(`${basePath}/U2524_${dwg}_FFU ${version}_${area} AREA WALL PANEL.pdf`)
      // With space before area (some files have this): U2524_R-4_FFU 05_ NORTH AREA WALL PANEL.pdf
      paths.push(`${basePath}/U2524_${dwg}_FFU ${version}_ ${area} AREA WALL PANEL.pdf`)
      // Without AREA in the name: U2524_R-1_FFU 04_EAST WALL PANEL.pdf
      paths.push(`${basePath}/U2524_${dwg}_FFU ${version}_${area} WALL PANEL.pdf`)
    }
  }
  
  // Pattern 2: U2524 prefix with drawing number (fallback)
  paths.push(`${basePath}/U2524_${dwg}.pdf`)
  paths.push(`${basePath}/U2524_${dwg}_FFU.pdf`)
  
  // Pattern 3: Original drawing number (simple fallback)
  paths.push(`${basePath}/${dwg}.pdf`)
  
  // Pattern 4: With description variations (for other naming patterns)
  if (description) {
    // Convert description to match file pattern
    const descVariations = [
      description.replace(/PANELS/g, "AREA WALL PANEL"),
      description.replace(/WALL PANELS/g, "AREA WALL PANEL"),
      description.replace(/\s+/g, "_"),
      description.replace(/\s+/g, "-"),
      description.replace(/[^a-zA-Z0-9._-]/g, "_"),
    ]
    
    for (const descVar of descVariations) {
      paths.push(`${basePath}/U2524_${dwg}_${descVar}.pdf`)
      paths.push(`${basePath}/${dwg}_${descVar}.pdf`)
    }
  }
  
  // Pattern 5: URL encoded versions (for special characters)
  paths.push(`${basePath}/${encodeURIComponent(dwg)}.pdf`)
  if (description) {
    paths.push(`${basePath}/${encodeURIComponent(description)}.pdf`)
  }
  
  // Pattern 6: With spaces replaced
  paths.push(`${basePath}/${dwg.replace(/\s+/g, '_')}.pdf`)
  paths.push(`${basePath}/${dwg.replace(/\s+/g, '-')}.pdf`)
  
  // Pattern 7: Special characters removed
  paths.push(`${basePath}/${dwg.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`)
  
  // Remove duplicates and return (maintains order, so higher FFU versions are tried first)
  return [...new Set(paths)]
}

export function DrawingDetailView({
  drawing,
  drawings,
  open,
  onOpenChange,
  userRole = "staff",
  userName = "User",
}: DrawingDetailViewProps) {
  
  const [numPages, setNumPages] = React.useState<number>(0)
  const [pageNumber, setPageNumber] = React.useState<number>(1)
  const [scale, setScale] = React.useState<number>(1.0)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [pdfError, setPdfError] = React.useState<string | null>(null)
  const [pdfPath, setPdfPath] = React.useState<string | null>(null)
  const [pdfPathAttempts, setPdfPathAttempts] = React.useState<string[]>([])
  const [currentPathIndex, setCurrentPathIndex] = React.useState<number>(0)
  const [pdfBlob, setPdfBlob] = React.useState<Blob | null>(null)
  const [comments, setComments] = React.useState<Comment[]>([])
  const [notes, setNotes] = React.useState("")
  const [versionHistory, setVersionHistory] = React.useState<VersionHistory[]>([])
  const [activityLog, setActivityLog] = React.useState<ActivityLog[]>([])
  const [thumbnailPages, setThumbnailPages] = React.useState<number[]>([])
  const [isRetrying, setIsRetrying] = React.useState(false)
  const loadingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Helper to properly encode PDF path for react-pdf
  const getEncodedPdfPath = React.useCallback((path: string | null): string | null => {
    if (!path) return null
    // If path is already properly formatted or doesn't need encoding, return as is
    if (!path.includes(' ')) return path
    
    // Encode path parts that contain spaces or special characters
    const parts = path.split('/')
    const encoded = parts.map((part) => {
      // Keep empty strings and already encoded parts as-is
      if (part === '' || part.includes('%')) return part
      // Encode parts with spaces or special characters
      return encodeURIComponent(part)
    })
    return encoded.join('/')
  }, [])

  // TanStack Form for comments
  interface CommentFormData {
    comment: string
  }

  const commentForm = useForm({
    defaultValues: {
      comment: "",
    } as CommentFormData,
    onSubmit: async ({ value }) => {
      if (!value.comment.trim() || !drawing) return

      const comment: Comment = {
        id: Date.now().toString(),
        text: value.comment.trim(),
        author: userName,
        timestamp: new Date(),
      }

      const updatedComments = [...comments, comment]
      setComments(updatedComments)
      try {
        localStorage.setItem(`drawing-comments-${drawing.dwg}`, JSON.stringify(updatedComments))
      } catch (error) {
        console.error("Error saving comment:", error)
      }
      commentForm.reset()
    },
  })

  // TanStack Form for notes
  interface NotesFormData {
    notes: string
  }

  const notesForm = useForm({
    defaultValues: {
      notes: "",
    } as NotesFormData,
    onSubmit: async ({ value }) => {
      if (!drawing) return
      try {
        localStorage.setItem(`drawing-notes-${drawing.dwg}`, value.notes)
      } catch (error) {
        console.error("Error saving notes:", error)
      }
    },
  })

  const currentIndex = drawing ? drawings.findIndex((d) => d.dwg === drawing.dwg) : -1
  const canNavigatePrev = currentIndex > 0
  const canNavigateNext = currentIndex < drawings.length - 1

  // Check if PDF file exists and get it as blob (better for react-pdf)
  const findAndLoadPdf = React.useCallback(async (paths: string[]): Promise<{ url: string; blob?: Blob } | null> => {
    for (const path of paths) {
      try {
        // Try HEAD request first (faster)
        const headResponse = await fetch(path, { 
          method: 'HEAD', 
          cache: 'no-cache',
          headers: { 'Accept': 'application/pdf' }
        })
        
        if (headResponse.ok) {
          // File exists, now fetch as blob for react-pdf
          const blobResponse = await fetch(path, {
            cache: 'no-cache',
            headers: { 'Accept': 'application/pdf' }
          })
          
          if (blobResponse.ok) {
            const blob = await blobResponse.blob()
            // Create object URL from blob - react-pdf handles this better
            const objectUrl = URL.createObjectURL(blob)
            return { url: objectUrl, blob }
          }
        }
      } catch (error) {
        console.log(`Path ${path} not accessible:`, error)
        continue
      }
    }
    return null
  }, [])

  // Initialize PDF paths when drawing changes
  React.useEffect(() => {
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }

    if (drawing) {
      const paths = generatePdfPaths(drawing)
      console.log("Generated PDF paths for", drawing.dwg, ":", paths)
      
      // If pdfPath is explicitly provided, prioritize it and create minimal variations
      const allPaths: string[] = []
      
      if (drawing.pdfPath) {
        // Try to extract version from pdfPath and generate alternative versions
        const pathParts = drawing.pdfPath.split('/')
        const filename = pathParts.pop() || ''
        const directory = pathParts.join('/')
        
        // If filename has version pattern like "FFU 05", try other versions too
        const versionMatch = filename.match(/FFU\s+(\d+)/i)
        if (versionMatch) {
          const currentVersion = versionMatch[1]
          const versions = ["05", "04", "03", "02", "01"]
          // Try current version first, then others
          const versionSet = new Set([currentVersion, ...versions])
          versionSet.forEach(version => {
            const versionedFilename = filename.replace(/FFU\s+\d+/i, `FFU ${version}`)
            // Try original filename with version
            allPaths.push(`${directory}/${versionedFilename}`)
            // Try URL-encoded version
            allPaths.push(`${directory}/${encodeURIComponent(versionedFilename)}`)
          })
        } else {
          // No version pattern, just try original and encoded
          allPaths.push(drawing.pdfPath)
          const encodedFilename = encodeURIComponent(filename)
          if (encodedFilename !== filename) {
            allPaths.push(`${directory}/${encodedFilename}`)
          }
        }
      } else {
        // Only if no explicit pdfPath, use generated paths (limited to first 5)
        paths.slice(0, 5).forEach(path => {
          allPaths.push(path) // Original path first
          // URL encode only the filename part (spaces become %20)
          const pathParts = path.split('/')
          const filename = pathParts.pop() || ''
          const directory = pathParts.join('/')
          const encodedFilename = encodeURIComponent(filename)
          if (encodedFilename !== filename) {
            allPaths.push(`${directory}/${encodedFilename}`)
          }
        })
      }
      
      // Remove duplicates while preserving order
      const uniquePaths = Array.from(new Set(allPaths))
      console.log("All PDF path attempts (limited):", uniquePaths)
      setPdfPathAttempts(uniquePaths)
      setCurrentPathIndex(0)
      const firstPath = uniquePaths[0] || null
      setPdfPath(firstPath)
      setPageNumber(1)
      setScale(1.0)
      setIsLoading(true)
      setPdfError(null)
      setIsRetrying(false)

      // Use new fetch-based method to find and load PDF
      if (uniquePaths.length > 0) {
        // Clean up previous blob if exists
        setPdfBlob(null)

        findAndLoadPdf(uniquePaths).then((result) => {
          if (result && result.blob) {
            setPdfBlob(result.blob) // Store blob directly
            setPdfPath(result.url) // Keep URL for reference
            setIsLoading(false)
            setPdfError(null)
            // Clear timeout since we found the file
            if (loadingTimeoutRef.current) {
              clearTimeout(loadingTimeoutRef.current)
              loadingTimeoutRef.current = null
            }
          } else {
            // No file found, set error after timeout
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
              `PDF not found. Checked ${uniquePaths.length} path variations. The file may not exist or may be inaccessible.`
            )
          }
          return false
        })
      }, 5000)
    }

    // Cleanup timeout on unmount or when drawing changes
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }
  }, [drawing, findAndLoadPdf])

  // Load drawing data when it changes
  React.useEffect(() => {
    if (drawing && typeof window !== "undefined") {
      // Load comments, notes, version history from localStorage
      try {
        const savedComments = localStorage.getItem(`drawing-comments-${drawing.dwg}`)
        if (savedComments) {
          setComments(JSON.parse(savedComments))
        }

        const savedNotes = localStorage.getItem(`drawing-notes-${drawing.dwg}`)
        if (savedNotes) {
          setNotes(savedNotes)
          notesForm.setFieldValue("notes", savedNotes)
        } else {
          notesForm.setFieldValue("notes", "")
        }

        const savedVersions = localStorage.getItem(`drawing-versions-${drawing.dwg}`)
        if (savedVersions) {
          setVersionHistory(JSON.parse(savedVersions))
        } else {
          // Initialize with default version
          setVersionHistory([
            {
              id: "1",
              version: "1.0",
              date: new Date(drawing.latestSubmittedDate),
              author: "System",
              changes: "Initial release",
            },
          ])
        }

        // Log view activity
        const logEntry: ActivityLog = {
          id: Date.now().toString(),
          action: "Viewed drawing",
          user: userName,
          timestamp: new Date(),
        }
        const existingLogs = localStorage.getItem(`drawing-activity-${drawing.dwg}`)
        const logs = existingLogs ? JSON.parse(existingLogs) : []
        logs.push(logEntry)
        // Keep only last 50 entries
        const recentLogs = logs.slice(-50)
        localStorage.setItem(`drawing-activity-${drawing.dwg}`, JSON.stringify(recentLogs))
        setActivityLog(recentLogs)
      } catch (error) {
        console.error("Error loading drawing data:", error)
      }
    }
  }, [drawing, userName])

  // Generate thumbnails
  React.useEffect(() => {
    if (numPages > 0) {
      const pages = Array.from({ length: Math.min(numPages, 10) }, (_, i) => i + 1)
      setThumbnailPages(pages)
    }
  }, [numPages])

  // Retry with next path if current one fails (using new fetch method)
  const tryNextPath = React.useCallback(async () => {
    // Clear existing timeout and blob
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
    setPdfBlob(null)

    if (currentPathIndex < pdfPathAttempts.length - 1) {
      const nextIndex = currentPathIndex + 1
      setCurrentPathIndex(nextIndex)
      setIsRetrying(true)
      setIsLoading(true)
      setPdfError(null)

      // Try remaining paths
      const remainingPaths = pdfPathAttempts.slice(nextIndex)
      const result = await findAndLoadPdf(remainingPaths)
      
      if (result && result.blob) {
        setPdfBlob(result.blob)
        setPdfPath(result.url)
        setIsLoading(false)
        setIsRetrying(false)
        setPdfError(null)
      } else {
        // Set timeout if still no file found
        loadingTimeoutRef.current = setTimeout(() => {
          setIsLoading(false)
          setPdfError(
            `PDF file not found. Tried ${pdfPathAttempts.length} different path variations.`
          )
          setIsRetrying(false)
        }, 3000)
      }
    } else {
      setIsLoading(false)
      setPdfError(
        `PDF file not found. Tried ${pdfPathAttempts.length} different path variations. Please ensure the file exists in the correct location.`
      )
      setIsRetrying(false)
    }
  }, [currentPathIndex, pdfPathAttempts, findAndLoadPdf])

  const onDocumentLoadSuccess = (numPages: number) => {
    console.log("PDF loaded successfully")
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

  const onDocumentLoadError = (error: Error) => {
    console.error("PDF load error:", error)
    console.error("Current path:", pdfPath)
    console.error("All attempted paths:", pdfPathAttempts)
    
    // Clear loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
    
    // Try next path if available
    if (currentPathIndex < pdfPathAttempts.length - 1) {
      console.log(`Retrying with path ${currentPathIndex + 2}/${pdfPathAttempts.length}:`, pdfPathAttempts[currentPathIndex + 1])
      setTimeout(() => tryNextPath(), 500)
    } else {
      setIsLoading(false)
      const attemptedPaths = pdfPathAttempts.map(p => p.split('/').pop()).join(', ')
      setPdfError(
        `Failed to load PDF. The file may not exist or may be corrupted. Tried ${pdfPathAttempts.length} different path variations: ${attemptedPaths}`
      )
      setIsRetrying(false)
    }
  }

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0))
  }

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5))
  }

  const handlePreviousPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1))
  }

  const handleNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages))
  }

  const handlePreviousDrawing = () => {
    if (canNavigatePrev && drawing) {
      const prevDrawing = drawings[currentIndex - 1]
      onOpenChange(false)
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("drawing-navigate", { detail: { drawing: prevDrawing } })
        )
      }, 100)
    }
  }

  const handleNextDrawing = () => {
    if (canNavigateNext && drawing) {
      const nextDrawing = drawings[currentIndex + 1]
      onOpenChange(false)
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent("drawing-navigate", { detail: { drawing: nextDrawing } })
        )
      }, 100)
    }
  }

  const handleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        const element = document.getElementById("pdf-viewer-container")
        if (element?.requestFullscreen) {
          await element.requestFullscreen()
          setIsFullscreen(true)
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
          setIsFullscreen(false)
        }
      }
    } catch (error) {
      console.error("Fullscreen error:", error)
    }
  }

  // Listen for fullscreen changes
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Update notes form when notes state changes (for syncing with localStorage)
  React.useEffect(() => {
    if (notes !== notesForm.state.values.notes) {
      notesForm.setFieldValue("notes", notes)
    }
  }, [notes])

  // Save notes on blur
  const handleNotesBlur = () => {
    notesForm.handleSubmit()
  }

  const handleDownload = () => {
    if (!pdfPath || userRole !== "manager") {
      alert("Download permission denied. Only managers can download files.")
      return
    }

    if (!drawing) return

    try {
      // Create a temporary link to download
      const link = document.createElement("a")
      link.href = pdfPath
      link.download = `${drawing.dwg.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error("Download error:", error)
      alert("Failed to download PDF. Please try again.")
    }
  }

  if (!drawing) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0 bg-gradient-to-r from-background to-muted/30">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl font-bold tracking-tight truncate">
                  {drawing.dwg}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {drawing.description}
                </DialogDescription>
              </div>
              {pdfError && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-destructive/10 text-destructive border border-destructive/20 cursor-help">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">Error</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-xs">
                    <p className="text-xs">{pdfError}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs defaultValue="viewer" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-6 mt-4 shrink-0 h-10">
                <TabsTrigger value="viewer" className="text-sm font-medium">
                  PDF Viewer
                </TabsTrigger>
                <TabsTrigger value="details" className="text-sm font-medium">
                  Details
                </TabsTrigger>
                <TabsTrigger value="comments" className="text-sm font-medium">
                  Comments
                </TabsTrigger>
                <TabsTrigger value="history" className="text-sm font-medium">
                  Version History
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-sm font-medium">
                  Activity Log
                </TabsTrigger>
              </TabsList>

              {/* PDF Viewer Tab */}
              <TabsContent value="viewer" className="flex-1 overflow-hidden flex flex-col mt-0">
                <div
                  id="pdf-viewer-container"
                  className="flex-1 overflow-auto bg-muted/20 p-4 flex flex-col"
                >
                  {/* PDF Viewer Controls */}
                  <div className="flex items-center justify-between mb-4 shrink-0 bg-background/95 backdrop-blur-sm p-3 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePreviousDrawing}
                            disabled={!canNavigatePrev}
                            className="h-9 w-9"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Previous Drawing</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNextDrawing}
                            disabled={!canNavigateNext}
                            className="h-9 w-9"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Next Drawing</TooltipContent>
                      </Tooltip>
                      <div className="h-6 w-px bg-border mx-1" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleZoomOut}
                            disabled={scale <= 0.5}
                            className="h-9 w-9"
                          >
                            <ZoomOut className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zoom Out (Current: {Math.round(scale * 100)}%)</TooltipContent>
                      </Tooltip>
                      <span className="text-sm font-semibold min-w-[65px] text-center px-2">
                        {Math.round(scale * 100)}%
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleZoomIn}
                            disabled={scale >= 3.0}
                            className="h-9 w-9"
                          >
                            <ZoomIn className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Zoom In (Current: {Math.round(scale * 100)}%)</TooltipContent>
                      </Tooltip>
                      <div className="h-6 w-px bg-border mx-1" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handlePreviousPage}
                            disabled={pageNumber <= 1 || isLoading}
                            className="h-9 w-9"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Previous Page</TooltipContent>
                      </Tooltip>
                      <span className="text-sm font-semibold min-w-[110px] text-center px-2">
                        Page {pageNumber} of {numPages || "—"}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleNextPage}
                            disabled={pageNumber >= numPages || isLoading}
                            className="h-9 w-9"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Next Page</TooltipContent>
                      </Tooltip>
                      <div className="h-6 w-px bg-border mx-1" />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleFullscreen}
                            className="h-9 w-9"
                          >
                            {isFullscreen ? (
                              <Minimize className="h-4 w-4" />
                            ) : (
                              <Maximize className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}</TooltipContent>
                      </Tooltip>
                      {userRole === "manager" && (
                        <>
                          <div className="h-6 w-px bg-border mx-1" />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={handleDownload}
                                disabled={!pdfPath || !!pdfError}
                                className="h-9 w-9"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Download PDF (Manager Only)</TooltipContent>
                          </Tooltip>
                        </>
                      )}
                    </div>
                  </div>

                  {/* PDF Document */}
                  <div className="flex-1 overflow-auto flex justify-center items-start p-4">
                    {isLoading && (
                      <div className="flex flex-col items-center justify-center h-full w-full max-w-4xl">
                        <div className="relative">
                          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                          {isRetrying && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs text-muted-foreground animate-pulse">Retrying...</span>
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mb-6">
                          {isRetrying ? "Trying alternative file path..." : "Loading PDF..."}
                        </p>
                        {/* Enhanced PDF Skeleton */}
                        <div className="w-full max-w-[612px] space-y-2">
                          <div className="w-full h-[792px] bg-background border-2 border-dashed border-muted-foreground/20 rounded-lg animate-pulse relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50" />
                            <div className="absolute top-4 left-4 right-4 h-8 bg-muted-foreground/10 rounded animate-pulse" />
                            <div className="absolute top-16 left-4 right-4 h-4 bg-muted-foreground/10 rounded animate-pulse" />
                            <div className="absolute top-24 left-4 right-4 h-4 bg-muted-foreground/10 rounded animate-pulse" />
                            <div className="absolute bottom-4 left-4 right-4 h-8 bg-muted-foreground/10 rounded animate-pulse" />
                          </div>
                        </div>
                      </div>
                    )}

                    {pdfError && !isLoading && (
                      <div className="flex flex-col items-center justify-center h-full w-full max-w-md p-8">
                        <div className="rounded-full bg-destructive/10 p-4 mb-4">
                          <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">PDF Not Available</h3>
                        <p className="text-sm text-muted-foreground text-center mb-4 leading-relaxed">
                          {pdfError}
                        </p>
                        <div className="flex flex-col gap-2 w-full">
                          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                            <p className="font-medium mb-1">Tried paths:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {pdfPathAttempts.slice(0, 3).map((path, idx) => (
                                <li key={idx} className="truncate font-mono text-[10px]">
                                  {path.split("/").pop()}
                                </li>
                              ))}
                              {pdfPathAttempts.length > 3 && (
                                <li className="text-muted-foreground">
                                  ... and {pdfPathAttempts.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isLoading && !pdfError && pdfBlob && (
                      <div className="flex gap-4 w-full max-w-7xl">
                        {/* Thumbnail Sidebar */}
                        {thumbnailPages.length > 0 && (
                          <ScrollArea className="w-36 h-[calc(90vh-200px)] border-r pr-3 shrink-0">
                            <div className="space-y-3 py-2">
                              {thumbnailPages.map((pageNum) => (
                                <Tooltip key={pageNum}>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={cn(
                                        "cursor-pointer border-2 rounded-md p-1.5 transition-all hover:border-primary/50",
                                        pageNum === pageNumber
                                          ? "border-primary bg-primary/10 shadow-sm"
                                          : "border-muted hover:bg-muted/50"
                                      )}
                                      onClick={() => setPageNumber(pageNum)}
                                    >
                                      <PDFViewer
                                        file={pdfBlob}
                                        pageNumber={pageNum}
                                        scale={0.2}
                                        renderTextLayer={false}
                                        className="rounded"
                                      />
                                      <p className="text-xs text-center mt-1.5 font-medium">
                                        Page {pageNum}
                                      </p>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Go to page {pageNum}</TooltipContent>
                                </Tooltip>
                              ))}
                            </div>
                          </ScrollArea>
                        )}

                        {/* Main PDF View */}
                        <div className="flex-1 flex flex-col items-center min-w-0">
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
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Details Tab */}
              <TabsContent value="details" className="flex-1 overflow-auto mt-0">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-muted-foreground">
                          Drawing Number
                        </Label>
                        <p className="text-lg font-semibold text-foreground">{drawing.dwg}</p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-muted-foreground">Status</Label>
                        <div className="mt-1">
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                            {drawing.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-muted-foreground">
                          Latest Submitted Date
                        </Label>
                        <p className="text-lg font-semibold text-foreground">
                          {drawing.latestSubmittedDate}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-muted-foreground">
                          Release Status
                        </Label>
                        <p className="text-lg font-semibold text-foreground">
                          {drawing.releaseStatus || (
                            <span className="text-muted-foreground">Not released</span>
                          )}
                        </p>
                      </div>
                      <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-sm font-semibold text-muted-foreground">
                          Description
                        </Label>
                        <p className="text-lg font-semibold text-foreground leading-relaxed">
                          {drawing.description}
                        </p>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-muted-foreground">
                          Assigned Team Member
                        </Label>
                        <div className="flex items-center gap-2.5 mt-1">
                          <Avatar className="h-9 w-9 border-2 border-border">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              TM
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-lg font-semibold text-foreground">Team Member</p>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-semibold text-muted-foreground">Revision</Label>
                        <p className="text-lg font-semibold text-foreground">
                          {versionHistory[0]?.version || "1.0"}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-6 space-y-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-semibold">Internal Notes</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">Notes are saved automatically when you click outside</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <notesForm.Field name="notes">
                        {(field) => (
                          <Textarea
                            value={field.state.value}
                            onChange={(e) => {
                              field.handleChange(e.target.value)
                              setNotes(e.target.value)
                            }}
                            onBlur={() => {
                              field.handleBlur()
                              handleNotesBlur()
                            }}
                            placeholder="Add internal notes about this drawing..."
                            className="min-h-[150px] resize-none"
                          />
                        )}
                      </notesForm.Field>
                      <p className="text-xs text-muted-foreground">
                        Notes are saved automatically when you click outside the text area.
                      </p>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Comments Tab */}
              <TabsContent value="comments" className="flex-1 overflow-auto mt-0">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-6">
                    <div className="space-y-4">
                      {comments.length > 0 ? (
                        comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <Avatar className="h-9 w-9 border-2 border-border shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {comment.author.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <p className="font-semibold text-sm text-foreground">
                                    {comment.author}
                                  </p>
                                  <span className="text-xs text-muted-foreground">
                                    {format(comment.timestamp, "MMM dd, yyyy h:mm a")}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words">
                                  {comment.text}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                          <p className="text-sm font-medium text-muted-foreground mb-1">
                            No comments yet
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Be the first to comment on this drawing
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-6 space-y-3">
                      <Label className="text-sm font-semibold">Add Comment</Label>
                      <commentForm.Field
                        name="comment"
                        validators={{
                          onChange: ({ value }) => {
                            if (!value.trim()) return "Comment cannot be empty"
                            return undefined
                          },
                        }}
                      >
                        {(field) => (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              commentForm.handleSubmit()
                            }}
                            className="space-y-3"
                          >
                            <div className="flex gap-3">
                              <Textarea
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                                placeholder="Write a comment..."
                                className={cn(
                                  "min-h-[100px] resize-none flex-1",
                                  field.state.meta.errors.length > 0 && "border-destructive"
                                )}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && e.ctrlKey) {
                                    e.preventDefault()
                                    commentForm.handleSubmit()
                                  }
                                }}
                              />
                              <Button
                                type="submit"
                                disabled={!field.state.value.trim() || commentForm.state.isSubmitting}
                                className="shrink-0"
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Post
                              </Button>
                            </div>
                            {field.state.meta.errors.length > 0 && (
                              <p className="text-sm text-destructive">
                                {field.state.meta.errors[0]}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Press Ctrl+Enter to submit
                            </p>
                          </form>
                        )}
                      </commentForm.Field>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Version History Tab */}
              <TabsContent value="history" className="flex-1 overflow-auto mt-0">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-4">
                    {versionHistory.length > 0 ? (
                      versionHistory.map((version) => (
                        <div
                          key={version.id}
                          className="border rounded-lg p-4 bg-card hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                              <History className="h-4 w-4 text-muted-foreground" />
                              <p className="font-semibold text-foreground">
                                Version {version.version}
                              </p>
                            </div>
                            <Badge variant="outline" className="shrink-0">
                              {format(version.date, "MMM dd, yyyy")}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            <span>By {version.author}</span>
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{version.changes}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <History className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-sm font-medium text-muted-foreground">
                          No version history available
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              {/* Activity Log Tab */}
              <TabsContent value="activity" className="flex-1 overflow-auto mt-0">
                <ScrollArea className="h-full">
                  <div className="p-6 space-y-3">
                    {activityLog.length > 0 ? (
                      activityLog.map((log) => (
                        <div
                          key={log.id}
                          className="flex items-start gap-3 border-b pb-3 last:border-0 hover:bg-muted/30 rounded-md p-2 -mx-2 transition-colors"
                        >
                          <Eye className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{log.action}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                              <div className="flex items-center gap-1.5">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">{log.user}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {format(log.timestamp, "MMM dd, yyyy h:mm a")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Eye className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-sm font-medium text-muted-foreground">
                          No activity logged yet
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
  )
}
