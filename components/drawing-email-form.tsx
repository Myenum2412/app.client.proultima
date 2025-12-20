"use client"

import { useState } from "react"
import { Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

interface DrawingEmailFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  drawings: Array<{
    dwg: string
    status: string
    description: string
    totalWeight?: number
    latestSubmittedDate?: string
    weeksSinceSent?: string
    releaseStatus?: string
  }>
  projectNumber?: string
  projectName?: string
  type?: "yet-to-return" | "yet-to-release"
}

export function DrawingEmailForm({
  open,
  onOpenChange,
  drawings,
  projectNumber,
  projectName,
  type = "yet-to-return",
}: DrawingEmailFormProps) {
  const [recipientEmail, setRecipientEmail] = useState("myenumam@gmail.com")
  const [subject, setSubject] = useState(
    type === "yet-to-release"
      ? `Drawings Yet to Release - ${projectNumber || "Project"}`
      : `Drawings Yet to Return - ${projectNumber || "Project"}`
  )
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)

    try {
      const response = await fetch("/api/drawings/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          drawings,
          projectNumber,
          projectName,
          type,
          recipientEmail,
          subject,
          message,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || "Failed to send email")
      }

      alert(`Email sent successfully to ${recipientEmail} for ${drawings.length} drawing(s)!`)
      onOpenChange(false)
      
      // Reset form
      setRecipientEmail("myenumam@gmail.com")
      setSubject(
        type === "yet-to-release"
          ? `Drawings Yet to Release - ${projectNumber || "Project"}`
          : `Drawings Yet to Return - ${projectNumber || "Project"}`
      )
      setMessage("")
    } catch (error) {
      console.error("Failed to send email:", error)
      alert("Failed to send email. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Drawings via Email
          </DialogTitle>
          <DialogDescription>
            Send {drawings.length} selected drawing(s) via email
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recipient-email">
              Recipient Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="recipient-email"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a custom message to the email..."
              rows={4}
            />
          </div>

          <div className="rounded-md border p-4 bg-muted/50">
            <p className="text-sm font-medium mb-2">Selected Drawings:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {drawings.slice(0, 5).map((drawing, index) => (
                <li key={index}>
                  • {drawing.dwg} - {drawing.description || "No description"}
                </li>
              ))}
              {drawings.length > 5 && (
                <li className="text-xs italic">
                  ... and {drawings.length - 5} more
                </li>
              )}
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSending}>
              {isSending ? "Sending..." : "Send Email"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

