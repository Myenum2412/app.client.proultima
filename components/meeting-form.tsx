"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
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

interface MeetingFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface MeetingData {
  title: string
  dateTime: Date | undefined
  description: string
  location: string
  attendees: string
}

export function MeetingForm({ open, onOpenChange }: MeetingFormProps) {
  const [formData, setFormData] = useState<MeetingData>({
    title: "",
    dateTime: undefined,
    description: "",
    location: "",
    attendees: "",
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [time, setTime] = useState("09:00")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Combine date and time
      const dateTime = formData.dateTime
      if (dateTime) {
        const [hours, minutes] = time.split(":")
        dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
      }

      // TODO: Save meeting to database
      console.log("Meeting data:", { ...formData, dateTime: formData.dateTime })

      // Reset form
      setFormData({
        title: "",
        dateTime: undefined,
        description: "",
        location: "",
        attendees: "",
      })
      setTime("09:00")
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save meeting:", error)
      alert("Failed to save meeting. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      title: "",
      dateTime: undefined,
      description: "",
      location: "",
      attendees: "",
    })
    setTime("09:00")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
          <DialogDescription>
            Create a new meeting and schedule it with team members
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Meeting Title */}
          <div className="space-y-2">
            <Label htmlFor="meeting-title">
              Meeting Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="meeting-title"
              placeholder="Enter meeting title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Date <span className="text-destructive">*</span>
              </Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dateTime && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dateTime ? (
                      format(formData.dateTime, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dateTime}
                    onSelect={(date) => {
                      setFormData({ ...formData, dateTime: date })
                      setIsCalendarOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-time">
                Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="meeting-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="meeting-location">Location</Label>
            <Input
              id="meeting-location"
              placeholder="Enter meeting location or video link"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
            />
          </div>

          {/* Attendees */}
          <div className="space-y-2">
            <Label htmlFor="meeting-attendees">Attendees</Label>
            <Input
              id="meeting-attendees"
              placeholder="Enter attendee names or emails (comma separated)"
              value={formData.attendees}
              onChange={(e) =>
                setFormData({ ...formData, attendees: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="meeting-description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="meeting-description"
              placeholder="Enter meeting description and agenda"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Schedule Meeting"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

