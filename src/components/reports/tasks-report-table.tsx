'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileDown, Calendar, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { exportTasksReport } from '@/lib/pdf/exportTasksReport';
import { toast } from 'sonner';
import type { Task, Team } from '@/types';

interface TasksReportTableProps {
  tasks: Task[];
  teams: Team[];
}

export function TasksReportTable({ tasks, teams }: TasksReportTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter(task => {
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'backlog':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Backlog</Badge>;
      case 'todo':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">To Do</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Low</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">High</Badge>;
      case 'urgent':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Urgent</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getAssigneeDisplay = (task: Task) => {
    if (task.assigned_staff_ids && task.assigned_staff_ids.length > 0) {
      // Individual assignment
      if (task.assigned_staff_ids.length === 1) {
        return 'Individual';
      }
      // Multiple individual assignments
      return `${task.assigned_staff_ids.length} staff`;
    } else if (task.assigned_team_ids && task.assigned_team_ids.length > 0) {
      // Team assignment
      if (task.assigned_team_ids.length === 1) {
        const team = teams.find(t => t.id === task.assigned_team_ids[0]);
        return team ? team.name : 'Team';
      }
      return `${task.assigned_team_ids.length} teams`;
    }
    return 'Unassigned';
  };

  const handleExportPDF = async () => {
    // console.log('Filtered tasks before export:', filteredTasks);
    // console.log('Filtered tasks count:', filteredTasks.length);
    
    if (filteredTasks.length === 0) {
      toast.error('No tasks to export. Please adjust filters.');
      return;
    }
    
    try {
      // console.log(`Exporting ${filteredTasks.length} tasks`);
      // TEMPORARY: Export all tasks instead of filtered to test
      // console.log('TEMPORARY: Exporting all tasks instead of filtered');
      await exportTasksReport(tasks); // Export all tasks instead of filteredTasks
    } catch (error) {
      console.error('Failed to export tasks report:', error);
    }
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
        <p className="text-muted-foreground">
          You don't have any assigned tasks yet
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Export */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="grid grid-cols-2 gap-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleExportPDF} className="w-full sm:w-auto">
          <FileDown className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>S.No</TableHead>
              <TableHead>Task Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Start Time</TableHead>
              <TableHead>End Time</TableHead>
              <TableHead>Updated By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task, index) => (
              <TableRow key={task.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">{task.title}</TableCell>
                <TableCell>{getStatusBadge(task.status)}</TableCell>
                <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(task.created_at), 'MMM dd, yyyy')}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {task.status === 'completed' && task.updated_at ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.updated_at), 'MMM dd, yyyy')}
                    </div>
                  ) : task.due_date ? (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(task.due_date), 'MMM dd, yyyy')}
                    </div>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {getAssigneeDisplay(task)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredTasks.length} of {tasks.length} tasks
      </div>
    </div>
  );
}
