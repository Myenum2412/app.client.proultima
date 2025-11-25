'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCircle2, Calendar, Eye } from 'lucide-react';
import { useTaskPriorities } from '@/hooks/use-task-priorities';
import { TaskStaffFilter } from '@/components/tasks/task-staff-filter';
import type { Task } from '@/types';
import { EmployeeDetailsDialog } from './employee-details-dialog';
import { useStaff } from '@/hooks/use-staff';

interface CompletedTasksTableProps {
  tasks: Task[];
}

export function CompletedTasksTable({ tasks }: CompletedTasksTableProps) {
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState<string | 'all'>('all');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { priorities } = useTaskPriorities();
  const { staff } = useStaff();

  // Create color map for quick lookup
  const priorityColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    priorities.forEach(p => {
      map[p.name] = p.color;
    });
    return map;
  }, [priorities]);

  // Filter completed tasks
  const completedTasks = tasks.filter(task => task.status === 'completed');

  // Apply filters
  const filteredTasks = completedTasks.filter(task => {
    const priorityMatch = priorityFilter === 'all' || task.priority === priorityFilter;
    
    let assigneeMatch = true;
    if (assigneeFilter !== 'all') {
      if (task.allocation_mode === 'individual') {
        assigneeMatch = task.assigned_staff_ids?.includes(assigneeFilter) || false;
      } else {
        assigneeMatch = task.assigned_team_ids?.includes(assigneeFilter) || false;
      }
    }

    const staffMatch = staffFilter === 'all' || task.assigned_staff_ids?.includes(staffFilter);
    
    return priorityMatch && assigneeMatch && staffMatch;
  });

  // Get unique assignees for filter
  const uniqueAssignees = Array.from(
    new Set(
      completedTasks.flatMap(task => {
        if (task.allocation_mode === 'individual' && task.assigned_staff) {
          return task.assigned_staff.map(a => ({ id: a.staff_id, name: a.staff?.name || 'Unknown', type: 'staff' }));
        }
        if (task.allocation_mode === 'team' && task.assigned_teams) {
          return task.assigned_teams.map(t => ({ id: t.id, name: t.name, type: 'team' }));
        }
        return [];
      })
    )
  );

  const getPriorityBadge = (priority: string) => {
    const color = priorityColorMap[priority] || 'gray';
    const colorClasses: Record<string, string> = {
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={colorClasses[color] || colorClasses.gray}>
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
      <div className="flex flex-col sm:flex-row gap-4">
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

        <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            {uniqueAssignees.map((assignee: any) => (
              <SelectItem key={assignee.id} value={assignee.id}>
                {assignee.name} ({assignee.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <TaskStaffFilter 
          value={staffFilter} 
          onValueChange={setStaffFilter} 
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No completed tasks found</h3>
            <p className="text-muted-foreground">
              {completedTasks.length === 0 
                ? 'No tasks have been completed yet' 
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
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Completed Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{task.task_no || task.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getAssigneeDisplay(task)}</TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell>
                    {task.due_date ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.due_date), 'MMM dd, yyyy')}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {task.updated_at ? format(new Date(task.updated_at), 'MMM dd, yyyy') : 'N/A'}
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
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTasks.length} of {completedTasks.length} completed tasks
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

