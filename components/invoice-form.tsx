"use client"

import { useState, useEffect } from "react"
import { useForm } from "@tanstack/react-form"
import { Invoice } from "@/lib/types/invoice"
import { useCreateInvoice, useUpdateInvoice } from "@/hooks/use-invoices-optimized"
import { useProjects } from "@/hooks/use-projects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

interface InvoiceFormProps {
  invoice?: Invoice | null
  onSuccess: () => void
  onCancel: () => void
}

export function InvoiceForm({ invoice, onSuccess, onCancel }: InvoiceFormProps) {
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: projects = [] } = useProjects()

  const form = useForm({
    defaultValues: {
      invoiceId: invoice?.invoiceId || "",
      projectNumber: invoice?.projectNumber || "",
      projectName: invoice?.projectName || "",
      billedTonnage: invoice?.billedTonnage || 0,
      unitPriceLumpSum: invoice?.unitPriceLumpSum || 0,
      tonsBilledAmount: invoice?.tonsBilledAmount || 0,
      billedHoursCO: invoice?.billedHoursCO || 0,
      coPrice: invoice?.coPrice || 0,
      coBilledAmount: invoice?.coBilledAmount || 0,
      totalAmountBilled: invoice?.totalAmountBilled || 0,
      status: (invoice?.status || "Unpaid") as Invoice['status'],
      paidDate: invoice?.paidDate || null,
      issueDate: invoice?.issueDate || new Date().toISOString().split('T')[0],
    },
    onSubmit: async ({ value }) => {
      setIsSubmitting(true)
      try {
        const invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
          invoiceId: value.invoiceId,
          projectNumber: value.projectNumber,
          projectName: value.projectName,
          billedTonnage: Number(value.billedTonnage),
          unitPriceLumpSum: Number(value.unitPriceLumpSum),
          tonsBilledAmount: Number(value.tonsBilledAmount),
          billedHoursCO: Number(value.billedHoursCO),
          coPrice: Number(value.coPrice),
          coBilledAmount: Number(value.coBilledAmount),
          totalAmountBilled: Number(value.totalAmountBilled),
          status: value.status,
          paidDate: value.paidDate || null,
          issueDate: value.issueDate,
        }

        if (invoice) {
          await updateInvoice.mutateAsync({
            id: invoice.id,
            updates: invoiceData,
          })
          toast.success('Invoice updated successfully')
        } else {
          await createInvoice.mutateAsync(invoiceData)
          toast.success('Invoice created successfully')
        }
        onSuccess()
      } catch (error) {
        toast.error('Failed to save invoice')
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  // Calculate totals when values change
  useEffect(() => {
    const subscription = form.store.subscribe((state: any) => {
      const values = state.values || {}
      const billedTonnage = Number(values.billedTonnage) || 0
      const unitPrice = Number(values.unitPriceLumpSum) || 0
      const billedHours = Number(values.billedHoursCO) || 0
      const coPrice = Number(values.coPrice) || 0

      const tonsAmount = billedTonnage * unitPrice
      const coAmount = billedHours * coPrice
      const total = tonsAmount + coAmount

      form.setFieldValue('tonsBilledAmount', tonsAmount)
      form.setFieldValue('coBilledAmount', coAmount)
      form.setFieldValue('totalAmountBilled', total)
    })

    return () => subscription()
  }, [form])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <form.Field name="invoiceId">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Invoice ID *</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                required
              />
            </div>
          )}
        </form.Field>

        <form.Field name="projectNumber">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Project Number *</Label>
              <Select
                value={field.state.value}
                onValueChange={(value) => {
                  field.handleChange(value)
                  // Auto-populate project name when project number is selected
                  const selectedProject = projects.find(
                    (p) => p.jobNumber === value
                  )
                  if (selectedProject) {
                    form.setFieldValue('projectName', selectedProject.projectName || '')
                  }
                }}
                required
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem
                      key={project.id}
                      value={project.jobNumber || ''}
                    >
                      {project.jobNumber} - {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {projects.length === 0 && (
                <Input
                  id={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Enter project number"
                  required
                />
              )}
            </div>
          )}
        </form.Field>

        <form.Field name="projectName">
          {(field) => (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor={field.name}>Project Name *</Label>
              <Input
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Project name will auto-populate when project is selected"
                required
              />
            </div>
          )}
        </form.Field>

        <form.Field name="billedTonnage">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Billed Tonnage</Label>
              <Input
                id={field.name}
                type="number"
                step="0.01"
                value={field.state.value}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="unitPriceLumpSum">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Unit Price (Lump Sum)</Label>
              <Input
                id={field.name}
                type="number"
                step="0.01"
                value={field.state.value}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="billedHoursCO">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Billed Hours CO</Label>
              <Input
                id={field.name}
                type="number"
                step="0.01"
                value={field.state.value}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="coPrice">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>CO Price</Label>
              <Input
                id={field.name}
                type="number"
                step="0.01"
                value={field.state.value}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="status">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Status *</Label>
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as Invoice['status'])
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Unpaid">Unpaid</SelectItem>
                  <SelectItem value="Due Date Expected">Due Date Expected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Field name="issueDate">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Issue Date *</Label>
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

        <form.Field name="paidDate">
          {(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Paid Date</Label>
              <Input
                id={field.name}
                type="date"
                value={field.state.value || ""}
                onChange={(e) =>
                  field.handleChange(e.target.value || null)
                }
              />
            </div>
          )}
        </form.Field>
      </div>

      {/* Calculated Fields (Read-only) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
        <div className="space-y-2">
          <Label>Tons Billed Amount</Label>
          <Input
            value={form.state.values.tonsBilledAmount.toFixed(2)}
            readOnly
            className="bg-muted"
          />
        </div>
        <div className="space-y-2">
          <Label>CO Billed Amount</Label>
          <Input
            value={(form.state.values as any).coBilledAmount?.toFixed(2) || '0.00'}
            readOnly
            className="bg-muted"
          />
        </div>
        <div className="space-y-2">
          <Label className="font-semibold">Total Amount Billed</Label>
          <Input
            value={(form.state.values as any).totalAmountBilled?.toFixed(2) || '0.00'}
            readOnly
            className="bg-muted font-semibold"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : invoice ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  )
}

