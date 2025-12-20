"use client"

import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Trash2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface DrawingChange {
  id: string
  dwgNumber: string
  description: string
  revTime?: number
}

interface ChangeOrderFormData {
  project: string
  date: string
  jobNo: string
  coNo: string
  substructureRevised: string
  client: string
  placingDrawingRef: string
  contractDrawingRef: string
  responsibleForRevision: {
    structuralEngineer: boolean
    generalContractor: boolean
    fabricators: boolean
  }
  drawingChanges: DrawingChange[]
  remarks: string
  revisionApprovedBy: string
}

interface ChangeOrderFormProps {
  changeOrder?: Partial<ChangeOrderFormData>
  onSuccess?: () => void
  onCancel?: () => void
}

export function ChangeOrderForm({ changeOrder, onSuccess, onCancel }: ChangeOrderFormProps) {
  const [drawingChanges, setDrawingChanges] = useState<DrawingChange[]>(
    changeOrder?.drawingChanges || [
      { id: "1", dwgNumber: "", description: "", revTime: undefined }
    ]
  )

  const form = useForm({
    defaultValues: {
      project: changeOrder?.project || "",
      date: changeOrder?.date || new Date().toISOString().split('T')[0],
      jobNo: changeOrder?.jobNo || "",
      coNo: changeOrder?.coNo || "",
      substructureRevised: changeOrder?.substructureRevised || "",
      client: changeOrder?.client || "",
      placingDrawingRef: changeOrder?.placingDrawingRef || "",
      contractDrawingRef: changeOrder?.contractDrawingRef || "",
      responsibleForRevision: changeOrder?.responsibleForRevision || {
        structuralEngineer: false,
        generalContractor: false,
        fabricators: false,
      },
      remarks: changeOrder?.remarks || "",
      revisionApprovedBy: changeOrder?.revisionApprovedBy || "",
    } as ChangeOrderFormData,
    onSubmit: async ({ value }) => {
      try {
        const formData = {
          ...value,
          drawingChanges,
        }
        console.log("Change Order submitted:", formData)
        // Here you would call your API to save the change order
        // await createChangeOrder(formData)
        onSuccess?.()
      } catch (error) {
        console.error("Failed to save change order:", error)
        alert("Failed to save change order. Please try again.")
      }
    },
  })

  const addDrawingChange = () => {
    setDrawingChanges([
      ...drawingChanges,
      {
        id: Date.now().toString(),
        dwgNumber: "",
        description: "",
        revTime: undefined,
      },
    ])
  }

  const removeDrawingChange = (id: string) => {
    if (drawingChanges.length > 1) {
      setDrawingChanges(drawingChanges.filter((change) => change.id !== id))
    }
  }

  const updateDrawingChange = (id: string, field: keyof DrawingChange, value: string | number | undefined) => {
    setDrawingChanges(
      drawingChanges.map((change) =>
        change.id === id ? { ...change, [field]: value } : change
      )
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      {/* Header Information Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Header Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.Field name="project">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Project *</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </div>
            )}
          </form.Field>

          <form.Field name="date">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Date *</Label>
                <Input
                  id={field.name}
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </div>
            )}
          </form.Field>

          <form.Field name="jobNo">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Job No *</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </div>
            )}
          </form.Field>

          <form.Field name="coNo">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>CO No *</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., U2524 - CO #001"
                  required
                />
              </div>
            )}
          </form.Field>

          <form.Field name="substructureRevised">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Substructure Revised *</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., Wall Panels"
                  required
                />
              </div>
            )}
          </form.Field>

          <form.Field name="client">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Client *</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  required
                />
              </div>
            )}
          </form.Field>

          <form.Field name="placingDrawingRef">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Placing Drawing Reference</Label>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., R-1 TO R-28_REV 01"
                />
              </div>
            )}
          </form.Field>

          <form.Field name="contractDrawingRef">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Contract Drawing Reference</Label>
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., Latest Structural Drawings Dated on 05/14/19..."
                  rows={2}
                />
              </div>
            )}
          </form.Field>
        </div>
      </div>

      <Separator />

      {/* Responsible for Revision Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Responsible for Revision</h3>
        <form.Field name="responsibleForRevision">
          {(field) => (
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="structural-engineer"
                  checked={field.state.value.structuralEngineer}
                  onCheckedChange={(checked) =>
                    field.handleChange({
                      ...field.state.value,
                      structuralEngineer: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="structural-engineer" className="font-normal cursor-pointer">
                  Structural Engineer
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="general-contractor"
                  checked={field.state.value.generalContractor}
                  onCheckedChange={(checked) =>
                    field.handleChange({
                      ...field.state.value,
                      generalContractor: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="general-contractor" className="font-normal cursor-pointer">
                  General Contractor
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fabricators"
                  checked={field.state.value.fabricators}
                  onCheckedChange={(checked) =>
                    field.handleChange({
                      ...field.state.value,
                      fabricators: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="fabricators" className="font-normal cursor-pointer">
                  Fabricators
                </Label>
              </div>
            </div>
          )}
        </form.Field>
      </div>

      <Separator />

      {/* Drawing Change Details Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Drawing Change Details</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addDrawingChange}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Change
          </Button>
        </div>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-green-50 dark:bg-green-950/20">
                <TableHead className="w-24 border-r text-green-700 dark:text-green-300 font-semibold">Dwg #</TableHead>
                <TableHead className="border-r text-green-700 dark:text-green-300 font-semibold">Description of Change</TableHead>
                <TableHead className="w-32 text-right text-green-700 dark:text-green-300 font-semibold">Rev Time (hours)</TableHead>
                <TableHead className="w-20 text-center text-green-700 dark:text-green-300 font-semibold">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drawingChanges.map((change, index) => (
                <TableRow key={change.id} className="border-b">
                  <TableCell className="border-r">
                    <Input
                      value={change.dwgNumber}
                      onChange={(e) =>
                        updateDrawingChange(change.id, "dwgNumber", e.target.value)
                      }
                      placeholder="e.g., R1"
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell className="border-r">
                    <Textarea
                      value={change.description}
                      onChange={(e) =>
                        updateDrawingChange(change.id, "description", e.target.value)
                      }
                      placeholder="Description of change..."
                      className="min-h-[60px]"
                      rows={2}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      step="0.01"
                      value={change.revTime || ""}
                      onChange={(e) =>
                        updateDrawingChange(
                          change.id,
                          "revTime",
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )
                      }
                      placeholder="Hours"
                      className="h-8 text-right"
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDrawingChange(change.id)}
                      disabled={drawingChanges.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Separator />

      {/* Remarks Section */}
      <form.Field name="remarks">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Remarks</Label>
            <Textarea
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter any remarks or notes..."
              rows={3}
            />
          </div>
        )}
      </form.Field>

      <Separator />

      {/* Revision Approved By Section */}
      <form.Field name="revisionApprovedBy">
        {(field) => (
          <div className="space-y-2">
            <Label htmlFor={field.name}>Revision Approved By</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Enter approver name"
            />
          </div>
        )}
      </form.Field>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {changeOrder ? "Update Change Order" : "Create Change Order"}
        </Button>
      </div>
    </form>
  )
}
