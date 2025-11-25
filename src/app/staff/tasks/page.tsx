'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useTasks } from '@/hooks/use-tasks';
import { useTeams } from '@/hooks/use-teams';
import { useStaff } from '@/hooks/use-staff';
import { getStaffTasks } from '@/lib/team-utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, RefreshCw } from 'lucide-react';
import { TaskStatsCards } from '@/components/tasks/task-stats-cards';
import { StaffDashboardTasksTable } from '@/components/staff/staff-dashboard-tasks-table';
import { TaskStatus, TaskPriority } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function StaffTasksPage() {
  const { user } = useAuth();
  const { tasks, isLoading } = useTasks();
  const { teams, teamMembers } = useTeams();
  const { staff } = useStaff();
  
  // Local state for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [cardFilter, setCardFilter] = useState<'all' | 'completed' | 'in_progress' | 'incomplete'>('all');
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);


  // Filter tasks assigned to current staff member
  const myTasks = getStaffTasks(tasks, user?.staffId || '', teamMembers, teams);

  // Apply filters
  const filteredTasks = myTasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    // Apply card filter
    let matchesCardFilter = true;
    if (cardFilter === 'completed') {
      matchesCardFilter = task.status === 'completed';
    } else if (cardFilter === 'in_progress') {
      matchesCardFilter = task.status === 'in_progress';
    } else if (cardFilter === 'incomplete') {
      if (!task.due_date) {
        matchesCardFilter = false;
      } else {
        const dueDate = new Date(task.due_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        matchesCardFilter = dueDate < today && task.status !== 'completed';
      }
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCardFilter;
  });


  // Simplified refresh function - data updates automatically via real-time subscriptions
  const handleRefresh = () => {
    toast.success('Tasks are synced in real-time!');
  };

  // Don't render until we're on the client side
  if (!isClient) {
    return (
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">My Tasks</h2>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage tasks assigned to you ({filteredTasks.length} of {myTasks.length} tasks)
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <TaskStatsCards 
          tasks={myTasks} 
          activeFilter={cardFilter}
          onCardClick={setCardFilter}
        />
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-x-3">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TaskStatus | 'all')}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="backlog">Backlog</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority Filter */}
          <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as TaskPriority | 'all')}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Priority" />
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
      </div>

      {/* Tasks Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <StaffDashboardTasksTable 
          tasks={filteredTasks}
          availableStaff={staff?.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            department: s.department
          })) || []}
          teams={teams?.map(t => ({
            id: t.id,
            name: t.name
          })) || []}
        />
      )}
    </div>
  );
}

