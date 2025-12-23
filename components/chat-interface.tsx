"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Send,
  Phone,
  Video,
  Monitor,
  Clock,
  Calendar,
  RotateCcw,
  CheckCheck,
  Paperclip,
  Mic,
  Square,
} from "lucide-react";
import Image from "next/image";
import { motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useChatMessages, useSendChatMessage } from "@/lib/hooks/use-api";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AIBranch,
  AIBranchMessages,
  AIBranchSelector,
  AIBranchPrevious,
  AIBranchNext,
  AIBranchPage,
} from "@/components/smoothui/ai-branch";
import { EmojiPicker } from "@/components/chat/emoji-picker";
import { FilePreviewList } from "@/components/chat/file-preview";
import { InfiniteScrollTrigger } from "@/components/ui/infinite-scroll-trigger";

type ChatMessage = {
  id: string;
  role: "me" | "system";
  text: string;
  at: string;
  isRead?: boolean;
};

function nowTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

type ApiMessage = {
  id: string;
  role: "me" | "system";
  text: string;
  created_at: string;
};

export function ChatInterface({ projectId }: { projectId?: string }) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChatMessages(projectId, {
    meta: { errorMessage: "Failed to load messages." },
  });
  const sendMessage = useSendChatMessage();

  // Flatten all pages of messages
  const messages: ChatMessage[] = React.useMemo(() => {
    if (!data) return [];
    // Check if data has pages (useInfiniteQuery format) or is a direct response
    const allMessages = (data as any)?.pages 
      ? (data as any).pages.flatMap((page: any) => page.data ?? [])
      : (data as any)?.data ?? [];
    return allMessages.map((m: any) => ({
      id: String(m.id),
      role: m.role,
      text: m.text,
      at: formatTime(m.created_at),
      isRead: m.role === "me", // Assume user messages are read
    }));
  }, [data]);

  // Group messages into conversation branches (user message + AI response pairs)
  const conversationBranches = React.useMemo(() => {
    const branches: ChatMessage[][] = [];
    let currentBranch: ChatMessage[] = [];

    messages.forEach((msg) => {
      if (msg.role === "me") {
        // Start a new branch when we encounter a user message
        if (currentBranch.length > 0) {
          branches.push(currentBranch);
        }
        currentBranch = [msg];
      } else {
        // Add AI/system responses to the current branch
        currentBranch.push(msg);
      }
    });

    // Add the last branch if it exists
    if (currentBranch.length > 0) {
      branches.push(currentBranch);
    }

    return branches;
  }, [messages]);

  const [text, setText] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [isRecording, setIsRecording] = React.useState(false);
  const [mediaRecorder, setMediaRecorder] = React.useState<MediaRecorder | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  // Cleanup media recorder on unmount
  React.useEffect(() => {
    return () => {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
      }
    };
  }, [mediaRecorder, isRecording]);

  // Remove old mutation - using hook instead
  //   // Using centralized hook instead

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEmojiSelect = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const audioFile = new File([blob], `recording-${Date.now()}.webm`, {
          type: "audio/webm",
        });
        setFiles((prev) => [...prev, audioFile]);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording. Please check microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  function send() {
    const trimmed = text.trim();
    if (trimmed || files.length > 0) {
      sendMessage.mutate(
        {
          projectId,
          message: trimmed,
          files: files.length > 0 ? files : undefined,
          // audio: audioBlob || undefined, // TODO: Add audio blob state if needed
        },
        {
          onSuccess: () => {
            setText("");
            setFiles([]);
            // setAudioBlob(null); // TODO: Add audio blob state if needed
          },
        }
      );
    }
  }

  return (
    <div className="min-h-0 flex flex-1 flex-col p-4 pt-0">
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b pb-4 mb-4">
        <div className="flex items-center gap-4">
          {/* Profile Picture */}
          <div className="relative h-12 w-12 rounded-full bg-black flex items-center justify-center overflow-hidden">
            <div className="h-8 w-8 bg-yellow-400 rounded-full" />
          </div>
          
          {/* Name and Status */}
          <div className="flex flex-col">
          <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">Vel</h2>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                Online
              </span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Project Manager</p>
          </div>
        </div>
        
        {/* Action Icons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Monitor className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Clock className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Calendar className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border bg-background">
        <ScrollArea className="h-[calc(100vh-16rem)] min-h-[400px]">
          <div className="space-y-4 p-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-2/3" />
                <Skeleton className="h-12 w-1/2 ml-auto" />
                <Skeleton className="h-12 w-3/5" />
              </div>
            ) : null}
            {!isLoading && messages.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No messages yet. Start a conversation!
              </div>
            ) : null}
            {!isLoading && conversationBranches.length > 0 && (
              <AIBranch className="w-full">
                <AIBranchMessages>
                  {conversationBranches.map((branch, branchIndex) => (
                    <div key={`branch-${branchIndex}`} className="space-y-4">
                      {branch.map((m) => (
                        <div
                          key={m.id}
              className={cn(
                            "flex flex-col",
                            m.role === "me" ? "items-end" : "items-start"
                          )}
                        >
                          <div className="flex items-center gap-2 w-full">
                            {m.role === "me" && (
                              <AIBranchSelector from="user" className="flex-shrink-0">
                                <AIBranchPrevious />
                                <AIBranchPage />
                                <AIBranchNext />
                              </AIBranchSelector>
              )}
              <div
                className={cn(
                                "max-w-[min(680px,75%)] rounded-2xl px-4 py-3",
                                m.role === "me"
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 text-foreground"
                              )}
                            >
                              <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                            </div>
                            {m.role === "system" && (
                              <AIBranchSelector from="assistant" className="flex-shrink-0">
                                <AIBranchPrevious />
                                <AIBranchPage />
                                <AIBranchNext />
                              </AIBranchSelector>
                            )}
                </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-muted-foreground">{m.at}</span>
                            {m.role === "me" && m.isRead && (
                              <CheckCheck className="h-3 w-3 text-blue-600" />
                            )}
              </div>
            </div>
          ))}
              </div>
            ))}
                </AIBranchMessages>
              </AIBranch>
            )}
            <InfiniteScrollTrigger
              onLoadMore={() => fetchNextPage()}
              hasNextPage={hasNextPage ?? false}
              isFetchingNextPage={isFetchingNextPage}
            />
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
        </div>

      {/* Message Input */}
      <div className="pt-4 border-t space-y-2">
        {/* File Previews */}
        <FilePreviewList files={files} onRemove={handleRemoveFile} />

      {/* Input Area */}
        <div className="flex items-end gap-2">
          {/* File Upload Button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,application/pdf,.doc,.docx,.txt,.csv,.json"
          />

          {/* Text Input */}
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />

          {/* Emoji Picker */}
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />

          {/* Microphone Button */}
          {!isRecording ? (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
          <Button
                type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
                onClick={startRecording}
                >
                  <Mic className="h-4 w-4" />
              </Button>
                </motion.div>
              ) : (
                <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
            >
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-9 w-9 shrink-0"
                onClick={stopRecording}
              >
                <Square className="h-4 w-4 fill-current" />
              </Button>
            </motion.div>
          )}

          {/* Send Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={send}
              disabled={(!text.trim() && files.length === 0) || sendMessage.isPending}
              size="icon"
              className="h-9 w-9 shrink-0 bg-blue-600 hover:bg-blue-700"
            >
              <Send className="size-4" />
              </Button>
          </motion.div>
        </div>
            </div>
    </div>
  );
}


