"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationDialog } from "@/components/ui/delete-confirmation-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreVertical, Edit, Trash2, Calendar, Repeat, Users, User, Network, Eye, CheckCircle, XCircle, Link, AlertCircle, Clock, ChevronLeft, ChevronRight, ChevronFirst, ChevronLast, ChevronUp, ChevronDown } from "lucide-react";
import { Task, TaskStatus, TaskPriority } from "@/types";
import { EditTaskDialog } from "./edit-task-dialog";
import { TaskVerificationDialog } from "@/components/admin/task-verification-dialog";
import { TaskDetailsDialog } from "./task-details-dialog";
import { useStaff } from "@/hooks/use-staff";
import { useTeams } from "@/hooks/use-teams";
import { useTaskProofs } from "@/hooks/use-task-proofs";
import { useTasks } from "@/hooks/use-tasks";
import { useTaskPriorities } from "@/hooks/use-task-priorities";
import { useTaskReschedules } from "@/hooks/use-task-reschedules";
import { RescheduleApprovalDialog } from "@/components/admin/reschedule-approval-dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { 
  getTaskDisplayNumber, 
  getTaskTitleWithOriginalAssignee, 
  getDelegationChainDisplay, 
  getLatestDelegationReason,
  getCleanTaskTitle
} from '@/lib/task-utils';

interface TasksTableProps {
  tasks: Task[];
  onDelete: (taskId: string) => void;
}

export function TasksTable({ tasks, onDelete }: TasksTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProofDialogOpen, setIsProofDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedReschedule, setSelectedReschedule] = useState<any>(null);
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false);
  const rescheduleTriggerRef = useRef<HTMLButtonElement>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Trigger reschedule dialog when state changes
  useEffect(() => {
    if (isRescheduleDialogOpen && rescheduleTriggerRef.current) {
      rescheduleTriggerRef.current.click();
      setIsRescheduleDialogOpen(false);
    }
  }, [isRescheduleDialogOpen]);

  // Auto-open verification dialog when URL params are present
  useEffect(() => {
    const verifyTaskId = searchParams.get('verifyTask');
    const proofId = searchParams.get('proofId');
    
    if (verifyTaskId && proofId) {
      const task = tasks.find(t => t.id === verifyTaskId);
      if (task) {
        setSelectedTask(task);
        setIsProofDialogOpen(true);
        
        // Clean URL after opening dialog
        router.replace('/admin/tasks', { scroll: false });
      }
    }
  }, [searchParams, tasks, router]);
  
  // Get staff and teams data for name resolution
  const { staff } = useStaff();
  const { teams, teamMembers } = useTeams();
  const { proofs } = useTaskProofs();
  const { updateTask } = useTasks();
  const { priorities } = useTaskPriorities();

  // Create color map for quick lookup
  const priorityColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    priorities.forEach(p => {
      map[p.name] = p.color;
    });
    return map;
  }, [priorities]);
  
  // Helper function to check if a task is overdue
  const isTaskOverdue = (task: Task): boolean => {
    if (!task.due_date || task.status === 'completed') return false;
    return new Date(task.due_date) < new Date();
  };
  
  // Debug: Log staff data when it changes
  useEffect(() => {
    // console.log('📋 Staff data loaded:', staff.length, 'staff members');
    if (staff.length > 0) {
      // console.log('📋 Staff details:', staff.map(s => ({ id: s.id, name: s.name, profile_image_url: s.profile_image_url })));
    }
  }, [staff]);
  
  // Debug: Log task data when it changes
  useEffect(() => {
    if (tasks.length > 0) {
      // console.log('📝 Task data loaded:', tasks.length, 'tasks');
      tasks.forEach(task => {
        // console.log(`📝 Task "${task.title}":`, {
        //   assigned_staff_ids: task.assigned_staff_ids,
        //   assigned_team_ids: task.assigned_team_ids
        // });
        
        // Debug staff lookup for each task
        if (task.assigned_staff_ids?.length > 0) {
          task.assigned_staff_ids.forEach(staffId => {
            const foundStaff = staff.find(s => s.id === staffId);
            // console.log(`🔍 Looking for staff ID "${staffId}":`, foundStaff ? `Found: ${foundStaff.name}` : 'NOT FOUND');
          });
        }
      });
    }
  }, [tasks, staff]);

  // Expand tasks with multiple assignments into separate rows
  const expandedTasks = tasks.flatMap(task => {
    const assignments: Array<{ 
      task: Task; 
      assignee: string; 
      assigneeName: string; 
      assigneeImage?: string;
      type: 'staff' | 'team' 
    }> = [];
    
    // Check allocation mode to determine what to display
    if (task.allocation_mode === 'team') {
      // For team tasks, show ONLY team name in admin view (no expansion to individual members)
      if (task.assigned_team_ids?.length > 0) {
        task.assigned_team_ids.forEach(teamId => {
          const team = teams.find(t => t.id === teamId);
          const teamName = team?.name || `Unknown Team (${teamId})`;
          
          // Show ONLY team name - no expansion to individual members
          assignments.push({
            task: { ...task, title: task.title }, // Keep original title
            assignee: teamId,
            assigneeName: teamName, // Just "Developer Team"
            type: 'team'
          });
        });
      }
    } else {
      // For individual tasks, only show individual staff assignments
      if (task.assigned_staff_ids?.length > 0) {
        task.assigned_staff_ids.forEach(staffId => {
          const staffMember = staff.find(s => s.id === staffId);
          let staffName: string;
          let staffImage: string | undefined;
          
          if (staffMember) {
            staffName = staffMember.name;
            staffImage = staffMember.profile_image_url || undefined;
          } else {
            // Try to find by email or name if ID doesn't match
            const alternativeStaff = staff.find(s => 
              s.email === staffId ||
              s.name.toLowerCase().includes(staffId.toLowerCase())
            );
            
            if (alternativeStaff) {
              staffName = alternativeStaff.name;
              staffImage = alternativeStaff.profile_image_url || undefined;
            } else {
              // Final fallback - check if it's a mock ID and suggest real staff
              if (staffId.startsWith('staff-')) {
                staffName = `Mock Staff (${staffId}) - Please reassign`;
              } else {
                staffName = `Unknown Staff (${staffId})`;
              }
              staffImage = undefined;
            }
          }
          
          assignments.push({
            task: { ...task, title: `${task.title} - ${staffName}` },
            assignee: staffId,
            assigneeName: staffName,
            assigneeImage: staffImage,
            type: 'staff'
          });
        });
      }
    }
    
    // If no assignments, return the original task
    if (assignments.length === 0) {
      assignments.push({
        task,
        assignee: '',
        assigneeName: 'Unassigned',
        type: 'staff'
      });
    }
    
    return assignments;
  });

  // Get status badge color
  const getStatusBadge = (status: TaskStatus) => {
    const styles: Record<string, string> = {
      completed: "bg-green-100 text-green-800 hover:bg-green-100",
      in_progress: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      todo: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      backlog: "bg-gray-100 text-gray-800 hover:bg-gray-100",
      rescheduled: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    };
    return styles[status] || styles.backlog;
  };

  // Get priority badge color
  const getPriorityBadge = (priority: TaskPriority) => {
    const color = priorityColorMap[priority] || 'gray';
    const colorClasses: Record<string, string> = {
      red: "bg-red-100 text-red-800 hover:bg-red-100",
      orange: "bg-orange-100 text-orange-800 hover:bg-orange-100",
      yellow: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
      green: "bg-green-100 text-green-800 hover:bg-green-100",
      blue: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      gray: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    };
    return colorClasses[color] || colorClasses.gray;
  };

  // Format status text
  const formatStatus = (status: TaskStatus) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Format priority text
  const formatPriority = (priority: TaskPriority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  // Handle task edit
  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    setIsEditOpen(true);
  };

  // Handle view proofs
  const handleViewProofs = (task: Task) => {
    setSelectedTask(task);
    setIsProofDialogOpen(true);
  };

  // Get proofs for a specific task
  const getTaskProofs = (taskId: string) => {
    return proofs.filter(proof => proof.task_id === taskId);
  };

  // Get pending proofs count for a task
  const getPendingProofsCount = (taskId: string) => {
    return proofs.filter(proof => proof.task_id === taskId && proof.is_verified === null).length;
  };

  // Get assignee info for expanded task
  const getAssigneeInfo = (assigneeName: string, type: 'staff' | 'team', imageUrl?: string) => {
    return {
      name: assigneeName,
      image: imageUrl || null,
      type: type,
    };
  };

  // Helper function to get initials
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Helper functions for Recent Tasks UI
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0) return `In ${diffDays} days`;
    return `${Math.abs(diffDays)} days ago`;
  };

  const isOverdue = (task: Task) => {
    return task.due_date && new Date(task.due_date) < new Date() && task.status !== "completed";
  };

  const hasPendingProofs = (task: Task) => {
    const taskProofs = proofs.filter(p => p.task_id === task.id);
    return taskProofs.some(p => p.is_verified === null);
  };

  // Pagination logic
  const totalPages = Math.ceil(expandedTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTasks = expandedTasks.slice(startIndex, endIndex);

  // Reset to first page when tasks change
  useEffect(() => {
    setCurrentPage(1);
  }, [tasks]);

  return (
    <>
      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11">Task #</TableHead>
              <TableHead className="h-11">Task</TableHead>
              <TableHead className="h-11">Assigned To</TableHead>
              <TableHead className="h-11">Delegated By</TableHead>
              <TableHead className="h-11">Status</TableHead>
              <TableHead className="h-11">Priority</TableHead>
              <TableHead className="h-11">Due Date</TableHead>
              <TableHead className="h-11">Sub Task From</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No tasks found. Create your first task to get started.
                </TableCell>
              </TableRow>
            ) : (
              paginatedTasks.map((assignment, index) => {
                const assigneeInfo = getAssigneeInfo(assignment.assigneeName, assignment.type, assignment.assigneeImage);
                const isOverdueTask = isOverdue(assignment.task);
                
                return (
                  <TableRow 
                    key={`${assignment.task.id}-${assignment.assignee}-${index}`}
                    className={cn(
                      "cursor-pointer hover:bg-muted/50 transition-colors",
                      isOverdueTask && "bg-red-100 hover:bg-red-200"
                    )}
                    data-state={false}
                    onClick={() => {
                      setSelectedTask(assignment.task);
                      setIsDetailsDialogOpen(true);
                    }}
                  >
                    <TableCell>
                      <div className="font-mono text-sm font-medium text-muted-foreground">
                        {getTaskDisplayNumber(assignment.task) || 'N/A'}
                        
                        {assignment.task.child_tasks && assignment.task.child_tasks > 0 && (
                          <Badge variant="outline" className="ml-2 text-xs bg-purple-50 text-purple-700 border-purple-200">
                            <Users className="h-3 w-3 mr-1" />
                            {assignment.task.child_tasks} Copies
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/admin/tasks/${assignment.task.id}/diagram`)}
                              className="hover:text-primary hover:underline transition-colors text-left"
                            >
                              {getCleanTaskTitle(assignment.task)}
                            </button>
                            {isOverdueTask && (
                              <AlertCircle className="h-3 w-3 text-red-500 flex-shrink-0" />
                            )}
                            {assignment.task.is_repeated && (
                              <Repeat className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            )}
                          </div>
                          
                          {/* Pending Verification Badge */}
                          {assignment.task.status === 'completed' && hasPendingProofs(assignment.task) && (
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200 mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending Verification
                            </Badge>
                          )}
                          
                          {assignment.task.description && (
                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                              {assignment.task.description}
                            </p>
                          )}
                          {assignment.task.has_delegations && getDelegationChainDisplay(assignment.task) && (
                            <div className="mt-1 space-y-1">
                              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                                {getDelegationChainDisplay(assignment.task)}
                              </Badge>
                              {getLatestDelegationReason(assignment.task) && (
                                <p className="text-xs text-muted-foreground italic pl-1 line-clamp-2">
                                  Reason: {getLatestDelegationReason(assignment.task)}
                                </p>
                              )}
                            </div>
                          )}
                          {assignment.task.has_pending_reschedule && assignment.task.pending_reschedule && (
                            <div className="mt-1 space-y-1">
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                <Calendar className="h-3 w-3 mr-1" />
                                Reschedule Pending
                              </Badge>
                              <p className="text-xs text-muted-foreground italic pl-1 line-clamp-2">
                                Reason: {assignment.task.pending_reschedule.reason}
                              </p>
                            </div>
                          )}
                          {assignment.task.has_approved_reschedule && assignment.task.latest_approved_reschedule && (
                            <div className="mt-1 space-y-1">
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                <Calendar className="h-3 w-3 mr-1" />
                                Rescheduled by {assignment.task.latest_approved_reschedule.staff?.name || 'Unknown'}
                              </Badge>
                              {assignment.task.latest_approved_reschedule.admin_response && (
                                <p className="text-xs text-muted-foreground italic pl-1 line-clamp-2">
                                  Admin: {assignment.task.latest_approved_reschedule.admin_response}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assigneeInfo ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {assigneeInfo.image ? (
                              <AvatarImage src={assigneeInfo.image} alt={assigneeInfo.name} />
                            ) : (
                              <AvatarFallback>
                                {assigneeInfo.type === "team" ? (
                                  <Users className="h-4 w-4" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{assigneeInfo.name}</div>
                            <span className="text-muted-foreground text-xs">
                              {assigneeInfo.type === "team" 
                                ? "Team" 
                                : "Staff"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assignment.task.has_delegations && assignment.task.delegated_by_staff_name ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {getInitials(assignment.task.delegated_by_staff_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{assignment.task.delegated_by_staff_name}</div>
                            <span className="text-muted-foreground text-xs">Delegated by</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(assignment.task.status)}>
                        {formatStatus(assignment.task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadge(assignment.task.priority)}>
                        {formatPriority(assignment.task.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {assignment.task.due_date ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {format(new Date(assignment.task.due_date), "MMM dd, yyyy")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assignment.task.created_by_staff ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            {assignment.task.created_by_staff.profile_image_url ? (
                              <AvatarImage src={assignment.task.created_by_staff.profile_image_url} />
                            ) : (
                              <AvatarFallback>
                                {getInitials(assignment.task.created_by_staff.name)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{assignment.task.created_by_staff.name}</div>
                            <span className="text-muted-foreground text-xs">Staff Created</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-muted-foreground text-sm">Admin Created</span>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t">
        {/* Left side - Rows per page selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Center - Page info */}
        <div className="flex items-center justify-center text-sm">
          <span className="text-muted-foreground">
            <span className="text-foreground">
              {startIndex + 1}-{Math.min(endIndex, expandedTasks.length)}
            </span>{" "}
            of <span className="text-foreground">{expandedTasks.length}</span> tasks
          </span>
          <span className="mx-2">•</span>
          <span className="text-muted-foreground">
            Page <span className="text-foreground">{currentPage}</span> of{" "}
            <span className="text-foreground">{totalPages}</span>
          </span>
        </div>

        {/* Right side - Pagination buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronFirst className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronLast className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Edit Task Dialog */}
      {selectedTask && (
        <EditTaskDialog
          task={selectedTask}
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}

      {/* Task Verification Dialog */}
      {selectedTask && (
        <TaskVerificationDialog
          task={selectedTask}
          isOpen={isProofDialogOpen}
          onOpenChange={setIsProofDialogOpen}
        />
      )}

      {/* Reschedule Approval Dialog */}
      {selectedReschedule && (
        <RescheduleApprovalDialog
          reschedule={selectedReschedule}
          trigger={<button ref={rescheduleTriggerRef} style={{ display: 'none' }} />}
        />
      )}

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={selectedTask}
        isOpen={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
        onDelete={(taskId) => {
          onDelete(taskId);
          setIsDetailsDialogOpen(false);
          setSelectedTask(null);
        }}
      />
    </>
  );
}

