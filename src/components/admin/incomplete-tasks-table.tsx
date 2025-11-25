'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertCircle, Calendar, Clock, Eye } from 'lucide-react';
import { TaskStaffFilter } from '@/components/tasks/task-staff-filter';
import type { Task } from '@/types';
import { EmployeeDetailsDialog } from './employee-details-dialog';
import { useStaff } from '@/hooks/use-staff';

interface IncompleteTasksTableProps {
  tasks: Task[];
}

export function IncompleteTasksTable({ tasks }: IncompleteTasksTableProps) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState<string | 'all'>('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { staff } = useStaff();

  // Filter incomplete tasks
  const incompleteTasks = tasks.filter(task => task.status !== 'completed');

  // Check if task is overdue
  const isOverdue = (task: Task) => {
    if (!task.due_date) return false;
    return new Date(task.due_date) < new Date();
  };

  // Apply filters
  const filteredTasks = incompleteTasks.filter(task => {
    const statusMatch = statusFilter === 'all' || task.status === statusFilter;
    const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
    const overdueMatch = !overdueOnly || isOverdue(task);
    const staffMatch = staffFilter === 'all' || task.assigned_staff_ids?.includes(staffFilter);
    
    return statusMatch && priorityMatch && overdueMatch && staffMatch;
  });

  const getStatusBadge = (status: string) => {
    const config = {
      backlog: { className: 'bg-gray-100 text-gray-800', label: 'BACKLOG' },
      todo: { className: 'bg-blue-100 text-blue-800', label: 'TODO' },
      in_progress: { className: 'bg-yellow-100 text-yellow-800', label: 'IN PROGRESS' },
    };
    const statusConfig = config[status as keyof typeof config] || config.todo;
    return <Badge className={statusConfig.className}>{statusConfig.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const config = {
      urgent: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return (
      <Badge className={config[priority as keyof typeof config] || config.medium}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getAssigneeDisplay = (task: Task) => {
    if (task.allocation_mode === 'team' && task.assigned_teams && task.assigned_teams.length > 0) {
      const team = task.assigned_teams[0];
      return (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-medium text-blue-600">T</span>
          </div>
          <span className="text-sm font-medium">{team.name}</span>
        </div>
      );
    }

    if (task.assigned_staff && task.assigned_staff.length > 0) {
      const staff = task.assigned_staff[0].staff;
      return (
        <div className="flex items-center gap-2">
          <Avatar className="w-8 h-8">
            <AvatarImage src={staff?.profile_image_url || undefined} />
            <AvatarFallback className="text-xs">
              {staff?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{staff?.name || 'Unknown'}</span>
        </div>
      );
    }

    return <span className="text-sm text-muted-foreground">Unassigned</span>;
  };

  return (
    <div className="space-y-4 max-sm:mx-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="backlog">Backlog</SelectItem>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>

        <TaskStaffFilter 
          value={staffFilter} 
          onValueChange={setStaffFilter} 
        />

        <div className="flex items-center space-x-2">
          <Switch
            id="overdue-only"
            checked={overdueOnly}
            onCheckedChange={setOverdueOnly}
          />
          <Label htmlFor="overdue-only" className="text-sm font-medium cursor-pointer">
            Overdue Only
          </Label>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No incomplete tasks found</h3>
            <p className="text-muted-foreground">
              {incompleteTasks.length === 0 
                ? 'All tasks are completed!' 
                : 'No tasks match the selected filters'}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task #</TableHead>
                <TableHead>Task Name</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const overdue = isOverdue(task);
                return (
                  <TableRow 
                    key={task.id} 
                    className={`hover:bg-muted/50 ${overdue ? 'bg-red-50' : ''}`}
                  >
                    <TableCell className="font-medium">
                      {task.task_no || task.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          {task.title}
                          {overdue && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Overdue
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getAssigneeDisplay(task)}</TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                    <TableCell>
                      {task.due_date ? (
                        <div className={`flex items-center gap-1 text-sm ${overdue ? 'text-red-600 font-medium' : ''}`}>
                          <Calendar className="h-3 w-3" />
                          {format(new Date(task.due_date), 'MMM dd, yyyy')}
                        </div>
                      ) : (
                        'N/A'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {task.assigned_staff_ids && task.assigned_staff_ids.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const staffId = task.assigned_staff_ids[0];
                            setSelectedStaffId(staffId);
                            setIsDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTasks.length} of {incompleteTasks.length} incomplete tasks
        {overdueOnly && ` (${filteredTasks.filter(isOverdue).length} overdue)`}
      </div>

      {/* Employee Details Dialog */}
      {selectedStaffId && staff.find(s => s.id === selectedStaffId) && (
        <EmployeeDetailsDialog
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          staff={staff.find(s => s.id === selectedStaffId)!}
          dateRange={30}
        />
      )}
    </div>
  );
}

