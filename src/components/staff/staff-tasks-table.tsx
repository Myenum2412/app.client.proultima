"use client";

import { useState, useId } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Calendar, Clock, Link, Users } from "lucide-react";
import { Task } from "@/types";
import { useStaff } from "@/hooks/use-staff";
import { useTaskPriorities } from "@/hooks/use-task-priorities";
import { format } from "date-fns";
import { UpdateTaskDialog } from '@/components/staff/update-task-dialog';
import { DelegateTaskDialog } from '@/components/staff/delegate-task-dialog';
import { StaffTaskDetailsDialog } from '@/components/staff/staff-task-details-dialog';
import { useAuth } from '@/contexts/auth-context';
import { useMemo } from 'react';
import { 
  getTaskDisplayNumber, 
  getTaskTitleWithOriginalAssignee, 
  getDelegationChainDisplay, 
  getLatestDelegationReason,
  getCleanTaskTitle
} from '@/lib/task-utils';

interface StaffTasksTableProps {
  tasks: Task[];
}

const columns: ColumnDef<Task>[] = [
  {
    header: "Task #",
    accessorKey: "task_no",
    cell: ({ row }) => (
      <div className="font-mono text-sm font-medium text-muted-foreground flex items-center gap-2">
        {getTaskDisplayNumber(row.original) || 'N/A'}
        {row.original.parent_task_id && (
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <Link className="h-3 w-3 mr-1" />
            Linked Copy
          </Badge>
        )}
        {row.original.child_tasks && row.original.child_tasks > 0 && (
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            <Users className="h-3 w-3 mr-1" />
            {row.original.child_tasks} Copies
          </Badge>
        )}
      </div>
    ),
    size: 100,
  },
  {
    header: "Task",
    accessorKey: "title",
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{getCleanTaskTitle(task)}</div>
          {task.description && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {task.description}
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>#{getTaskDisplayNumber(task)}</span>
            {task.parent_task_id && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                <Link className="h-3 w-3 mr-1" />
                Linked Copy
              </Badge>
            )}
            {task.child_tasks && task.child_tasks > 0 && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                <Users className="h-3 w-3 mr-1" />
                {task.child_tasks} Copies
              </Badge>
            )}
            {task.is_repeated && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Recurring
              </Badge>
            )}
          </div>
          {/* Delegation badges */}
          {task.has_delegations && getDelegationChainDisplay(task) && (
            <div className="mt-1">
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                {getDelegationChainDisplay(task)}
              </Badge>
              {getLatestDelegationReason(task) && (
                <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">
                  Reason: {getLatestDelegationReason(task)}
                </p>
              )}
            </div>
          )}
          {/* Reschedule badges */}
          {task.has_pending_reschedule && task.pending_reschedule && (
            <div className="mt-1">
              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                <Calendar className="h-3 w-3 mr-1" />
                Reschedule Pending
              </Badge>
              <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">
                Reason: {task.pending_reschedule.reason}
              </p>
            </div>
          )}
          {task.has_approved_reschedule && task.latest_approved_reschedule && (
            <div className="mt-1">
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                <Calendar className="h-3 w-3 mr-1" />
                Rescheduled
              </Badge>
              {task.latest_approved_reschedule.admin_response && (
                <p className="text-xs text-muted-foreground italic mt-1 line-clamp-1">
                  Admin: {task.latest_approved_reschedule.admin_response}
                </p>
              )}
            </div>
          )}
        </div>
      );
    },
    size: 300,
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row, table }) => {
      const getStatusColor = (table.options.meta as any).getStatusColor;
      return (
        <Badge className={getStatusColor(row.getValue("status"))}>
          {(row.getValue("status") as string).replace('_', ' ')}
        </Badge>
      );
    },
    size: 120,
  },
  {
    header: "Priority",
    accessorKey: "priority",
    cell: ({ row, table }) => {
      const getPriorityColor = (table.options.meta as any).getPriorityColor;
      return (
        <Badge className={getPriorityColor(row.getValue("priority"))}>
          {row.getValue("priority")}
        </Badge>
      );
    },
    size: 120,
  },
  {
    header: "Due Date",
    accessorKey: "due_date",
    cell: ({ row }) => {
      const dueDate = row.getValue("due_date");
      return dueDate ? (
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-muted-foreground" />
          <span className="text-sm">
            {format(new Date(dueDate as string), 'MMM dd, yyyy')}
          </span>
        </div>
      ) : (
        <span className="text-sm text-muted-foreground">No due date</span>
      );
    },
    size: 140,
  },
  {
    header: "Actions",
    id: "actions",
    cell: ({ row, table }) => {
      const staff = (table.options.meta as any).staff;
      return (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <UpdateTaskDialog task={row.original} />
          <DelegateTaskDialog task={row.original} availableStaff={staff} />
        </div>
      );
    },
    size: 140,
    enableSorting: false,
  },
];

export function StaffTasksTable({ tasks }: StaffTasksTableProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Get staff data for delegation
  const { staff } = useStaff();
  const { user } = useAuth();
  const { priorities } = useTaskPriorities();

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

  // Create color map for quick lookup
  const priorityColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    priorities.forEach(p => {
      map[p.name] = p.color;
    });
    return map;
  }, [priorities]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'todo': return 'bg-blue-100 text-blue-800';
      case 'backlog': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    const color = priorityColorMap[priority] || 'gray';
    const colorClasses: Record<string, string> = {
      red: 'bg-red-100 text-red-800',
      orange: 'bg-orange-100 text-orange-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      gray: 'bg-gray-100 text-gray-800',
    };
    return colorClasses[color] || colorClasses.gray;
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
      getStatusColor,
      getPriorityColor,
      staff,
    },
  });

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="mx-auto h-12 w-12 mb-2 opacity-20" />
        <p>No tasks assigned to you yet.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="overflow-hidden rounded-md border bg-background">
          <Table className="table-fixed">
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
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedTask(row.original);
                      setIsDetailsOpen(true);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
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
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="mx-auto h-12 w-12 mb-2 opacity-20" />
                      <p>No tasks assigned to you yet.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
      </div>

      {/* Task Details Dialog */}
      <StaffTaskDetailsDialog
        task={selectedTask}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </>
  );
}
