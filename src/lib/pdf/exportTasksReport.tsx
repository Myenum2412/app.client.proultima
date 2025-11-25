import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { TasksReportPDF } from '@/components/pdf/tasks-report-pdf';
import { formatDateForFilename } from '@/utils/pdf-helpers';
import { toast } from 'sonner';
import type { Task } from '@/types';

export async function exportTasksReport(tasks: Task[]) {
  try {
    // console.log('Exporting PDF with data:', tasks);
    // console.log('Data count:', tasks.length);
    if (tasks.length > 0) {
      // console.log('First item:', tasks[0]);
    }
    
    const doc = <TasksReportPDF tasks={tasks} />;
    const filename = `tasks-report-${formatDateForFilename(new Date().toISOString())}.pdf`;
    
    const blob = await pdf(doc).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Tasks report exported successfully!');
  } catch (error) {
    console.error('PDF generation error:', error);
    toast.error('Failed to generate PDF. Please try again.');
  }
}
