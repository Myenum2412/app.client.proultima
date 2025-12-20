"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InvoiceFilters as InvoiceFiltersType } from "@/lib/types/invoice"
import { X } from "lucide-react"
import { format } from "date-fns"

interface InvoiceFiltersProps {
  filters: InvoiceFiltersType
  onFiltersChange: (filters: InvoiceFiltersType) => void
}

export function InvoiceFilters({ filters, onFiltersChange }: InvoiceFiltersProps) {
  const [localFilters, setLocalFilters] = useState<InvoiceFiltersType>(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const updateFilter = (key: keyof InvoiceFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilter = (key: keyof InvoiceFiltersType) => {
    const newFilters = { ...localFilters }
    delete newFilters[key]
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearAll = () => {
    setLocalFilters({})
    onFiltersChange({})
  }

  const hasActiveFilters = Object.keys(localFilters).length > 0

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Invoice ID Filter */}
        <div className="space-y-2">
          <Label htmlFor="invoiceId">Invoice ID</Label>
          <div className="relative">
            <Input
              id="invoiceId"
              placeholder="Filter by invoice ID"
              value={localFilters.invoiceId || ""}
              onChange={(e) => updateFilter("invoiceId", e.target.value || undefined)}
            />
            {localFilters.invoiceId && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-8"
                onClick={() => clearFilter("invoiceId")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Project Number Filter */}
        <div className="space-y-2">
          <Label htmlFor="projectNumber">Project Number</Label>
          <div className="relative">
            <Input
              id="projectNumber"
              placeholder="Filter by project number"
              value={localFilters.projectNumber || ""}
              onChange={(e) => updateFilter("projectNumber", e.target.value || undefined)}
            />
            {localFilters.projectNumber && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-8"
                onClick={() => clearFilter("projectNumber")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Project Name Filter */}
        <div className="space-y-2">
          <Label htmlFor="projectName">Project Name</Label>
          <div className="relative">
            <Input
              id="projectName"
              placeholder="Filter by project name"
              value={localFilters.projectName || ""}
              onChange={(e) => updateFilter("projectName", e.target.value || undefined)}
            />
            {localFilters.projectName && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-8"
                onClick={() => clearFilter("projectName")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Billed Tonnage Filter */}
        <div className="space-y-2">
          <Label htmlFor="billedTonnage">Billed Tonnage</Label>
          <div className="flex gap-2">
            <Input
              id="billedTonnageMin"
              type="number"
              placeholder="Min"
              value={localFilters.billedTonnage?.min || ""}
              onChange={(e) =>
                updateFilter("billedTonnage", {
                  ...localFilters.billedTonnage,
                  min: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <Input
              id="billedTonnageMax"
              type="number"
              placeholder="Max"
              value={localFilters.billedTonnage?.max || ""}
              onChange={(e) =>
                updateFilter("billedTonnage", {
                  ...localFilters.billedTonnage,
                  max: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>

        {/* Billed Hours CO Filter */}
        <div className="space-y-2">
          <Label htmlFor="billedHoursCO">Billed Hours CO</Label>
          <div className="flex gap-2">
            <Input
              id="billedHoursCOMin"
              type="number"
              placeholder="Min"
              value={localFilters.billedHoursCO?.min || ""}
              onChange={(e) =>
                updateFilter("billedHoursCO", {
                  ...localFilters.billedHoursCO,
                  min: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <Input
              id="billedHoursCOMax"
              type="number"
              placeholder="Max"
              value={localFilters.billedHoursCO?.max || ""}
              onChange={(e) =>
                updateFilter("billedHoursCO", {
                  ...localFilters.billedHoursCO,
                  max: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>

        {/* CO Price Filter */}
        <div className="space-y-2">
          <Label htmlFor="coPrice">CO Price</Label>
          <div className="flex gap-2">
            <Input
              id="coPriceMin"
              type="number"
              placeholder="Min"
              value={localFilters.coPrice?.min || ""}
              onChange={(e) =>
                updateFilter("coPrice", {
                  ...localFilters.coPrice,
                  min: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
            <Input
              id="coPriceMax"
              type="number"
              placeholder="Max"
              value={localFilters.coPrice?.max || ""}
              onChange={(e) =>
                updateFilter("coPrice", {
                  ...localFilters.coPrice,
                  max: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </div>
        </div>

        {/* Issue Date Filter */}
        <div className="space-y-2">
          <Label htmlFor="issueDate">Issue Date</Label>
          <div className="flex gap-2">
            <Input
              id="issueDateFrom"
              type="date"
              placeholder="From"
              value={localFilters.issueDate?.from || ""}
              onChange={(e) =>
                updateFilter("issueDate", {
                  ...localFilters.issueDate,
                  from: e.target.value || undefined,
                })
              }
            />
            <Input
              id="issueDateTo"
              type="date"
              placeholder="To"
              value={localFilters.issueDate?.to || ""}
              onChange={(e) =>
                updateFilter("issueDate", {
                  ...localFilters.issueDate,
                  to: e.target.value || undefined,
                })
              }
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={localFilters.status || "all"}
            onValueChange={(value) =>
              updateFilter("status", value === "all" ? undefined : (value as InvoiceFiltersType['status']))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Overdue">Overdue</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}

