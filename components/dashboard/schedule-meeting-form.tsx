"use client";

import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { demoProjects } from "@/public/assets";

type MeetingFormData = {
  meetingTitle: string;
  date: Date | undefined;
  time: string;
  member: string;
  projects: string[];
  description: string;
};

export function ScheduleMeetingForm() {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [showErrors, setShowErrors] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MeetingFormData>({
    defaultValues: {
      meetingTitle: "",
      date: undefined,
      time: "",
      member: "",
      projects: [],
      description: "",
    },
  });

  const selectedDate = watch("date");
  const selectedMember = watch("member");

  const projects = React.useMemo(
    () =>
      demoProjects.map((p, index) => ({
        id: `proj-${index + 1}`,
        jobNumber: p.jobNumber,
        name: p.name,
      })),
    []
  );

  const onSubmit = (data: MeetingFormData) => {
    setShowErrors(true);
    
    if (!selectedDate || !selectedMember || !data.meetingTitle || !data.time || !selectedProject) {
      return;
    }
    
    console.log("Meeting scheduled:", {
      ...data,
      date: selectedDate,
      project: selectedProject,
    });
    // Here you would typically send the data to an API
    alert("Meeting scheduled successfully!");
    // Reset form
    setValue("meetingTitle", "");
    setValue("date", undefined);
    setValue("time", "");
    setValue("member", "");
    setValue("description", "");
    setSelectedProject("");
    setShowErrors(false);
  };

  return (
    <Card className="w-full shadow-lg overflow-hidden">
      <CardHeader className="border-b">
        <CardTitle className="text-lg font-semibold -mb-4">Schedule Meeting</CardTitle>
      </CardHeader>
      <CardContent >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Meeting Title */}
          <div className="space-y-2">
            <Label htmlFor="meetingTitle">Meeting Title</Label>
            <Input
              id="meetingTitle"
              placeholder="Enter meeting title"
              {...register("meetingTitle", { required: "Meeting title is required" })}
            />
            {errors.meetingTitle && (
              <p className="text-sm text-red-500">{errors.meetingTitle.message}</p>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => setValue("date", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {showErrors && !selectedDate && (
                <p className="text-sm text-red-500">Date is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  className="pl-10"
                  {...register("time", { required: "Time is required" })}
                />
              </div>
              {errors.time && (
                <p className="text-sm text-red-500">{errors.time.message}</p>
              )}
            </div>
          </div>

          {/* Member and Project Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="member">Member</Label>
              <Select
                value={selectedMember}
                onValueChange={(value) => setValue("member", value)}
              >
                <SelectTrigger id="member">
                  <SelectValue placeholder="Select a member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vel">Vel</SelectItem>
                  <SelectItem value="rajesh">Rajesh</SelectItem>
                </SelectContent>
              </Select>
              {showErrors && !selectedMember && (
                <p className="text-sm text-red-500">Member selection is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Select Project</Label>
              <Select
                value={selectedProject}
                onValueChange={(value) => {
                  setSelectedProject(value);
                  setValue("projects", [value]);
                }}
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.jobNumber} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showErrors && !selectedProject && (
                <p className="text-sm text-red-500">Project selection is required</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter meeting description"
              rows={2}
              {...register("description")}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setValue("meetingTitle", "");
                setValue("date", undefined);
                setValue("time", "");
                setValue("member", "");
                setValue("description", "");
                setSelectedProject("");
                setShowErrors(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
              Schedule Meeting
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

