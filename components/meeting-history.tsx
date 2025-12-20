"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar, MapPin, Users, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Meeting {
  id: string
  title: string
  dateTime: Date
  location: string
  attendees: string[]
  description: string
  status: "upcoming" | "completed" | "cancelled"
}

// Mock data - replace with actual API call
const mockMeetings: Meeting[] = [
  {
    id: "1",
    title: "Project Review Meeting",
    dateTime: new Date(Date.now() + 86400000 * 2), // 2 days from now
    location: "Conference Room A",
    attendees: ["John Doe", "Jane Smith", "Mike Johnson"],
    description: "Review project progress and discuss next steps",
    status: "upcoming",
  },
  {
    id: "2",
    title: "Client Presentation",
    dateTime: new Date(Date.now() - 86400000 * 2), // 2 days ago
    location: "Online - Zoom",
    attendees: ["Sarah Williams", "Tom Brown"],
    description: "Present project updates to client",
    status: "completed",
  },
]

export function MeetingHistory() {
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings)

  // Sort meetings by date (upcoming first, then completed)
  const sortedMeetings = [...meetings].sort((a, b) => {
    if (a.status === "upcoming" && b.status !== "upcoming") return -1
    if (a.status !== "upcoming" && b.status === "upcoming") return 1
    return b.dateTime.getTime() - a.dateTime.getTime()
  })

  const getStatusBadge = (status: Meeting["status"]) => {
    switch (status) {
      case "upcoming":
        return <Badge className="bg-blue-500">Upcoming</Badge>
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>
      case "cancelled":
        return <Badge className="bg-gray-500">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const isUpcoming = (meeting: Meeting) => {
    return meeting.status === "upcoming" && meeting.dateTime > new Date()
  }

  const upcomingMeetings = sortedMeetings.filter(isUpcoming)
  const pastMeetings = sortedMeetings.filter((m) => !isUpcoming(m))

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Meeting History</CardTitle>
        <CardDescription>View all your scheduled meetings</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {upcomingMeetings.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
              Upcoming Meetings
            </h3>
            <div className="space-y-3">
              {upcomingMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">{meeting.title}</h4>
                    {getStatusBadge(meeting.status)}
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {format(meeting.dateTime, "PPP 'at' p")}
                    </div>
                    {meeting.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {meeting.location}
                      </div>
                    )}
                    {meeting.attendees.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {meeting.attendees.join(", ")}
                      </div>
                    )}
                    {meeting.description && (
                      <p className="mt-2 text-xs">{meeting.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pastMeetings.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
              Past Meetings
            </h3>
            <div className="space-y-3">
              {pastMeetings.map((meeting) => (
                <div
                  key={meeting.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors opacity-75"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">{meeting.title}</h4>
                    {getStatusBadge(meeting.status)}
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {format(meeting.dateTime, "PPP 'at' p")}
                    </div>
                    {meeting.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        {meeting.location}
                      </div>
                    )}
                    {meeting.attendees.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {meeting.attendees.join(", ")}
                      </div>
                    )}
                    {meeting.description && (
                      <p className="mt-2 text-xs">{meeting.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {meetings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">No meetings scheduled</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

