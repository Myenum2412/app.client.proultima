'use client';

import { useState, useId } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDownIcon,
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "lucide-react";
import { format } from 'date-fns';
import { Edit, UserPlus, CheckCircle, AlertCircle, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DelegateTaskDialog } from '@/components/staff/delegate-task-dialog';
import { VerifyDelegationDialog } from '@/components/staff/verify-delegation-dialog';
import { UpdateTaskDialog } from '@/components/staff/update-task-dialog';
import { Task, TaskDelegation } from '@/types';
import { useAuth } from '@/contexts/auth-context';

interface StaffDashboardTasksTableProps {
  tasks: Task[];
  availableStaff: Array<{ id: string; name: string; email: string; department: string }>;
  teams?: Array<{ id: string; name: string }>;
}

const columns: ColumnDef<Task>[] = [
  {
    header: "Task #",
    accessorKey: "task_no",
    cell: ({ row }) => (
      <div className="font-mono text-xs font-medium max-w-full text-balance truncate text-ellipsis overflow-hidden">{row.original.task_no}</div>
    ),
    size: 80,
  },
  {
    header: "Task",
    accessorKey: "title",
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className="max-w-full text-balance truncate text-ellipsis overflow-hidden">
          <div className="font-medium truncate text-ellipsis overflow-hidden">{task.title}</div>
          {task.description && (
            <div className="text-sm text-muted-foreground mt-1 line-clamp-2 truncate text-ellipsis overflow-hidden">
              {task.description}
            </div>
          )}
        </div>
      );
    },
    size: 200,
  },
  {
    header: "Assigned To",
    accessorKey: "assigned_to",
    cell: ({ row, table }) => {
      const getAssigneeDisplay = (table.options.meta as any).getAssigneeDisplay;
      return getAssigneeDisplay(row.original);
    },
    size: 120,
  },
  {
    header: "Delegation",
    accessorKey: "delegations",
    cell: ({ row, table }) => {
      const getDelegationBadge = (table.options.meta as any).getDelegationBadge;
      return getDelegationBadge(row.original);
    },
    size: 100,
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row, table }) => {
      const getStatusBadge = (table.options.meta as any).getStatusBadge;
      return <div className='text-xs max-sm:w-6'>{getStatusBadge(row.getValue("status"))}</div>;
    },
    size: 90,
    
  },
  {
    header: "Priority",
    accessorKey: "priority",
    cell: ({ row, table }) => {
      const getPriorityBadge = (table.options.meta as any).getPriorityBadge;
      return <div className='text-xs max-sm:w-6'>{getPriorityBadge(row.getValue("priority"))}</div>;
    },
    size: 90,
  },
  {
    header: "Due Date",
    accessorKey: "due_date",
    cell: ({ row }) => {
      const dueDate = row.getValue("due_date");
      return dueDate ? (
        <div className="flex items-center gap-1 text-sm">
          <span>{format(new Date(dueDate as string), 'MMM dd, yyyy')}</span>
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">No due date</span>
      );
    },
    size: 110,
  },
  {
    header: "Actions",
    id: "actions",
    cell: ({ row, table }) => {
      const task = row.original;
      const currentUserId = (table.options.meta as any).currentUserId;
      const availableStaff = (table.options.meta as any).availableStaff;
      const setSelectedDelegation = (table.options.meta as any).setSelectedDelegation;
      const setVerifyDialogOpen = (table.options.meta as any).setVerifyDialogOpen;
      
      // Check if task needs verification by current user
      const needsVerification = task.delegations?.some(d => 
        d.from_staff_id === currentUserId && d.delegation_status === 'completed'
      );
      
      const delegationToVerify = task.delegations?.find(d => 
        d.from_staff_id === currentUserId && d.delegation_status === 'completed'
      );
      
      return (
        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <UpdateTaskDialog task={task} />
          {needsVerification && delegationToVerify ? (
            <Button
              size="sm"
              variant="default"
              className="bg-orange-600 hover:bg-orange-700"
              onClick={() => {
                setSelectedDelegation({
                  taskId: task.id,
                  delegation: delegationToVerify,
                  taskTitle: task.title,
                  taskNo: task.task_no
                });
                setVerifyDialogOpen(true);
              }}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="max-sm:hidden">Verify</span>
            </Button>
          ) : (
            <DelegateTaskDialog task={task} availableStaff={availableStaff} />
          )}
        </div>
      );
    },
    size: 180,
    enableSorting: false,
  },
];

export function StaffDashboardTasksTable({ tasks, availableStaff, teams }: StaffDashboardTasksTableProps) {
  // TanStack Table state
  const id = useId();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "due_date",
      desc: false,
    },
  ]);

  // Verification dialog state
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedDelegation, setSelectedDelegation] = useState<{
    taskId: string;
    delegation: TaskDelegation;
    taskTitle: string;
    taskNo: string;
  } | null>(null);


  // Auth context
  const { user } = useAuth();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: 'default' as const, className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      in_progress: { variant: 'default' as const, className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
      todo: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
      backlog: { variant: 'outline' as const, className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.todo;
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 hover:bg-red-100' },
      medium: { variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      low: { variant: 'secondary' as const, className: 'bg-green-100 text-green-800 hover:bg-green-100' },
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return (
      <Badge variant={config.variant} className={config.className}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getDelegationBadge = (task: Task) => {
    const currentUserId = user?.id;
    
    if (!task.delegations || task.delegations.length === 0) {
      return null;
    }
    
    // Find delegation involving current user
    const delegation = task.delegations.find(d => 
      d.from_staff_id === currentUserId || d.to_staff_id === currentUserId
    );
    
    if (!delegation) return null;
    
    // If user is delegator and status is 'completed'
    if (delegation.from_staff_id === currentUserId && delegation.delegation_status === 'completed') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 whitespace-nowrap">
                <AlertCircle className="h-3 w-3 mr-1" />
                Verify
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pending your verification</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // If user is delegatee and status is 'active'
    if (delegation.to_staff_id === currentUserId && delegation.delegation_status === 'active') {
      const firstName = delegation.from_staff?.name?.split(' ')[0] || 'Unknown';
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 whitespace-nowrap">
                <User className="h-3 w-3 mr-1" />
                From {firstName}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delegated from {delegation.from_staff?.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    // If user is delegatee and status is 'completed'
    if (delegation.to_staff_id === currentUserId && delegation.delegation_status === 'completed') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 hover:bg-green-100 whitespace-nowrap">
                <CheckCircle className="h-3 w-3 mr-1" />
                Done
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Completed - Awaiting verification</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return null;
  };

  const getAssigneeDisplay = (task: Task) => {
    // Team assignment - show actual team name
    if (task.allocation_mode === 'team' && task.assigned_team_ids?.length > 0) {
      const teamId = task.assigned_team_ids[0];
      const team = teams?.find(t => t.id === teamId);
      const teamName = team?.name || 'Unknown Team';
      
      return (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-medium text-blue-600">T</span>
          </div>
          <span className="text-sm font-medium">{teamName}</span>
        </div>
      );
    }

    // Individual assignment - access nested staff object
    if (task.assigned_staff_ids?.length > 0 && task.assigned_staff && task.assigned_staff.length > 0) {
      const assigneeId = task.assigned_staff_ids[0];
      
      // Find the assignment object
      const assignment = task.assigned_staff.find((a: any) => a.staff_id === assigneeId);
      
      if (assignment?.staff) {
        const staffMember = assignment.staff;
        return (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={staffMember.profile_image_url || undefined} />
              <AvatarFallback className="text-xs">
                {staffMember.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{staffMember.name}</span>
          </div>
        );
      }
    }

    return <span className="text-sm text-muted-foreground">Unassigned</span>;
  };

  // Initialize TanStack Table
  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination,
    },
    meta: {
      getStatusBadge,
      getPriorityBadge,
      getAssigneeDisplay,
      getDelegationBadge,
      availableStaff,
      currentUserId: user?.id,
      setSelectedDelegation,
      setVerifyDialogOpen,
    },
  });

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Edit className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No tasks assigned</h3>
        <p className="text-muted-foreground text-sm max-w-sm">
          You don&apos;t have any tasks assigned to you yet. Check back later or contact your manager.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-background">
        <div className="overflow-x-auto">
          <div className="max-h-[600px] overflow-y-auto">
            <Table className="table-fixed min-w-full">
            <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: `${header.getSize()}px` }}
                      className="h-11"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <div
                          className="flex h-full cursor-pointer items-center justify-between gap-2 select-none"
                          onClick={header.column.getToggleSortingHandler()}
                          onKeyDown={(e) => {
                            if (
                              header.column.getCanSort() &&
                              (e.key === "Enter" || e.key === " ")
                            ) {
                              e.preventDefault()
                              header.column.getToggleSortingHandler()?.(e)
                            }
                          }}
                          tabIndex={header.column.getCanSort() ? 0 : undefined}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: (
                              <ChevronUpIcon
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                            desc: (
                              <ChevronDownIcon
                                className="shrink-0 opacity-60"
                                size={16}
                                aria-hidden="true"
                              />
                            ),
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      onClick={(e) => {
                        // Stop propagation for action cells to allow button clicks
                        if (cell.column.id === 'actions') {
                          e.stopPropagation();
                        }
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Edit className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No tasks assigned</h3>
                    <p className="text-muted-foreground text-sm max-w-sm">
                      You don&apos;t have any tasks assigned to you yet. Check back later or contact your manager.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-8">
        {/* Results per page */}
        <div className="flex items-center gap-3">
          <Label htmlFor={id} className="max-sm:sr-only">
            Rows per page
          </Label>
          <Select
            value={table.getState().pagination.pageSize.toString()}
            onValueChange={(value) => {
              table.setPageSize(Number(value))
            }}
          >
            <SelectTrigger id={id} className="w-fit whitespace-nowrap">
              <SelectValue placeholder="Select number of results" />
            </SelectTrigger>
            <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2">
              {[5, 10, 25, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={pageSize.toString()}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Page number information */}
        <div className="flex grow justify-end text-sm whitespace-nowrap text-muted-foreground">
          <p
            className="text-sm whitespace-nowrap text-muted-foreground"
            aria-live="polite"
          >
            <span className="text-foreground">
              {table.getState().pagination.pageIndex *
                table.getState().pagination.pageSize +
                1}
              -
              {Math.min(
                Math.max(
                  table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                    table.getState().pagination.pageSize,
                  0
                ),
                table.getRowCount()
              )}
            </span>{" "}
            of{" "}
            <span className="text-foreground">
              {table.getRowCount().toString()}
            </span>
          </p>
        </div>
        {/* Pagination buttons */}
        <div>
          <Pagination>
            <PaginationContent>
              {/* First page button */}
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.firstPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to first page"
                >
                  <ChevronFirstIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              {/* Previous page button */}
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  aria-label="Go to previous page"
                >
                  <ChevronLeftIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              {/* Next page button */}
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to next page"
                >
                  <ChevronRightIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
              {/* Last page button */}
              <PaginationItem>
                <Button
                  size="icon"
                  variant="outline"
                  className="disabled:pointer-events-none disabled:opacity-50"
                  onClick={() => table.lastPage()}
                  disabled={!table.getCanNextPage()}
                  aria-label="Go to last page"
                >
                  <ChevronLastIcon size={16} aria-hidden="true" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>

      {/* Verification Dialog */}
      {selectedDelegation && (
        <VerifyDelegationDialog
          isOpen={verifyDialogOpen}
          onOpenChange={setVerifyDialogOpen}
          taskId={selectedDelegation.taskId}
          delegation={selectedDelegation.delegation}
          taskTitle={selectedDelegation.taskTitle}
          taskNo={selectedDelegation.taskNo}
        />
      )}

    </div>
  );
}
