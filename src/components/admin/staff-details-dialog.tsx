"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  User, 
  Mail, 
  Building2, 
  Briefcase, 
  Clock, 
  Activity, 
  LogOut,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format } from "date-fns";

interface StaffDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  staffData: {
    id: string;
    name: string;
    email: string;
    department: string;
    role: string;
    profile_image_url?: string | null;
  };
  attendanceData?: {
    login_time?: string;
    logout_time?: string;
    status: string;
    check_ins?: string[];
    last_activity?: string;
  };
  taskStatus?: React.ReactElement;
  onManualLogout?: (staffId: string, staffName: string) => void;
  isMarkingLogout?: boolean;
}

export function StaffDetailsDialog({
  isOpen,
  onOpenChange,
  staffData,
  attendanceData,
  taskStatus,
  onManualLogout,
  isMarkingLogout
}: StaffDetailsDialogProps) {
  const [expandedCheckIns, setExpandedCheckIns] = useState(false);

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

  const handleManualLogout = () => {
    if (onManualLogout) {
      onManualLogout(staffData.id, staffData.name);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {staffData.profile_image_url && staffData.profile_image_url.trim() !== '' ? (
                <AvatarImage src={staffData.profile_image_url} alt={staffData.name} />
              ) : (
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="text-lg font-semibold">{staffData.name}</div>
              <div className="text-sm text-muted-foreground">{staffData.email}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Email</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">{staffData.email}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Department</span>
                </div>
                <p className="text-sm text-muted-foreground ml-6">{staffData.department}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Role</span>
                </div>
                <Badge variant="outline" className="ml-6">
                  {staffData.role}
                </Badge>
              </div>

              {attendanceData && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Status</span>
                  </div>
                  <div className="ml-6">
                    {getStatusBadge(attendanceData.status)}
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Information */}
            {attendanceData && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Attendance Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Login Time</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {formatTime(attendanceData.login_time)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium">Logout Time</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {attendanceData.logout_time ? formatTime(attendanceData.logout_time) : 'Still Active'}
                    </p>
                  </div>

                  {attendanceData.last_activity && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Last Activity</span>
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">
                        {formatDateTime(attendanceData.last_activity)}
                      </p>
                    </div>
                  )}

                  {attendanceData.check_ins && attendanceData.check_ins.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Check-ins</span>
                        <Badge variant="outline" className="text-xs">
                          {attendanceData.check_ins.length} session{attendanceData.check_ins.length > 1 ? 's' : ''}
                        </Badge>
                      </div>
                      <div className="ml-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedCheckIns(!expandedCheckIns)}
                          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {expandedCheckIns ? (
                            <>
                              <ChevronUp className="h-3 w-3 mr-1" />
                              Hide times
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3 mr-1" />
                              View times
                            </>
                          )}
                        </Button>
                        {expandedCheckIns && (
                          <div className="mt-2 space-y-1 pl-4 border-l-2 border-muted">
                            {attendanceData.check_ins.map((checkIn, idx) => (
                              <div key={idx} className="text-xs text-muted-foreground">
                                {idx + 1}. {format(new Date(checkIn), 'HH:mm:ss')}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Task Status */}
            {taskStatus && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Current Task Status</h3>
                <div className="ml-6">
                  {taskStatus}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

       
      </DialogContent>
    </Dialog>
  );
}
