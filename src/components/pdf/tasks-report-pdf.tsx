import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';
import type { Task } from '@/types';

// Register fonts - TEMPORARILY DISABLED FOR TESTING
// Font.register({
//   family: 'Inter',
//   fonts: [
//     { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2' },
//     { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2', fontWeight: 'bold' },
//   ],
// });

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    // fontFamily: 'Inter', // Commented out for testing
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #E5E7EB',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  summary: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottom: '1 solid #D1D5DB',
  },
  tableHeaderCell: {
    padding: 8,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    borderRight: '1 solid #D1D5DB',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #E5E7EB',
  },
  tableCell: {
    padding: 8,
    fontSize: 9,
    color: '#374151',
    borderRight: '1 solid #E5E7EB',
  },
  statusBadge: {
    padding: '2 6',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusCompleted: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  statusInProgress: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  statusTodo: {
    backgroundColor: '#DBEAFE',
    color: '#1E40AF',
  },
  statusBacklog: {
    backgroundColor: '#F3F4F6',
    color: '#374151',
  },
  priorityBadge: {
    padding: '2 6',
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  priorityLow: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  priorityMedium: {
    backgroundColor: '#FEF3C7',
    color: '#92400E',
  },
  priorityHigh: {
    backgroundColor: '#FED7AA',
    color: '#C2410C',
  },
  priorityUrgent: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#9CA3AF',
    borderTop: '1 solid #E5E7EB',
    paddingTop: 10,
  },
});

interface TasksReportPDFProps {
  tasks: Task[];
}

export function TasksReportPDF({ tasks }: TasksReportPDFProps) {
  // console.log('📄 PDF Component received tasks:', tasks);
  // console.log('📄 PDF Component tasks count:', tasks.length);
  
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return [styles.statusBadge, styles.statusCompleted];
      case 'in_progress':
        return [styles.statusBadge, styles.statusInProgress];
      case 'todo':
        return [styles.statusBadge, styles.statusTodo];
      case 'backlog':
        return [styles.statusBadge, styles.statusBacklog];
      default:
        return [styles.statusBadge];
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'low':
        return [styles.priorityBadge, styles.priorityLow];
      case 'medium':
        return [styles.priorityBadge, styles.priorityMedium];
      case 'high':
        return [styles.priorityBadge, styles.priorityHigh];
      case 'urgent':
        return [styles.priorityBadge, styles.priorityUrgent];
      default:
        return [styles.priorityBadge];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return { color: '#065F46', backgroundColor: '#D1FAE5' };
      case 'in_progress': return { color: '#92400E', backgroundColor: '#FEF3C7' };
      case 'todo': return { color: '#1E40AF', backgroundColor: '#DBEAFE' };
      case 'backlog': return { color: '#374151', backgroundColor: '#F3F4F6' };
      default: return { color: '#374151' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return { color: '#065F46', backgroundColor: '#D1FAE5' };
      case 'medium': return { color: '#92400E', backgroundColor: '#FEF3C7' };
      case 'high': return { color: '#C2410C', backgroundColor: '#FED7AA' };
      case 'urgent': return { color: '#DC2626', backgroundColor: '#FEE2E2' };
      default: return { color: '#374151' };
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'todo' || t.status === 'backlog').length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tasks Activity Report</Text>
          <Text style={styles.subtitle}>Staff Work Activities and Status</Text>
          <Text style={styles.date}>
            Generated on {format(new Date(), 'MMMM dd, yyyy')}
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Tasks:</Text>
            <Text style={styles.summaryValue}>{tasks.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Completed:</Text>
            <Text style={styles.summaryValue}>{completedTasks}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>In Progress:</Text>
            <Text style={styles.summaryValue}>{inProgressTasks}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pending:</Text>
            <Text style={styles.summaryValue}>{pendingTasks}</Text>
          </View>
        </View>

        {/* Tasks Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '8%' }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { width: '30%' }]}>Task Name</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Status</Text>
            <Text style={[styles.tableHeaderCell, { width: '15%' }]}>Priority</Text>
            <Text style={[styles.tableHeaderCell, { width: '16%' }]}>Start Time</Text>
            <Text style={[styles.tableHeaderCell, { width: '16%' }]}>End Time</Text>
          </View>

          {/* Table Rows */}
          {tasks.map((task, index) => (
            <View key={task.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '8%' }]}>{index + 1}</Text>
              <Text style={[styles.tableCell, { width: '30%' }]}>{task.title}</Text>
              <Text style={[styles.tableCell, { width: '15%', ...getStatusColor(task.status) }]}>
                {task.status}
              </Text>
              <Text style={[styles.tableCell, { width: '15%', ...getPriorityColor(task.priority) }]}>
                {task.priority}
              </Text>
              <Text style={[styles.tableCell, { width: '16%' }]}>
                {format(new Date(task.created_at), 'MMM dd, yyyy')}
              </Text>
              <Text style={[styles.tableCell, { width: '16%' }]}>
                {task.status === 'completed' && task.updated_at
                  ? format(new Date(task.updated_at), 'MMM dd, yyyy')
                  : task.due_date
                  ? format(new Date(task.due_date), 'MMM dd, yyyy')
                  : '-'}
              </Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          This report was generated automatically by the Pro-Ultima Staff Portal
        </Text>
      </Page>
    </Document>
  );
}
