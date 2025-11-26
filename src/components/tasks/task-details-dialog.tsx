"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  User,
  Users,
  Save,
  X,
  Trash2,
  Repeat,
  FileText,
  UserPlus,
  Eye,
  Edit as EditIcon,
  Network,
  ExternalLink,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTasks } from "@/hooks/use-tasks";
import { useStaff } from "@/hooks/use-staff";
import { useTeams } from "@/hooks/use-teams";
import type { Task, TaskRepeatConfig, Staff, TaskStatus, TaskPriority } from "@/types";

interface TaskDetailsDialogProps {
  task: Task | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskDetailsDialog({
  task,
  isOpen,
  onOpenChange,
  onDelete,
}: TaskDetailsDialogProps) {
  const router = useRouter();
  const { updateTask, isUpdating, deleteTask, isDeleting } = useTasks();
  const { staff } = useStaff();
  const { teams, teamMembers } = useTeams();

  // Transform staff to match expected interface
  const employees = staff.map(s => ({
    id: s.id,
    name: s.name,
    email: s.email,
    role: s.role,
    department: s.department,
    branch: s.branch,
    phone: s.phone,
    profile_image_url: s.profile_image_url,
  }));

  const [isEditing, setIsEditing] = useState(false);
  
  // Popover states for calendars
  const [isDueDateOpen, setIsDueDateOpen] = useState(false);
  const [isEndDateOpen, setIsEndDateOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status: "todo" as TaskStatus,
    priority: "medium" as TaskPriority,
    allocation_mode: "individual" as "individual" | "team",
    assigned_staff_ids: [] as string[],
    assigned_team_ids: [] as string[],
    due_date: undefined as Date | undefined,
    is_repeated: false,
  });

  // Repeat settings
  const [repeatFrequency, setRepeatFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [repeatInterval, setRepeatInterval] = useState(1);
  const [repeatEndDate, setRepeatEndDate] = useState<Date>();
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [hasSpecificTime, setHasSpecificTime] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  // Get team members from selected teams
  const selectedTeamMemberIds = teamMembers
    ?.filter(tm => formData.assigned_team_ids.includes(tm.team_id))
    .map(tm => tm.staff_id) || [];
  const teamMembersList = staff.filter(s => selectedTeamMemberIds.includes(s.id));
  const loadingTeamMembers = false;

  // Available members
  const availableMembers = teamMembersList;

  // Load task data when dialog opens
  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        allocation_mode: task.allocation_mode,
        assigned_staff_ids: task.assigned_staff_ids || [],
        assigned_team_ids: task.assigned_team_ids || [],
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        is_repeated: task.is_repeated,
      });

      // Load repeat config
      if (task.repeat_config) {
        setRepeatFrequency(task.repeat_config.frequency);
        setRepeatInterval(task.repeat_config.interval);
        setRepeatEndDate(task.repeat_config.end_date ? new Date(task.repeat_config.end_date) : undefined);
        setCustomDays(task.repeat_config.custom_days || []);
        setHasSpecificTime(task.repeat_config.has_specific_time);
        setStartTime(task.repeat_config.start_time || "09:00");
        setEndTime(task.repeat_config.end_time || "17:00");
      }

      setIsEditing(false);
    }
  }, [task, isOpen]);

  const handleInputChange = (field: string, value: string | boolean | Date | string[] | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMember = (staffId: string) => {
    setFormData(prev => ({
      ...prev,
      assigned_staff_ids: prev.assigned_staff_ids.includes(staffId)
        ? prev.assigned_staff_ids.filter(id => id !== staffId)
        : [...prev.assigned_staff_ids, staffId],
    }));
  };

  const toggleCustomDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const getDayName = (day: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const handleSave = () => {
    if (!task) return;

    // Build repeat config if repeated task
    let repeatConfig: TaskRepeatConfig | undefined;
    if (formData.is_repeated) {
      repeatConfig = {
        frequency: repeatFrequency,
        interval: repeatInterval,
        end_date: repeatEndDate?.toISOString(),
        custom_days: repeatFrequency === 'custom' ? customDays : undefined,
        has_specific_time: hasSpecificTime,
        start_time: hasSpecificTime ? startTime : undefined,
        end_time: hasSpecificTime ? endTime : undefined,
      };
    }

    updateTask({
      id: task.id,
      title: formData.title,
      description: formData.description,
      status: formData.status,
      priority: formData.priority,
      due_date: formData.due_date?.toISOString(),
      start_date: formData.is_repeated ? formData.due_date?.toISOString() : undefined,
      is_repeated: formData.is_repeated,
      repeat_config: repeatConfig,
    });

    setIsEditing(false);
  };

  const handleDelete = () => {
    if (!task) return;
    if (confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      deleteTask(task.id);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reload task data
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        allocation_mode: task.allocation_mode,
        assigned_staff_ids: task.assigned_staff_ids || [],
        assigned_team_ids: task.assigned_team_ids || [],
        due_date: task.due_date ? new Date(task.due_date) : undefined,
        is_repeated: task.is_repeated,
      });
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[800px] w-[100vw] max-w-[100vw] sm:w-[95vw] md:w-[90vw] lg:w-[800px] bg-white dark:bg-gray-950 rounded-none sm:rounded-xl max-h-[100vh] sm:max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] p-0 sm:p-6"
        showCloseButton={false}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        } as React.CSSProperties}
      >
        <DialogHeader className="sticky top-0 z-10 bg-white dark:bg-gray-950 border-b px-4 sm:px-0 pt-4 sm:pt-0 pb-3 sm:pb-4">
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-0">
            <DialogTitle className="text-base sm:text-xl font-bold text-gray-900 dark:text-white flex-1">
              {isEditing ? "Edit Task" : "Task Details"}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="hidden sm:flex items-center gap-2"
                >
                  <EditIcon className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="w-full sm:hidden mt-2"
            >
              <EditIcon className="h-4 w-4 mr-2" />
              Edit Task
            </Button>
          )}
        </DialogHeader>

        <div className="py-4 sm:py-4 px-4 sm:px-0 space-y-4 sm:space-y-6 overflow-y-auto">
          {/* Allocation Mode (View/Edit) */}
          {isEditing && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Allocation Mode *</Label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Button
                  type="button"
                  variant={formData.allocation_mode === 'individual' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleInputChange('allocation_mode', 'individual')}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <User className="h-4 w-4" />
                  Individual
                </Button>
                <Button
                  type="button"
                  variant={formData.allocation_mode === 'team' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleInputChange('allocation_mode', 'team')}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Users className="h-4 w-4" />
                  Team
                </Button>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Task Title *</Label>
            {isEditing ? (
              <Input
                id="title"
                placeholder="Enter task title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="h-11 sm:h-10 text-base sm:text-sm"
              />
            ) : (
              <p className="text-base font-semibold">{task.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description</Label>
            {isEditing ? (
              <Textarea
                id="description"
                placeholder="Enter task description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                className="resize-none text-base sm:text-sm min-h-[100px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {task.description || "No description provided"}
              </p>
            )}
          </div>

          {/* Status, Priority & Assigned To - One Row with 3 Columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">Status *</Label>
              {isEditing ? (
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange("status", value)}
                >
                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={
                  task.status === "completed" ? "default" :
                  task.status === "in_progress" ? "secondary" :
                  "outline"
                } className="w-fit">
                  {task.status.replace("_", " ").toUpperCase()}
                </Badge>
              )}
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium">Priority *</Label>
              {isEditing ? (
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange("priority", value)}
                >
                  <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={
                  task.priority === "urgent" ? "destructive" :
                  task.priority === "high" ? "default" :
                  "secondary"
                } className="w-fit">
                  {task.priority.toUpperCase()}
                </Badge>
              )}
          </div>

            {/* Assigned To */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {formData.allocation_mode === "individual" ? "Assigned To" : "Team Assignment"}
            </Label>
            {isEditing ? (
                formData.allocation_mode === "individual" ? (
                  <div className="space-y-2">
                    <Select
                      onValueChange={(value) => {
                        if (!formData.assigned_staff_ids.includes(value)) {
                          handleInputChange("assigned_staff_ids", [...formData.assigned_staff_ids, value]);
                        }
                      }}
                    >
                      <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                        <SelectValue placeholder="Select staff" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.filter(emp => !formData.assigned_staff_ids.includes(emp.id)).map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            <div className="flex items-center gap-2">
                              <span>{emp.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {emp.role}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {/* Selected Staff */}
                    {formData.assigned_staff_ids.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                      {formData.assigned_staff_ids.map(staffId => {
                        const staff = employees.find(s => s.id === staffId);
                        return staff ? (
                            <Badge key={staffId} variant="secondary" className="text-xs">
                            {staff.name}
                            <button
                              type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleInputChange("assigned_staff_ids", formData.assigned_staff_ids.filter(id => id !== staffId));
                                }}
                                className="ml-1.5 hover:text-destructive"
                            >
                              ×
                            </button>
                            </Badge>
                        ) : null;
                      })}
                    </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Select
                      value={formData.assigned_team_ids[0] || ""}
                      onValueChange={(value) => handleInputChange("assigned_team_ids", [value])}
                    >
                      <SelectTrigger className="h-11 sm:h-10 text-base sm:text-sm">
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formData.assigned_staff_ids.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {formData.assigned_staff_ids.length} member{formData.assigned_staff_ids.length !== 1 ? 's' : ''} selected
                      </Badge>
                    )}
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg min-h-[2.5rem]">
                  {task.allocation_mode === "individual" ? (
                    <>
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {task.assigned_staff_ids?.length > 0 
                          ? `${task.assigned_staff_ids.length} staff member${task.assigned_staff_ids.length > 1 ? 's' : ''}`
                          : "Unassigned"
                        }
                      </span>
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {task.assigned_team_ids?.length > 0 
                          ? `${task.assigned_team_ids.length} team${task.assigned_team_ids.length > 1 ? 's' : ''}`
                          : "No teams assigned"
                        }
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Team Members Selection (Full Width Below) - Only shown in edit mode for teams */}
          {isEditing && formData.allocation_mode === "team" && formData.assigned_team_ids.length > 0 && (
            <div className="space-y-3 pt-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <UserPlus className="w-4 h-4 text-blue-500" />
                          Team Members (Optional)
                        </Label>
                        
                        {availableMembers.length === 0 ? (
                          <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                            {loadingTeamMembers ? "Loading members..." : "No team members available"}
                          </div>
                        ) : (
                          <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                            {availableMembers.map((emp) => (
                              <div
                                key={emp.id}
                                className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted transition-colors"
                              >
                                <Checkbox
                                  id={`member-${emp.id}`}
                                  checked={formData.assigned_staff_ids.includes(emp.id)}
                                  onCheckedChange={() => toggleMember(emp.id)}
                                />
                                <label
                                  htmlFor={`member-${emp.id}`}
                                  className="flex-1 flex items-center justify-between cursor-pointer"
                                >
                                  <div>
                                    <p className="text-sm font-medium">{emp.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {emp.role} • {emp.department}
                                    </p>
                                  </div>
                                  {emp.branch && (
                                    <Badge variant="secondary" className="text-xs">
                                      {emp.branch}
                                    </Badge>
                                  )}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Selected Members Summary */}
                        {formData.assigned_staff_ids.length > 0 && (
                          <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                            <p className="text-xs font-medium text-blue-900 dark:text-blue-100 w-full mb-1">
                              Selected: {formData.assigned_staff_ids.length} member{formData.assigned_staff_ids.length !== 1 ? 's' : ''}
                            </p>
                            {formData.assigned_staff_ids.map((memberId) => {
                              const member = employees.find(e => e.id === memberId);
                              return member ? (
                                <Badge key={memberId} variant="secondary" className="text-xs">
                                  {member.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    )}

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due-date" className="text-sm font-medium">
              {formData.is_repeated ? "Start Date" : "Due Date"}
            </Label>
            {isEditing ? (
              <Popover open={isDueDateOpen} onOpenChange={setIsDueDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-left h-10 text-sm sm:text-base", !formData.due_date && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{formData.due_date ? format(formData.due_date, "PPP") : "Pick a date"}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start" side="bottom">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => {
                      handleInputChange("due_date", date);
                      setIsDueDateOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg min-h-[2.5rem]">
                <CalendarIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm sm:text-base break-words">{task.due_date ? format(new Date(task.due_date), "PPP") : "No due date"}</span>
              </div>
            )}
          </div>

          {/* Repeated Task Toggle & Settings */}
          {isEditing && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="is-repeated" className="text-sm font-medium">Repeated Task</Label>
                <Switch
                  id="is-repeated"
                  checked={formData.is_repeated}
                  onCheckedChange={(checked) => handleInputChange("is_repeated", checked)}
                />
              </div>

              {formData.is_repeated && (
                <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                  <Label className="text-sm font-medium">Repeat Settings</Label>
                  
                  {/* Row 1: Frequency and Every */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="repeat-frequency" className="text-xs font-medium">Frequency</Label>
                      <Select
                        value={repeatFrequency}
                        onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'custom') => setRepeatFrequency(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="custom">Custom Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="repeat-interval" className="text-xs font-medium">Every</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="repeat-interval"
                          type="number"
                          min="1"
                          max="365"
                          value={repeatInterval}
                          onChange={(e) => setRepeatInterval(parseInt(e.target.value) || 1)}
                          className="w-20"
                        />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {repeatFrequency === 'daily' ? 'day(s)' : 
                           repeatFrequency === 'weekly' ? 'week(s)' : 
                           repeatFrequency === 'monthly' ? 'month(s)' : 'week(s)'}
                        </span>
                      </div>
                      </div>
                    </div>

                  {/* Row 2: End Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-4">
                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor="repeat-end-date" className="text-xs font-medium">End Date (Optional)</Label>
                      <Popover open={isEndDateOpen} onOpenChange={setIsEndDateOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className={cn("w-full justify-start text-left font-normal text-xs h-9", !repeatEndDate && "text-muted-foreground")}
                          >
                            <CalendarIcon className="mr-2 h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{repeatEndDate ? format(repeatEndDate, "PPP") : "No end date"}</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start" side="bottom">
                          <Calendar
                            mode="single"
                            selected={repeatEndDate}
                            onSelect={(date) => {
                              setRepeatEndDate(date);
                              setIsEndDateOpen(false);
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Custom Days Selection */}
                  {repeatFrequency === 'custom' && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Select Days</Label>
                      <div className="flex flex-wrap gap-2">
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                          <Button
                            key={day}
                            type="button"
                            variant={customDays.includes(day) ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleCustomDay(day)}
                            className="text-xs h-8"
                          >
                            {getDayName(day).substring(0, 3)}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timing Settings */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="specific-time"
                        checked={hasSpecificTime}
                        onCheckedChange={setHasSpecificTime}
                      />
                      <Label htmlFor="specific-time" className="text-xs font-medium cursor-pointer flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Specific Time Range
                      </Label>
                    </div>

                    {hasSpecificTime && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="start-time" className="text-xs font-medium">Start Time</Label>
                          <Input
                            id="start-time"
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full h-9"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="end-time" className="text-xs font-medium">End Time</Label>
                          <Input
                            id="end-time"
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full h-9"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* View Mode: Repeat Task Info */}
          {!isEditing && task.is_repeated && task.repeat_config && (
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2">
                <Repeat className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <Label className="text-sm font-semibold text-blue-900 dark:text-blue-100">Repeat Configuration</Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-blue-900 dark:text-blue-100">
                <div>
                  <p className="font-medium text-xs text-blue-700 dark:text-blue-300 mb-1">Frequency</p>
                  <p className="capitalize">{task.repeat_config.frequency}</p>
                </div>
                <div>
                  <p className="font-medium text-xs text-blue-700 dark:text-blue-300 mb-1">Interval</p>
                  <p>Every {task.repeat_config.interval}{" "}
                  {task.repeat_config.frequency === "daily" ? "day(s)" : 
                   task.repeat_config.frequency === "weekly" ? "week(s)" : "month(s)"}
                </p>
                </div>
                {task.repeat_config.end_date && (
                  <div>
                    <p className="font-medium text-xs text-blue-700 dark:text-blue-300 mb-1">Ends</p>
                    <p>{format(new Date(task.repeat_config.end_date), "PPP")}</p>
                  </div>
                )}
                {task.repeat_config.custom_days && task.repeat_config.custom_days.length > 0 && (
                  <div>
                    <p className="font-medium text-xs text-blue-700 dark:text-blue-300 mb-1">Days</p>
                    <p>{task.repeat_config.custom_days.map(d => getDayName(d)).join(", ")}</p>
                  </div>
                )}
                {task.repeat_config.has_specific_time && (
                  <div className="sm:col-span-2">
                    <p className="font-medium text-xs text-blue-700 dark:text-blue-300 mb-1">Time Range</p>
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {task.repeat_config.start_time} - {task.repeat_config.end_time}
                  </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Support Files */}
          {!isEditing && task.support_files && task.support_files.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Support Files ({task.support_files.length})
              </Label>
              <div className="space-y-2">
                {task.support_files.map((file, index) => (
                  <a
                    key={index}
                    href={file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 rounded-lg border transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Attachment {index + 1}</span>
                    <Eye className="h-3 w-3 ml-auto" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* View Diagram Section */}
          {!isEditing && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Network className="h-4 w-4" />
                Task Diagram
              </Label>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-auto py-3"
                onClick={() => {
                  router.push(`/admin/tasks/${task.id}/diagram`);
                  onOpenChange(false);
                }}
              >
                <Network className="h-4 w-4" />
                <div className="flex-1 text-left">
                  <div className="font-medium">View Task Assignment Diagram</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Visualize task assignments, delegations, and relationships
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground" />
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className=" pb-4 sm:pb-0 flex flex-col sm:flex-row gap-2 sm:gap-3 sticky bottom-0 bg-white dark:bg-gray-950 sm:bg-transparent dark:sm:bg-transparent -mx-4 sm:mx-0 px-4 sm:px-0 border-t sm:border-t-0 pt-4 sm:pt-4">
            {isEditing ? (
              <>
                <Button
                  onClick={handleSave}
                  disabled={isUpdating}
                  className="w-full sm:flex-1 h-11 sm:h-10 order-1"
                  variant="default"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isUpdating ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="w-full sm:flex-1 h-11 sm:h-10 order-2"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full sm:w-auto h-11 sm:h-10 order-3"
                >
                  <Trash2 className="w-4 h-4 mr-2 sm:mr-0" />
                  <span className="sm:hidden">Delete Task</span>
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}