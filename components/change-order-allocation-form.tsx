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
import { ChangeOrderAllocation } from "@/components/change-order-allocations-table"

interface ChangeOrderAllocationFormProps {
  allocation?: ChangeOrderAllocation
  onSuccess?: () => void
  triggerClassName?: string
  trigger?: React.ReactNode
  availableRequests?: Array<{ id: string; coNumber: string; project: string }>
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ChangeOrderAllocationForm({
  allocation,
  onSuccess,
  triggerClassName,
  trigger,
  availableRequests = [],
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ChangeOrderAllocationFormProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen
  const [formData, setFormData] = useState({
    allocationNumber: "",
    requestId: "",
    coNumber: "",
    project: "",
    projectNumber: "",
    description: "",
    status: "allocated" as const,
    allocatedTo: "",
    allocatedDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    actualDeliveryDate: "",
    location: "",
    revisionTime: "",
    notes: "",
  })

  useEffect(() => {
    if (allocation) {
      setFormData({
        allocationNumber: allocation.allocationNumber || "",
        requestId: allocation.requestId || "",
        coNumber: allocation.coNumber || "",
        project: allocation.project || "",
        projectNumber: allocation.projectNumber || "",
        description: allocation.description || "",
        status: allocation.status || "allocated",
        allocatedTo: allocation.allocatedTo || "",
        allocatedDate: allocation.allocatedDate
          ? new Date(allocation.allocatedDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        expectedDeliveryDate: allocation.expectedDeliveryDate
          ? new Date(allocation.expectedDeliveryDate).toISOString().split("T")[0]
          : "",
        actualDeliveryDate: allocation.actualDeliveryDate
          ? new Date(allocation.actualDeliveryDate).toISOString().split("T")[0]
          : "",
        location: allocation.location || "",
        revisionTime: allocation.revisionTime?.toString() || "",
        notes: allocation.notes || "",
      })
    } else if (!open) {
      // Reset form when dialog closes and no allocation is being edited
      setFormData({
        allocationNumber: "",
        requestId: "",
        coNumber: "",
        project: "",
        projectNumber: "",
        description: "",
        status: "allocated",
        allocatedTo: "",
        allocatedDate: new Date().toISOString().split("T")[0],
        expectedDeliveryDate: "",
        actualDeliveryDate: "",
        location: "",
        revisionTime: "",
        notes: "",
      })
    }
  }, [allocation, open])

  // Update CO number and project when request is selected
  useEffect(() => {
    if (formData.requestId && availableRequests.length > 0) {
      const selectedRequest = availableRequests.find((r) => r.id === formData.requestId)
      if (selectedRequest) {
        setFormData((prev) => ({
          ...prev,
          coNumber: selectedRequest.coNumber,
          project: selectedRequest.project,
        }))
      }
    }
  }, [formData.requestId, availableRequests])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validate required fields
    if (!formData.allocationNumber || !formData.requestId || !formData.project) {
      alert("Please fill in all required fields")
      return
    }

    // Handle form submission
    const submissionData = {
      ...formData,
      revisionTime: formData.revisionTime ? parseFloat(formData.revisionTime) : undefined,
    }
    console.log("Change order allocation submitted:", submissionData)
    onSuccess?.()
    setOpen(false)
    // Reset form if creating new
    if (!allocation) {
      setFormData({
        allocationNumber: "",
        requestId: "",
        coNumber: "",
        project: "",
        projectNumber: "",
        description: "",
        status: "allocated",
        allocatedTo: "",
        allocatedDate: new Date().toISOString().split("T")[0],
        expectedDeliveryDate: "",
        actualDeliveryDate: "",
        location: "",
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
            {allocation ? "Edit Allocation" : "New Change Order Allocation"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {allocation ? "Edit Change Order Allocation" : "Create Change Order Allocation"}
          </DialogTitle>
          <DialogDescription>
            {allocation
              ? "Update change order allocation information"
              : "Fill in the details to create a new change order allocation"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="allocationNumber">
                Allocation Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="allocationNumber"
                value={formData.allocationNumber}
                onChange={(e) =>
                  setFormData({ ...formData, allocationNumber: e.target.value })
                }
                placeholder="e.g., ALLOC-001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestId">
                Request ID <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.requestId}
                onValueChange={(value) => setFormData({ ...formData, requestId: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select request" />
                </SelectTrigger>
                <SelectContent>
                  {availableRequests.map((req) => (
                    <SelectItem key={req.id} value={req.id}>
                      {req.coNumber} - {req.project}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coNumber">CO Number</Label>
              <Input
                id="coNumber"
                value={formData.coNumber}
                onChange={(e) => setFormData({ ...formData, coNumber: e.target.value })}
                placeholder="Auto-filled from request"
                readOnly
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
              placeholder="Auto-filled from request"
              required
              readOnly={!!formData.requestId}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the allocation..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(
                  value: "allocated" | "in-transit" | "delivered" | "completed" | "cancelled"
                ) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allocated">Allocated</SelectItem>
                  <SelectItem value="in-transit">In Transit</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
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
              <Label htmlFor="allocatedTo">Allocated To</Label>
              <Input
                id="allocatedTo"
                value={formData.allocatedTo}
                onChange={(e) => setFormData({ ...formData, allocatedTo: e.target.value })}
                placeholder="Enter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allocatedDate">Allocated Date</Label>
              <Input
                id="allocatedDate"
                type="date"
                value={formData.allocatedDate}
                onChange={(e) => setFormData({ ...formData, allocatedDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
              <Input
                id="expectedDeliveryDate"
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expectedDeliveryDate: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actualDeliveryDate">Actual Delivery Date</Label>
              <Input
                id="actualDeliveryDate"
                type="date"
                value={formData.actualDeliveryDate}
                onChange={(e) =>
                  setFormData({ ...formData, actualDeliveryDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Site A - Warehouse 1"
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
            <Button type="submit">{allocation ? "Update" : "Create"} Allocation</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

