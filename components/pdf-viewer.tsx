"use client"

import * as React from "react"
import { Loader2, AlertCircle } from "lucide-react"

// Dynamically import pdfjs-dist only on client side
let pdfjsLib: any = null
if (typeof window !== "undefined") {
  import("pdfjs-dist").then((module) => {
    pdfjsLib = module
    // Set up PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
  })
}

interface PDFViewerProps {
  file: string | Blob | ArrayBuffer | null
  pageNumber?: number
  scale?: number
  onLoadSuccess?: (numPages: number) => void
  onLoadError?: (error: Error) => void
  onPageChange?: (pageNumber: number) => void
  className?: string
  renderTextLayer?: boolean
}

export function PDFViewer({
  file,
  pageNumber = 1,
  scale = 1.0,
  onLoadSuccess,
  onLoadError,
  onPageChange,
  className = "",
  renderTextLayer = true,
}: PDFViewerProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const textLayerRef = React.useRef<HTMLDivElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [pdfDocument, setPdfDocument] = React.useState<any>(null)
  const [totalPages, setTotalPages] = React.useState(0)
  const [currentPage, setCurrentPage] = React.useState(pageNumber)
  const [pdfjsReady, setPdfjsReady] = React.useState(false)

  // Load pdfjs-dist on client side
  React.useEffect(() => {
    if (typeof window !== "undefined" && !pdfjsReady) {
      import("pdfjs-dist").then((module) => {
        pdfjsLib = module
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`
        setPdfjsReady(true)
      }).catch((err) => {
        setError("Failed to load PDF.js library")
        setLoading(false)
      })
    }
  }, [pdfjsReady])

  // Load PDF document
  React.useEffect(() => {
    if (!file || !pdfjsReady || !pdfjsLib) {
      if (!file) {
        setError("No PDF file provided")
        setLoading(false)
      }
      return
    }

    setLoading(true)
    setError(null)

    const loadDocument = async () => {
      try {
        let loadingTask: Promise<any>

        if (file instanceof Blob) {
          const arrayBuffer = await file.arrayBuffer()
          loadingTask = pdfjsLib.getDocument({ data: arrayBuffer }).promise
        } else if (file instanceof ArrayBuffer) {
          loadingTask = pdfjsLib.getDocument({ data: file }).promise
        } else {
          // String URL
          loadingTask = pdfjsLib.getDocument({ url: file, withCredentials: false }).promise
        }

        const pdf = await loadingTask
        setPdfDocument(pdf)
        setTotalPages(pdf.numPages)
        setLoading(false)

        if (onLoadSuccess) {
          onLoadSuccess(pdf.numPages)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load PDF"
        setError(errorMessage)
        setLoading(false)
        if (onLoadError) {
          onLoadError(err instanceof Error ? err : new Error(errorMessage))
        }
      }
    }

    loadDocument()
  }, [file, onLoadSuccess, onLoadError, pdfjsReady])

  // Render PDF page
  React.useEffect(() => {
    if (!pdfDocument || !canvasRef.current || currentPage < 1 || currentPage > totalPages || !pdfjsLib) {
      return
    }

    const renderPage = async () => {
      try {
        setLoading(true)
        const page = await pdfDocument.getPage(currentPage)
        const canvas = canvasRef.current
        if (!canvas) return

        const viewport = page.getViewport({ scale })
        canvas.height = viewport.height
        canvas.width = viewport.width

        const context = canvas.getContext("2d")
        if (!context) return

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }

        await page.render(renderContext).promise

        // Render text layer if enabled (simple implementation)
        if (renderTextLayer && textLayerRef.current) {
          try {
            textLayerRef.current.innerHTML = ""
            const textContent = await page.getTextContent()
            const textLayerDiv = textLayerRef.current

            // Simple text layer rendering
            textContent.items.forEach((item: any) => {
              if (item.str) {
                const textDiv = document.createElement("span")
                textDiv.textContent = item.str
                textDiv.style.position = "absolute"
                textDiv.style.left = `${item.transform[4]}px`
                textDiv.style.top = `${viewport.height - item.transform[5]}px`
                textDiv.style.fontSize = `${Math.abs(item.transform[0])}px`
                textDiv.style.fontFamily = item.fontName || "sans-serif"
                textDiv.style.color = "transparent"
                textDiv.style.userSelect = "text"
                textDiv.style.cursor = "text"
                textLayerDiv.appendChild(textDiv)
              }
            })
          } catch (err) {
            console.warn("Failed to render text layer:", err)
          }
        }

        setLoading(false)

        if (onPageChange) {
          onPageChange(currentPage)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to render PDF page"
        setError(errorMessage)
        setLoading(false)
      }
    }

    renderPage()
  }, [pdfDocument, currentPage, scale, totalPages, renderTextLayer, onPageChange])

  // Update current page when pageNumber prop changes
  React.useEffect(() => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }, [pageNumber, totalPages])

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <AlertCircle className="h-8 w-8 text-destructive mb-4" />
        <p className="text-sm text-destructive text-center">{error}</p>
      </div>
    )
  }

  if (loading && !pdfDocument) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Loading PDF...</p>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="shadow-xl rounded-lg border border-border/50 bg-white max-w-full h-auto"
        />
        {renderTextLayer && (
          <div
            ref={textLayerRef}
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{
              opacity: 0.2,
            }}
          />
        )}
      </div>
    </div>
  )
}

