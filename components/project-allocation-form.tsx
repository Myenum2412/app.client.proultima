"use client"

import { useForm } from "@tanstack/react-form"
import { CalendarIcon, Upload } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { DayButton } from "react-day-picker"
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
import { useState, useEffect } from "react"
import { addProject } from "@/lib/supabase/projects"

interface ProjectAllocationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  prefilledDate?: Date
}

interface FormData {
  projectName: string
  projectNumber: string
  dueDate: Date | undefined
  description: string
}

// Function to calculate working days (excluding weekends)
function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  while (current <= end) {
    const dayOfWeek = current.getDay()
    // Exclude weekends (Saturday = 6, Sunday = 0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++
    }
    current.setDate(current.getDate() + 1)
  }

  return count
}

export function ProjectAllocationForm({
  open,
  onOpenChange,
  prefilledDate,
}: ProjectAllocationFormProps) {
  const defaultDueDate = new Date(2025, 11, 3)
  const [files, setFiles] = useState<File[]>([])
  const [workingDays, setWorkingDays] = useState<number>(0)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const form = useForm({
    defaultValues: {
      projectName: "",
      projectNumber: "PRO-2025-001",
      dueDate: defaultDueDate,
      description: "",
    } as FormData,
    onSubmit: async ({ value }) => {
      try {
        await addProject({
          projectName: value.projectName,
          projectNumber: value.projectNumber,
          dueDate: value.dueDate ? value.dueDate.toISOString() : new Date().toISOString(),
          description: value.description,
          status: "pending",
          files: files.map((f) => f.name),
        })
        
        // Trigger update event for the table
        window.dispatchEvent(new CustomEvent("projects-updated"))
        
        // Reset form
        form.reset()
        setFiles([])
        onOpenChange(false)
      } catch (error) {
        console.error("Failed to save project:", error)
        alert("Failed to save project. Please try again.")
      }
    },
  })

  // Update form when prefilledDate changes
  useEffect(() => {
    if (prefilledDate && open) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const selected = new Date(prefilledDate)
      selected.setHours(0, 0, 0, 0)
      
      const days = calculateWorkingDays(tomorrow, selected)
      setWorkingDays(days)
      form.setFieldValue("dueDate", prefilledDate)
    } else if (!prefilledDate && open) {
      // Reset form when opened without prefilled date
      form.reset()
      setWorkingDays(0)
    }
  }, [prefilledDate, open, form])

  // Calculate working days when due date changes
  useEffect(() => {
    const dueDate = form.state.values.dueDate
    if (dueDate) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const selected = new Date(dueDate)
      selected.setHours(0, 0, 0, 0)
      
      // Only calculate if selected date is in the future
      if (selected >= tomorrow) {
        const days = calculateWorkingDays(tomorrow, selected)
        setWorkingDays(days)
      } else {
        setWorkingDays(0)
      }
    } else {
      setWorkingDays(0)
    }
  }, [form.state.values.dueDate])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files)
      setFiles(fileArray)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      const fileArray = Array.from(e.dataTransfer.files)
      setFiles(fileArray)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-screen overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle>Project Allocation</DialogTitle>
          <DialogDescription>
            Create and assign a new project to team members.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-6"
        >
          {/* Project Name and Project Number in one row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project Name */}
            <form.Field
              name="projectName"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Project name is required" : undefined,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    Project Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="e.g., Enter Project Title Here"
                    className={cn(
                      field.state.meta.errors.length > 0 && "border-destructive"
                    )}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {/* Project Number */}
            <form.Field
              name="projectNumber"
              validators={{
                onChange: ({ value }) =>
                  !value ? "Project number is required" : undefined,
              }}
            >
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>
                    Project Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    className={cn(
                      field.state.meta.errors.length > 0 && "border-destructive"
                    )}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-sm text-destructive">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>
          </div>

          {/* Due Date */}
          <form.Field
            name="dueDate"
            validators={{
              onChange: ({ value }) =>
                !value ? "Due date is required" : undefined,
            }}
          >
            {(field) => (
              <div className="space-y-2">
                <Label>
                  Due Date <span className="text-destructive">*</span>
                </Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      type="button"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.state.value && "text-muted-foreground",
                        field.state.meta.errors.length > 0 && "border-destructive"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.state.value ? format(field.state.value, "MMMM dd, yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.state.value}
                      onSelect={(date) => {
                        if (date) {
                          field.handleChange(date)
                          setIsCalendarOpen(false)
                        }
                      }}
                      initialFocus
                      modifiers={{
                        weekday: (date) => {
                          const day = date.getDay()
                          return day !== 0 && day !== 6 // Monday to Friday
                        },
                        weekend: (date) => {
                          const day = date.getDay()
                          return day === 0 || day === 6 // Sunday or Saturday
                        },
                      }}
                      components={{
                        DayButton: ({ day, modifiers, ...props }: React.ComponentProps<typeof DayButton>) => {
                          const dayOfWeek = day.date.getDay()
                          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // Sunday (0) or Saturday (6)
                          const isWeekday = dayOfWeek !== 0 && dayOfWeek !== 6 // Monday to Friday
                          
                          return (
                            <CalendarDayButton
                              day={day}
                              modifiers={modifiers}
                              {...props}
                              className={cn(
                                isWeekday && "bg-green-100 dark:bg-green-900/30 text-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-800/40",
                                isWeekend && "bg-red-100 dark:bg-red-900/30 text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800/40"
                              )}
                            />
                          )
                        },
                      }}
                    />
                  </PopoverContent>
                </Popover>
                {field.state.value && workingDays > 0 && (
                  <p className="text-sm font-medium text-primary">
                    {workingDays} working day{workingDays !== 1 ? 's' : ''} remaining (excluding weekends)
                  </p>
                )}
                {field.state.meta.errors.length > 0 && (
                  <p className="text-sm text-destructive">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          {/* Description */}
          <form.Field name="description">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Description</Label>
                <Textarea
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder="Type your message here."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Add detailed information about the project
                </p>
              </div>
            )}
          </form.Field>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>File Upload</Label>
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors",
                    "hover:bg-accent/50"
                  )}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip"
                  />
                  <Upload className="mx-auto h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">
                    Supported formats: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, JPG, PNG, GIF, ZIP and more
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Max file size: 10MB per file
                  </p>
                  {files.length > 0 && (
                    <div className="mt-2 sm:mt-3">
                      <p className="text-xs sm:text-sm font-medium">
                        {files.length} file(s) selected
                      </p>
                      <ul className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                        {files.map((file, index) => (
                          <li key={index} className="truncate">{file.name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
