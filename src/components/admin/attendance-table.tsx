"use client";

import { useState } from "react";
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
import { 
  MoreVertical, 
  Clock, 
  LogOut, 
  Activity, 
  Users, 
  User,
  Calendar,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AttendanceRecord } from "@/types/attendance";
import { EmployeeDetailsDialog } from "./employee-details-dialog";
import { useStaff } from "@/hooks/use-staff";

interface AttendanceTableProps {
  records: AttendanceRecord[];
  mode: 'today' | 'history';
  onManualLogout?: (staffId: string, staffName: string) => void;
  isMarkingLogout?: boolean;
  getTaskStatusDisplay: (attendanceId: string) => React.ReactElement;
}

export function AttendanceTable({ 
  records, 
  mode, 
  onManualLogout, 
  isMarkingLogout, 
  getTaskStatusDisplay 
}: AttendanceTableProps) {
  const [expandedCheckIns, setExpandedCheckIns] = useState<Set<string>>(new Set());
  const [selectedStaff, setSelectedStaff] = useState<AttendanceRecord | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { staff } = useStaff();

  const formatTime = (timeString: string | null | undefined) => {
    if (!timeString) return 'N/A';
    return format(new Date(timeString), 'HH:mm:ss');
  };

  const formatDateTime = (timeString: string | null) => {
    if (!timeString) return 'N/A';
    return format(new Date(timeString), 'MMM dd, HH:mm:ss');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'logged_out':
        return <Badge className="bg-gray-100 text-gray-800">Logged Out</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const toggleCheckIns = (recordId: string) => {
    setExpandedCheckIns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handleManualLogout = (staffId: string, staffName: string) => {
    if (onManualLogout) {
      onManualLogout(staffId, staffName);
    }
  };

  const handleStaffClick = (record: AttendanceRecord) => {
    setSelectedStaff(record);
    setIsDetailsDialogOpen(true);
  };

  return (
    <>
      <div className="rounded-md border max-sm:mx-3">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {mode === 'today' ? (
                <>
                  <TableHead>Staff Member</TableHead>
                  <TableHead className="max-sm:hidden">Department</TableHead>
                  <TableHead>Login Time</TableHead>
                  <TableHead>Logout Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-ins</TableHead>
                  <TableHead>Task Status</TableHead>
                  <TableHead className="max-sm:hidden">Last Activity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Date</TableHead>
                  <TableHead>Login Time</TableHead>
                  <TableHead>Logout Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-ins</TableHead>
                  <TableHead>Task Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={mode === 'today' ? 9 : 7} className="text-center py-12">
                  <p className="text-muted-foreground">
                    {mode === 'today' ? 'No attendance records found for today.' : 'No attendance history found for the selected period.'}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow 
                  key={record.id}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {mode === 'today' ? (
                    <>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {record.staff?.profile_image_url && record.staff.profile_image_url.trim() !== '' ? (
                              <AvatarImage src={record.staff.profile_image_url} alt={record.staff.name} />
                            ) : (
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStaffClick(record);
                              }}
                              className="font-medium text-sm hover:text-primary hover:underline transition-colors text-left"
                            >
                              {record.staff?.name || 'Unknown Staff'}
                            </button>
                            <div className="text-sm text-muted-foreground max-sm:hidden">
                              {record.staff?.email}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-sm:hidden">
                        {record.staff?.department || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{formatTime(record.login_time)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.logout_time ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-red-600" />
                            <span className="text-sm">{formatTime(record.logout_time)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Still Active</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell>
                        {record.check_ins && record.check_ins.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            <Badge variant="outline" className="w-fit">
                              {record.check_ins.length} session{record.check_ins.length > 1 ? 's' : ''}
                            </Badge>
                            <button
                              onClick={() => toggleCheckIns(record.id)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
                            >
                              {expandedCheckIns.has(record.id) ? 'Hide times' : 'View times'}
                            </button>
                            {expandedCheckIns.has(record.id) && (
                              <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-muted">
                                {record.check_ins.map((checkIn, idx) => (
                                  <div key={idx} className="text-xs">
                                    {idx + 1}. {format(new Date(checkIn), 'HH:mm:ss')}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline">0 sessions</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getTaskStatusDisplay(record.id)}
                      </TableCell>
                      <TableCell className="max-sm:hidden">
                        {record.last_activity ? (
                          <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-blue-600" />
                            <span className="text-sm">{formatDateTime(record.last_activity)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStaffClick(record);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {record.status === 'active' && onManualLogout && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleManualLogout(record.staff_id, record.staff?.name || 'Staff');
                                }}
                                disabled={isMarkingLogout}
                              >
                                <LogOut className="h-4 w-4 mr-2" />
                                Mark Logout
                              </DropdownMenuItem>
                            )}
                            {record.check_ins && record.check_ins.length > 0 && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCheckIns(record.id);
                                }}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                {expandedCheckIns.has(record.id) ? 'Hide Check-ins' : 'View Check-ins'}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {record.date ? format(new Date(record.date), 'MMM dd, yyyy') : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{formatTime(record.login_time)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.logout_time ? (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-red-600" />
                            <span className="text-sm">{formatTime(record.logout_time)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Still Active</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {record.check_ins?.length || 0} times
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getTaskStatusDisplay(record.id)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStaffClick(record);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {record.status === 'active' && onManualLogout && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleManualLogout(record.staff_id, record.staff?.name || 'Staff');
                                }}
                                disabled={isMarkingLogout}
                              >
                                <LogOut className="h-4 w-4 mr-2" />
                                Mark Logout
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Employee Details Dialog */}
      {selectedStaff && selectedStaff.staff && staff.find(s => s.id === selectedStaff.staff!.id) && (
        <EmployeeDetailsDialog
          isOpen={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          staff={staff.find(s => s.id === selectedStaff.staff!.id)!}
          dateRange={30}
        />
      )}
    </>
  );
}
