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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface MeetingData {
  title: string
  dateTime: Date | undefined
  description: string
  member: string
}

export function MeetingFormInline() {
  const [formData, setFormData] = useState<MeetingData>({
    title: "",
    dateTime: undefined,
    description: "",
    member: "",
  })
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [time, setTime] = useState("09:00")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!formData.member) {
        toast.error("Please select a member")
        setIsSubmitting(false)
        return
      }

      // Combine date and time
      const dateTime = formData.dateTime
      if (!dateTime) {
        toast.error("Please select a date")
        setIsSubmitting(false)
        return
      }

      const [hours, minutes] = time.split(":")
      dateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)

      // Send email notification
      const emailResponse = await fetch("/api/meetings/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          dateTime: dateTime.toISOString(),
          description: formData.description,
          member: formData.member,
        }),
      })

      const emailResult = await emailResponse.json()

      if (!emailResponse.ok || !emailResult.success) {
        throw new Error(emailResult.error || emailResult.message || "Failed to send email")
      }

      // TODO: Save meeting to database
      console.log("Meeting data:", { ...formData, dateTime: dateTime })

      // Show success message
      toast.success("Meeting scheduled successfully!", {
        description: "Emails sent to client and admin.",
      })

      // Reset form after showing success toast
      setFormData({
        title: "",
        dateTime: undefined,
        description: "",
        member: "",
      })
      setTime("09:00")
    } catch (error) {
      console.error("Failed to save meeting:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save meeting. Please try again."
      toast.error("Failed to schedule meeting", {
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Schedule Meeting</CardTitle>
        <CardDescription>
          Create a new meeting and schedule it with team members
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="meeting-member">
              Member <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.member}
              onValueChange={(value) =>
                setFormData({ ...formData, member: value })
              }
              required
            >
              <SelectTrigger id="meeting-member" className="w-full">
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Vel, Rajesh">Vel, Rajesh</SelectItem>
              </SelectContent>
            </Select>
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

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Saving..." : "Schedule Meeting"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFormData({
                  title: "",
                  dateTime: undefined,
                  description: "",
                  member: "",
                })
                setTime("09:00")
              }}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

