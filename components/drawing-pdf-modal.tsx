"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface DrawingPdfModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pdfUrl: string
  title: string
  description?: string
}

export function DrawingPdfModal({
  open,
  onOpenChange,
  pdfUrl,
  title,
  description,
}: DrawingPdfModalProps) {
  if (!pdfUrl) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-screen-xl w-full min-w-[95vw] max-h-[95vh] h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 shrink-0 w-full">
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="flex-1 px-6 pb-6 min-h-0 overflow-hidden">
          <iframe
            src={pdfUrl}
            className="w-full h-full border rounded-md"
            title={title}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

