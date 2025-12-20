"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface EvaluationLogFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectNumber?: string
  projectName?: string
  estimatedTons?: number
}

interface EvaluationData {
  projectNumber: string
  projectName: string
  estimatedTons: number
  evaluationDate: Date | undefined
  status: string
  notes: string
}

export function EvaluationLogForm({
  open,
  onOpenChange,
  projectNumber = "",
  projectName = "",
  estimatedTons = 0,
}: EvaluationLogFormProps) {
  const [formData, setFormData] = useState<EvaluationData>({
    projectNumber,
    projectName,
    estimatedTons,
    evaluationDate: new Date(),
    status: "pending",
    notes: "",
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form data when props change
  useEffect(() => {
    if (open) {
      setFormData((prev) => ({
        ...prev,
        projectNumber,
        projectName,
        estimatedTons,
      }))
    }
  }, [open, projectNumber, projectName, estimatedTons])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // TODO: Save evaluation to database
      console.log("Evaluation data:", formData)

      // Reset form
      setFormData({
        projectNumber: "",
        projectName: "",
        estimatedTons: 0,
        evaluationDate: new Date(),
        status: "pending",
        notes: "",
      })
      onOpenChange(false)
      
      // Show success message
      alert("Evaluation log created successfully!")
    } catch (error) {
      console.error("Failed to save evaluation:", error)
      alert("Failed to save evaluation. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      projectNumber: "",
      projectName: "",
      estimatedTons: 0,
      evaluationDate: new Date(),
      status: "pending",
      notes: "",
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Evaluation Log</DialogTitle>
          <DialogDescription>
            Create a new evaluation log entry for this project
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Project Number */}
          <div className="space-y-2">
            <Label htmlFor="project-number">Project Number</Label>
            <Input
              id="project-number"
              value={formData.projectNumber}
              onChange={(e) =>
                setFormData({ ...formData, projectNumber: e.target.value })
              }
              readOnly
              className="bg-muted"
            />
          </div>

          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={formData.projectName}
              onChange={(e) =>
                setFormData({ ...formData, projectName: e.target.value })
              }
              readOnly
              className="bg-muted"
            />
          </div>

          {/* Estimated Tons */}
          <div className="space-y-2">
            <Label htmlFor="estimated-tons">Estimated Tons</Label>
            <Input
              id="estimated-tons"
              type="number"
              value={formData.estimatedTons}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimatedTons: parseFloat(e.target.value) || 0,
                })
              }
              required
            />
          </div>

          {/* Evaluation Date and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Evaluation Date <span className="text-destructive">*</span>
              </Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.evaluationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.evaluationDate ? (
                      format(formData.evaluationDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.evaluationDate}
                    onSelect={(date) => {
                      setFormData({ ...formData, evaluationDate: date })
                      setIsCalendarOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
                required
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter evaluation notes or comments"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Evaluation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

