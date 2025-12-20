"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus } from "lucide-react"
import { ChangeOrderRequest } from "@/components/change-order-requests-table"

interface ChangeOrderRequestFormProps {
  request?: ChangeOrderRequest
  onSuccess?: () => void
  triggerClassName?: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ChangeOrderRequestForm({
  request,
  onSuccess,
  triggerClassName,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ChangeOrderRequestFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen
  const [formData, setFormData] = useState({
    coNumber: "",
    project: "",
    projectNumber: "",
    description: "",
    priority: "medium" as const,
    requestedBy: "",
    requestedDate: new Date().toISOString().split("T")[0],
    requiredDate: "",
    revisionTime: "",
    notes: "",
  })

  useEffect(() => {
    if (request) {
      setFormData({
        coNumber: request.coNumber || "",
        project: request.project || "",
        projectNumber: request.projectNumber || "",
        description: request.description || "",
        priority: request.priority || "medium",
        requestedBy: request.requestedBy || "",
        requestedDate: request.requestedDate
          ? new Date(request.requestedDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        requiredDate: request.requiredDate
          ? new Date(request.requiredDate).toISOString().split("T")[0]
          : "",
        revisionTime: request.revisionTime?.toString() || "",
        notes: request.notes || "",
      })
    } else if (!open) {
      // Reset form when dialog closes and no request is being edited
      setFormData({
        coNumber: "",
        project: "",
        projectNumber: "",
        description: "",
        priority: "medium",
        requestedBy: "",
        requestedDate: new Date().toISOString().split("T")[0],
        requiredDate: "",
        revisionTime: "",
        notes: "",
      })
    }
  }, [request, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate required fields
    if (!formData.coNumber || !formData.project || !formData.description) {
      alert("Please fill in all required fields")
      return
    }

    // Handle form submission
    const submissionData = {
      ...formData,
      revisionTime: formData.revisionTime ? parseFloat(formData.revisionTime) : undefined,
    }
    console.log("Change order request submitted:", submissionData)
    onSuccess?.()
    setOpen(false)
    // Reset form if creating new
    if (!request) {
      setFormData({
        coNumber: "",
        project: "",
        projectNumber: "",
        description: "",
        priority: "medium",
        requestedBy: "",
        requestedDate: new Date().toISOString().split("T")[0],
        requiredDate: "",
        revisionTime: "",
        notes: "",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <DialogTrigger asChild>
          <Button className={triggerClassName}>
            <Plus className="mr-2 h-4 w-4" />
            {request ? "Edit Request" : "New Change Order Request"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {request ? "Edit Change Order Request" : "Create Change Order Request"}
          </DialogTitle>
          <DialogDescription>
            {request
              ? "Update change order request information"
              : "Fill in the details to create a new change order request"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coNumber">
                CO Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="coNumber"
                value={formData.coNumber}
                onChange={(e) => setFormData({ ...formData, coNumber: e.target.value })}
                placeholder="e.g., U2524 - CO #001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="projectNumber">Project Number</Label>
              <Input
                id="projectNumber"
                value={formData.projectNumber}
                onChange={(e) => setFormData({ ...formData, projectNumber: e.target.value })}
                placeholder="e.g., U2524"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">
              Project <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project"
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              placeholder="e.g., Valley View Business Park"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the change order request..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: "low" | "medium" | "high" | "urgent") =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="revisionTime">Revision Time (hours)</Label>
              <Input
                id="revisionTime"
                type="number"
                step="0.01"
                value={formData.revisionTime}
                onChange={(e) => setFormData({ ...formData, revisionTime: e.target.value })}
                placeholder="e.g., 8.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="requestedBy">Requested By</Label>
              <Input
                id="requestedBy"
                value={formData.requestedBy}
                onChange={(e) => setFormData({ ...formData, requestedBy: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestedDate">Requested Date</Label>
              <Input
                id="requestedDate"
                type="date"
                value={formData.requestedDate}
                onChange={(e) => setFormData({ ...formData, requestedDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requiredDate">Required Date</Label>
            <Input
              id="requiredDate"
              type="date"
              value={formData.requiredDate}
              onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes or comments..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">{request ? "Update" : "Create"} Request</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

