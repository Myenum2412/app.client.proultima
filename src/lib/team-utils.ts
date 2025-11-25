/**
 * Team Membership Utilities
 * Helper functions for team-based task assignments and queries
 */

import type { Staff } from '@/types/auth';

export interface TeamMember {
  id: string;
  team_id: string;
  staff_id: string;
  joined_at: string;
}

export interface Team {
  id: string;
  name: string;
  leader_id: string;
  branch?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get all teams a staff member belongs to (as member OR leader)
 * @param staffId - The staff member's ID
 * @param teamMembers - Array of team membership records
 * @param teams - Array of team records
 * @returns Array of team IDs the staff member belongs to
 */
export function getStaffTeams(staffId: string, teamMembers: TeamMember[], teams?: Team[]): string[] {
  // Get teams where staff is a member
  const memberTeams = teamMembers
    .filter(tm => tm.staff_id === staffId)
    .map(tm => tm.team_id);
  
  // Get teams where staff is the leader
  const leaderTeams = teams
    ? teams.filter(t => t.leader_id === staffId).map(t => t.id)
    : [];
  
  // Combine both (remove duplicates using Set)
  return [...new Set([...memberTeams, ...leaderTeams])];
}

/**
 * Get all staff members in a team
 * @param teamId - The team's ID
 * @param teamMembers - Array of team membership records
 * @param staff - Array of staff records
 * @returns Array of staff members in the team
 */
export function getTeamMembers(teamId: string, teamMembers: TeamMember[], staff: Staff[]): Staff[] {
  const memberIds = teamMembers
    .filter(tm => tm.team_id === teamId)
    .map(tm => tm.staff_id);
  
  return staff.filter(s => memberIds.includes(s.id));
}

/**
 * Check if a staff member belongs to a specific team
 * @param staffId - The staff member's ID
 * @param teamId - The team's ID
 * @param teamMembers - Array of team membership records
 * @returns True if staff member belongs to the team
 */
export function isStaffInTeam(staffId: string, teamId: string, teamMembers: TeamMember[]): boolean {
  return teamMembers.some(tm => tm.staff_id === staffId && tm.team_id === teamId);
}

/**
 * Get team leader information
 * @param teamId - The team's ID
 * @param teams - Array of team records
 * @param staff - Array of staff records
 * @returns Team leader staff record or null
 */
export function getTeamLeader(teamId: string, teams: Team[], staff: Staff[]): Staff | null {
  const team = teams.find(t => t.id === teamId);
  if (!team) return null;
  
  return staff.find(s => s.id === team.leader_id) || null;
}

/**
 * Filter tasks assigned to a staff member (individual OR team assignments)
 * @param tasks - Array of tasks
 * @param staffId - The staff member's ID
 * @param teamMembers - Array of team membership records
 * @param teams - Array of team records (optional, for leader check)
 * @returns Filtered tasks assigned to the staff member
 */
export function getStaffTasks(tasks: any[], staffId: string, teamMembers: TeamMember[], teams?: Team[]) {
  const userTeams = getStaffTeams(staffId, teamMembers, teams);
  
  // console.log(`🔍 getStaffTasks: Filtering tasks for staff ${staffId}`);
  // console.log(`🔍 User teams:`, userTeams);
  // console.log(`🔍 Total tasks to filter:`, tasks.length);
  
  const filteredTasks = tasks.filter(task => {
    // Individual assignment
    const isIndividuallyAssigned = task.assigned_staff_ids?.includes(staffId);
    
    // Team assignment - check if staff member belongs to any assigned teams (as member OR leader)
    const isTeamAssigned = task.assigned_team_ids?.some((teamId: string) => userTeams.includes(teamId));
    
    // Created by staff - check if staff member created the task
    const isCreatedByStaff = task.created_by_staff_id === staffId;
    
    // Delegated to staff - check if staff member is a delegatee in any delegation
    const isDelegatedTo = task.delegations?.some((d: any) => d.to_staff_id === staffId);
    
    // Delegated from staff - check if staff member is a delegator in any delegation
    const isDelegatedFrom = task.delegations?.some((d: any) => d.from_staff_id === staffId);
    
    const isAssigned = isIndividuallyAssigned || isTeamAssigned || isCreatedByStaff || isDelegatedTo || isDelegatedFrom;
    
    if (isAssigned) {
      // console.log(`✅ Task ${task.task_no} assigned to staff ${staffId}:`, {
      //   task_no: task.task_no,
      //   title: task.title,
      //   assigned_staff_ids: task.assigned_staff_ids,
      //   assigned_team_ids: task.assigned_team_ids,
      //   parent_task_id: task.parent_task_id,
      //   isIndividuallyAssigned,
      //   isTeamAssigned,
      //   isCreatedByStaff
      // });
    }
    
    return isAssigned;
  });
  
  // console.log(`🔍 Filtered tasks for staff ${staffId}:`, filteredTasks.length);
  return filteredTasks;
}

/**
 * Get team name by ID
 * @param teamId - The team's ID
 * @param teams - Array of team records
 * @returns Team name or fallback string
 */
export function getTeamName(teamId: string, teams: Team[]): string {
  const team = teams.find(t => t.id === teamId);
  return team?.name || `Unknown Team (${teamId})`;
}

/**
 * Format team assignment display name
 * @param staffName - Staff member's name
 * @param teamName - Team name
 * @returns Formatted display string
 */
export function formatTeamAssignment(staffName: string, teamName: string): string {
  return `${staffName} (${teamName})`;
}
