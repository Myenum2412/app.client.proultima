import type { Task } from '@/types';

/**
 * Get the display number for a task with delegation suffix
 * @param task - The task object
 * @returns Task number with delegation suffix (e.g., "T001.1", "T001.2")
 */
export function getTaskDisplayNumber(task: Task): string {
  if (!task.has_delegations || task.delegation_count === 0) {
    return task.task_no || '';
  }
  return `${task.task_no}.${task.delegation_count}`;
}

/**
 * Get the task title with original assignee name
 * @param task - The task object
 * @returns Task title with original assignee if delegated
 */
export function getTaskTitleWithOriginalAssignee(task: Task): string {
  if (!task.has_delegations) {
    return task.title;
  }
  
  const originalName = task.delegations?.[0]?.from_staff?.name || 'Unknown';
  return `${task.title} - ${originalName}`;
}

/**
 * Get the delegation chain display string
 * @param task - The task object
 * @returns Delegation chain string or null if no delegations
 */
export function getDelegationChainDisplay(task: Task): string | null {
  if (!task.has_delegations || !task.delegations?.length) {
    return null;
  }
  
  // Build chain: "Staff A → Staff B → Staff C"
  const chain = task.delegations
    .map((d, index) => {
      if (index === 0) {
        // First delegation: show from → to
        return `${d.from_staff?.name || 'Unknown'} → ${d.to_staff?.name || 'Unknown'}`;
      } else {
        // Subsequent: just show → to
        return `→ ${d.to_staff?.name || 'Unknown'}`;
      }
    })
    .join(' ');
  
  return `Delegated: ${chain}`;
}

/**
 * Get the latest delegation reason
 * @param task - The task object
 * @returns Latest delegation reason or null
 */
export function getLatestDelegationReason(task: Task): string | null {
  if (!task.delegations?.length) {
    return null;
  }
  
  const latest = task.delegations[task.delegations.length - 1];
  return latest.notes || null;
}

/**
 * Get the delegation count for display
 * @param task - The task object
 * @returns Delegation count or 0
 */
export function getDelegationCount(task: Task): number {
  return task.delegation_count || 0;
}

/**
 * Check if a task has delegations
 * @param task - The task object
 * @returns True if task has delegations
 */
export function hasDelegations(task: Task): boolean {
  return task.has_delegations || false;
}

/**
 * Get the original assignee name
 * @param task - The task object
 * @returns Original assignee name or null
 */
export function getOriginalAssigneeName(task: Task): string | null {
  return task.delegations?.[0]?.from_staff?.name || null;
}

/**
 * Get clean task title for cloned tasks (removes delegation chain)
 * @param task - The task object
 * @returns Clean task title without delegation info
 */
export function getCleanTaskTitle(task: Task): string {
  if (task.parent_task_id) {
    // For cloned tasks, show only base title
    return task.title;
  }
  // For original tasks with delegation, can keep existing logic
  return getTaskTitleWithOriginalAssignee(task);
}
