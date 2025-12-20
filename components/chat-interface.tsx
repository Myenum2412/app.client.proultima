"use client"

import { useState, useRef, useEffect } from "react"
import {
  Paperclip,
  Mic,
  Send,
  Smile,
  History,
  Calendar,
  Check,
  CheckCheck,
  X,
  User,
  Phone,
  Video,
  Monitor,
  Clock,
} from "lucide-react"
import { motion, AnimatePresence } from "motion/react"
import EmojiPicker, { EmojiClickData } from "emoji-picker-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Message {
  id: string
  text: string
  timestamp: Date
  isSent: boolean
  status: "sending" | "sent" | "delivered" | "read"
  files?: File[]
}

interface ChatMessage {
  id: string
  text: string
  timestamp: Date
  isSent: boolean
  status: "sending" | "sent" | "delivered" | "read"
}

export function ChatInterface() {
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      text: "Hello! How can I help you today?",
      timestamp: new Date(Date.now() - 3600000),
      isSent: false,
      status: "read",
    },
    {
      id: "2",
      text: "Hi! I need some information about the project status.",
      timestamp: new Date(Date.now() - 3300000),
      isSent: true,
      status: "read",
    },
  ])
  const [isRecording, setIsRecording] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showScheduleMeeting, setShowScheduleMeeting] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!message.trim() && selectedFiles.length === 0) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      timestamp: new Date(),
      isSent: true,
      status: "sending",
    }

    setMessages((prev) => [...prev, newMessage])
    setMessage("")
    setSelectedFiles([])

    // Simulate message delivery
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "sent" } : msg
        )
      )
    }, 500)

    // Simulate message read
    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, status: "read" } : msg
        )
      )
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  const handleMicClick = () => {
    setIsRecording(!isRecording)
    // Add voice recording logic here
  }

  const getStatusIcon = (status: ChatMessage["status"]) => {
    switch (status) {
      case "sending":
        return <div className="h-3 w-3 rounded-full bg-muted animate-pulse" />
      case "sent":
        return <Check className="h-3 w-3 text-muted-foreground" />
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Contact Info Panel */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Avatar className="h-12 w-12 bg-yellow-500">
          <AvatarImage src="/image/profile.jpg" alt="Vel" />
          <AvatarFallback className="bg-yellow-500 text-black">
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base">Vel</h3>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-950/20 rounded-full">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs font-medium text-green-600 dark:text-green-500">
                Online
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Project Manager</p>
        </div>
        
        {/* All Icons in Same Row on Right Side */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {}}
            className="h-8 w-8"
            title="Voice Call"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {}}
            className="h-8 w-8"
            title="Video Call"
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {}}
            className="h-8 w-8"
            title="Screen Share"
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(true)}
            className="h-8 w-8"
            title="History"
          >
            <Clock className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowScheduleMeeting(true)}
            className="h-8 w-8"
            title="Schedule Meeting"
          >
            <Calendar className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowHistory(true)}
            className="h-8 w-8"
            title="Chat History"
          >
            <History className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-2",
                msg.isSent ? "justify-end" : "justify-start"
              )}
            >
              {!msg.isSent && (
                <Avatar className="h-8 w-8 bg-yellow-500 shrink-0">
                  <AvatarImage src="/image/profile.jpg" alt="Vel" />
                  <AvatarFallback className="bg-yellow-500 text-black">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "flex flex-col gap-1 max-w-[70%]",
                  msg.isSent ? "items-end" : "items-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-2.5",
                    msg.isSent
                      ? "bg-gray-800 dark:bg-gray-900 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  )}
                >
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground px-1">
                  <span>{format(msg.timestamp, "h:mm a")}</span>
                  {msg.isSent && getStatusIcon(msg.status)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="px-4 py-2 border-t bg-muted/50">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2 py-1 bg-background rounded-md border text-xs"
              >
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{file.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4"
                  onClick={() =>
                    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t bg-card">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="h-9 w-9 shrink-0"
            title="Attach File"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleMicClick}
            className={cn(
              "h-9 w-9 shrink-0",
              isRecording && "text-destructive"
            )}
            title="Voice Message"
          >
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div
                  key="recording"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.2, 1] }}
                  exit={{ scale: 0.8 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative"
                >
                  <Mic className="h-4 w-4" />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-destructive/20"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.8 }}
                >
                  <Mic className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-10"
            />
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  title="Emoji"
                >
                  <Smile className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-0" align="end">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  autoFocusSearch={false}
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!message.trim() && selectedFiles.length === 0}
            className="h-9 w-9 shrink-0 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200"
            title="Send Message"
          >
            <Send className="h-4 w-4 text-white dark:text-black" />
          </Button>
        </div>
      </div>

      {/* Chat History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Chat History</DialogTitle>
            <DialogDescription>
              View your previous conversations
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="flex flex-col gap-1 p-3 rounded-lg border"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {msg.isSent ? "You" : "John Doe"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(msg.timestamp, "MMM dd, yyyy HH:mm")}
                    </span>
                  </div>
                  <p className="text-sm">{msg.text}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={showScheduleMeeting} onOpenChange={setShowScheduleMeeting}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
            <DialogDescription>
              Schedule a meeting with Vel
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              // Handle form submission here
              setShowScheduleMeeting(false)
            }}
            className="space-y-4 py-4"
          >
            {/* Row 1: Meeting Title and Date & Time in 2 columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="meeting-title" className="text-sm font-medium">
                  Meeting Title <span className="text-destructive">*</span>
                </label>
                <Input
                  id="meeting-title"
                  placeholder="Enter meeting title"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="meeting-date" className="text-sm font-medium">
                  Date & Time <span className="text-destructive">*</span>
                </label>
                <Input
                  id="meeting-date"
                  type="datetime-local"
                  required
                  defaultValue={format(
                    new Date(Date.now() + 86400000),
                    "yyyy-MM-dd'T'HH:mm"
                  )}
                />
              </div>
            </div>
            
            {/* Row 2: Description in full width */}
            <div className="space-y-2">
              <label htmlFor="meeting-description" className="text-sm font-medium">
                Description
              </label>
              <Input
                id="meeting-description"
                placeholder="Meeting agenda or description (optional)"
                className="w-full"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowScheduleMeeting(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

