"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  User,
  CheckCircle2,
  Calendar,
  Clock,
  TrendingUp,
  Flame,
  XCircle,
  Coffee,
  Timer,
} from "lucide-react";
import { format } from "date-fns";
import { useAttendance } from "@/hooks/use-attendance";
import { useTasks } from "@/hooks/use-tasks";
import { useAttendanceTasks } from "@/hooks/use-attendance-tasks";
import type { Staff } from "@/types";
import type { AttendanceRecord } from "@/types/attendance";

interface EmployeeDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff;
  dateRange?: number; // Days to look back, default 30
}

export function EmployeeDetailsDialog({
  isOpen,
  onOpenChange,
  staff,
  dateRange = 30,
}: EmployeeDetailsDialogProps) {
  const { useAttendanceHistory } = useAttendance();
  const { tasks } = useTasks();
  const { data: attendanceHistory } = useAttendanceHistory(staff.id, dateRange);
  const { data: attendanceTasks } = useAttendanceTasks(staff.id, dateRange);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const completedTasks = tasks.filter(
      (task) =>
        task.status === "completed" &&
        task.assigned_staff_ids?.includes(staff.id)
    ).length;

    const attendanceCount = attendanceHistory?.length || 0;

    // Calculate total hours worked
    const totalHours = attendanceHistory?.reduce((total, record) => {
      if (record.login_time && record.logout_time) {
        const login = new Date(record.login_time);
        const logout = new Date(record.logout_time);
        const diffMs = logout.getTime() - login.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        return total + diffHours;
      }
      return total;
    }, 0) || 0;

    // Calculate attendance streak
    const streak = calculateAttendanceStreak(attendanceHistory || []);

    // Calculate missed days
    const missedDays = calculateMissedDays(attendanceHistory || [], dateRange);

    // Calculate break frequency (average breaks per day)
    const breakFrequency = calculateBreakFrequency(attendanceHistory || []);

    // Calculate punctuality (on-time arrivals percentage)
    const punctuality = calculatePunctuality(attendanceHistory || []);

    return {
      completedTasks,
      attendanceCount,
      totalHours: Math.round(totalHours * 10) / 10,
      streak,
      missedDays,
      breakFrequency,
      punctuality,
    };
  }, [tasks, staff.id, attendanceHistory, dateRange]);

  // Prepare chart data (weekly performance)
  const chartData = useMemo(() => {
    if (!attendanceHistory || attendanceHistory.length === 0) return [];

    // Group by week
    const weeklyData: Record<string, { week: string; tasks: number; attendance: number }> = {};

    attendanceHistory.forEach((record) => {
      const date = new Date(record.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = format(weekStart, "MMM dd");

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { week: weekKey, tasks: 0, attendance: 0 };
      }
      weeklyData[weekKey].attendance += 1;
    });

    // Add completed tasks per week
    if (attendanceTasks) {
      attendanceTasks.forEach((task) => {
        if (task.task_status === "completed" && task.attendance_date) {
          const date = new Date(task.attendance_date);
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          const weekKey = format(weekStart, "MMM dd");

          if (weeklyData[weekKey]) {
            weeklyData[weekKey].tasks += 1;
          }
        }
      });
    }

    return Object.values(weeklyData).slice(-8); // Last 8 weeks
  }, [attendanceHistory, attendanceTasks]);

  const chartConfig = {
    tasks: {
      label: "Completed Tasks",
      color: "hsl(142, 76%, 36%)", // Green
    },
    attendance: {
      label: "Attendance Days",
      color: "hsl(217, 91%, 60%)", // Blue
    },
  };

  // Enhanced attendance history with additional metrics
  const enhancedHistory = useMemo(() => {
    if (!attendanceHistory) return [];

    return attendanceHistory.map((record) => {
      const loginTime = record.login_time ? new Date(record.login_time) : null;
      const logoutTime = record.logout_time ? new Date(record.logout_time) : null;
      
      // Calculate work duration
      const workDuration = loginTime && logoutTime
        ? Math.round((logoutTime.getTime() - loginTime.getTime()) / (1000 * 60 * 60 * 10)) / 10
        : null;

      // Check if on time (assuming 9:00 AM as standard start time)
      const isOnTime = loginTime
        ? loginTime.getHours() < 9 || (loginTime.getHours() === 9 && loginTime.getMinutes() <= 15)
        : null;

      // Count breaks (check-ins)
      const breaks = record.check_ins?.length || 0;

      return {
        ...record,
        workDuration,
        isOnTime,
        breaks,
      };
    });
  }, [attendanceHistory]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {staff.profile_image_url && staff.profile_image_url.trim() !== "" ? (
                <AvatarImage src={staff.profile_image_url} alt={staff.name} />
              ) : (
                <AvatarFallback>
                  <User className="h-8 w-8" />
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold">{staff.name}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                <span>{staff.email}</span>
                <span>•</span>
                <span>{staff.department}</span>
                <span>•</span>
                <Badge variant="outline">{staff.role}</Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 space-y-6">
          {/* KPI Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Completed Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.completedTasks}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Tasks</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Attendance Count
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.attendanceCount}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>Days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Total Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalHours}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  <span>Hours</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.streak}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  <span>Days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Missed Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.missedDays}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <XCircle className="h-3 w-3 text-red-500" />
                  <span>Days</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  Punctuality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.punctuality}%</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Timer className="h-3 w-3" />
                  <span>On Time</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="week"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      className="text-xs"
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent />}
                    />
                    <Bar
                      dataKey="tasks"
                      fill="var(--color-tasks)"
                      radius={[4, 4, 0, 0]}
                      name="Completed Tasks"
                    />
                    <Bar
                      dataKey="attendance"
                      fill="var(--color-attendance)"
                      radius={[4, 4, 0, 0]}
                      name="Attendance Days"
                    />
                  </BarChart>
                </ChartContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Individual Attendance History Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Individual Attendance History</CardTitle>
            </CardHeader>
            <CardContent>
              {enhancedHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Login Time</TableHead>
                        <TableHead>Logout Time</TableHead>
                        <TableHead>Work Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Punctuality</TableHead>
                        <TableHead>Break Frequency</TableHead>
                        <TableHead>Attendance Streak</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {enhancedHistory.map((record, index) => {
                        const currentStreak = calculateCurrentStreak(enhancedHistory, index);
                        return (
                          <TableRow key={record.id}>
                            <TableCell>
                              {record.date
                                ? format(new Date(record.date), "MMM dd, yyyy")
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {record.login_time
                                ? format(new Date(record.login_time), "HH:mm")
                                : "N/A"}
                            </TableCell>
                            <TableCell>
                              {record.logout_time
                                ? format(new Date(record.logout_time), "HH:mm")
                                : "Still Active"}
                            </TableCell>
                            <TableCell>
                              {record.workDuration !== null ? (
                                <span className="text-sm font-medium">
                                  {record.workDuration}h
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  record.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {record.status === "active" ? "Active" : "Logged Out"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {record.isOnTime !== null ? (
                                <Badge
                                  className={
                                    record.isOnTime
                                      ? "bg-green-100 text-green-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {record.isOnTime ? "On Time" : "Late"}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-sm">N/A</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Coffee className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{record.breaks}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {currentStreak > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Flame className="h-3 w-3 text-orange-500" />
                                  <span className="text-sm font-medium">{currentStreak} days</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No attendance history available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper functions
function calculateAttendanceStreak(history: AttendanceRecord[]): number {
  if (history.length === 0) return 0;

  // Sort by date descending
  const sorted = [...history].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const record of sorted) {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === streak) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

function calculateMissedDays(history: AttendanceRecord[], totalDays: number): number {
  const attendanceDates = new Set(
    history.map((record) => {
      const date = new Date(record.date);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let missedDays = 0;
  for (let i = 0; i < totalDays; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    checkDate.setHours(0, 0, 0, 0);

    // Skip weekends (optional - you can remove this if weekends count)
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    if (!attendanceDates.has(checkDate.getTime())) {
      missedDays++;
    }
  }

  return missedDays;
}

function calculateBreakFrequency(history: AttendanceRecord[]): number {
  if (history.length === 0) return 0;

  const totalBreaks = history.reduce(
    (sum, record) => sum + (record.check_ins?.length || 0),
    0
  );

  return Math.round((totalBreaks / history.length) * 10) / 10;
}

function calculatePunctuality(history: AttendanceRecord[]): number {
  if (history.length === 0) return 0;

  let onTimeCount = 0;
  let totalCount = 0;

  history.forEach((record) => {
    if (record.login_time) {
      totalCount++;
      const loginTime = new Date(record.login_time);
      // Consider on-time if login is before 9:15 AM
      if (loginTime.getHours() < 9 || (loginTime.getHours() === 9 && loginTime.getMinutes() <= 15)) {
        onTimeCount++;
      }
    }
  });

  return totalCount > 0 ? Math.round((onTimeCount / totalCount) * 100) : 0;
}

function calculateCurrentStreak(history: AttendanceRecord[], currentIndex: number): number {
  if (currentIndex === 0) return 1;

  let streak = 1;
  const currentDate = new Date(history[currentIndex].date);
  currentDate.setHours(0, 0, 0, 0);

  for (let i = currentIndex - 1; i >= 0; i--) {
    const prevDate = new Date(history[i].date);
    prevDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === streak) {
      streak++;
      currentDate.setDate(currentDate.getDate() - diffDays);
    } else {
      break;
    }
  }

  return streak;
}

