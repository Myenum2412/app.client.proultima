'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { getCurrentUser } from '@/lib/auth';
import { useAuth } from '@/contexts/auth-context';
import { broadcastDataUpdate, subscribeToBroadcast } from '@/lib/broadcast-sync';
// Email functions removed - now using instant API calls instead of queue
import type { Task, TaskStatus, TaskPriority, TaskRepeatConfig } from '@/types';

interface TaskFormData {
  title: string;
  description?: string;
  allocation_mode: 'individual' | 'team';
  assigned_staff_ids?: string[];
  assigned_team_ids?: string[];
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  start_date?: string;
  is_repeated?: boolean;
  repeat_config?: TaskRepeatConfig;
  support_files?: string[];
}

export function useTasks() {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const { user } = useAuth();

  // Fetch all tasks with related data
  const { data: tasks = [], isLoading, error, refetch } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: async () => {
      // Fetch tasks with staff and team assignments, including delegation data
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select(`
          *,
          parent_task:parent_task_id(task_no, title),
          child_tasks:tasks!parent_task_id(count),
          assigned_staff:task_assignments(
            id,
            staff_id,
            assigned_at,
            staff:staff(
              id,
              name,
              email,
              role,
              department,
              branch,
              profile_image_url
            )
          ),
          assigned_teams:task_team_assignments(
            id,
            team_id,
            team:teams(
              id,
              name,
              leader_id,
              branch
            )
          ),
          delegations:task_delegations(
            id,
            from_staff_id,
            to_staff_id,
            notes,
            delegation_status,
            completed_by_delegatee_at,
            verified_by_delegator_at,
            delegatee_notes,
            created_at,
            from_staff:staff!task_delegations_from_staff_id_fkey(id, name, email, employee_id, profile_image_url),
            to_staff:staff!task_delegations_to_staff_id_fkey(id, name, email, employee_id, profile_image_url)
          ),
          last_updater:staff!last_updated_by(name, email),
          created_by_staff:staff!created_by_staff_id(id, name, email, employee_id, profile_image_url)
        `)
        .order('created_at', { ascending: false });

      // console.log('📊 Raw tasksData from Supabase:', JSON.stringify(tasksData?.slice(0, 1), null, 2));

      if (tasksError) throw tasksError;
      
      // Fetch all delegations to enrich task data
      const { data: delegations } = await supabase
        .from('task_delegations')
        .select(`
          task_id,
          from_staff_id,
          to_staff_id,
          notes,
          from_staff:staff!task_delegations_from_staff_id_fkey(id, name),
          to_staff:staff!task_delegations_to_staff_id_fkey(id, name)
        `)
        .order('created_at', { ascending: false });
      
      // Fetch all reschedules to enrich task data
      const { data: reschedules } = await supabase
        .from('task_reschedules')
        .select(`
          id,
          task_id,
          staff_id,
          reason,
          original_due_date,
          requested_new_date,
          status,
          admin_id,
          admin_response,
          responded_at,
          created_at,
          staff:staff!staff_id(id, name, email),
          admin:admins!admin_id(id, name, email)
        `)
        .order('created_at', { ascending: false });
      
      // Create a map of latest delegation per task
      const delegationMap = new Map();
      (delegations || []).forEach((del: any) => {
        if (!delegationMap.has(del.task_id)) {
          const fromStaff = Array.isArray(del.from_staff) ? del.from_staff[0] : del.from_staff;
          const toStaff = Array.isArray(del.to_staff) ? del.to_staff[0] : del.to_staff;
          
          delegationMap.set(del.task_id, {
            delegated_from_staff_id: del.from_staff_id,
            delegated_by_staff_name: fromStaff?.name || null,
            delegated_to_staff_id: del.to_staff_id,
            delegated_to_staff_name: toStaff?.name || null,
            delegation_notes: del.notes || null
          });
        }
      });
      
      // Create maps for reschedules (latest pending and latest approved per task)
      const pendingRescheduleMap = new Map();
      const approvedRescheduleMap = new Map();
      
      (reschedules || []).forEach((resc: any) => {
        const staff = Array.isArray(resc.staff) ? resc.staff[0] : resc.staff;
        const admin = Array.isArray(resc.admin) ? resc.admin[0] : resc.admin;
        
        // Debug logging for reschedule data
        // console.log('🔍 Reschedule data:', {
        //   task_id: resc.task_id,
        //   staff_id: resc.staff_id,
        //   staff_object: staff,
        //   staff_name: staff?.name,
        //   admin_object: admin,
        //   admin_name: admin?.name,
        // });
        
        const rescheduleInfo = {
          id: resc.id,
          staff_id: resc.staff_id,
          staff: staff ? { name: staff.name, email: staff.email } : null,
          reason: resc.reason,
          original_due_date: resc.original_due_date,
          requested_new_date: resc.requested_new_date,
          status: resc.status,
          admin_id: resc.admin_id,
          admin: admin ? { name: admin.name, email: admin.email } : null,
          admin_response: resc.admin_response,
          responded_at: resc.responded_at,
          created_at: resc.created_at
        };
        
        // Map pending reschedules
        if (resc.status === 'pending' && !pendingRescheduleMap.has(resc.task_id)) {
          pendingRescheduleMap.set(resc.task_id, rescheduleInfo);
        }
        
        // Map approved reschedules
        if (resc.status === 'approved' && !approvedRescheduleMap.has(resc.task_id)) {
          approvedRescheduleMap.set(resc.task_id, rescheduleInfo);
        }
      });
      
      // Map tasks with delegation info and ensure arrays are always present
      const tasksWithEnrichedData = await Promise.all((tasksData || []).map(async (task) => {
        let enrichedStaff = task.assigned_staff || [];
        
        // FALLBACK: If assigned_staff is empty but assigned_staff_ids has data, fetch directly
        if ((!enrichedStaff || enrichedStaff.length === 0) && task.assigned_staff_ids && task.assigned_staff_ids.length > 0) {
          // console.log(`🔄 Fetching staff details directly for task ${task.id} with staff IDs:`, task.assigned_staff_ids);
          
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, name, email, role, department, branch, profile_image_url')
            .in('id', task.assigned_staff_ids);
          
          // Transform to match TaskAssignment structure
          enrichedStaff = (staffData || []).map(staff => ({
            id: `fallback-${staff.id}`,
            staff_id: staff.id,
            staff: staff
          }));
          
          // console.log(`✅ Fetched ${enrichedStaff.length} staff members directly`);
        }
        
        // TEAM FALLBACK: If this is a team assignment and we have team IDs, fetch team members AND leaders
        if (task.allocation_mode === 'team' && task.assigned_team_ids && task.assigned_team_ids.length > 0) {
          // console.log(`🔄 Fetching team members and leaders for task ${task.id} with team IDs:`, task.assigned_team_ids);
          
          // Fetch team members from team_members table
          const { data: teamMembersData } = await supabase
            .from('team_members')
            .select(`
              staff_id,
              staff:staff(
                id,
                name,
                email,
                role,
                department,
                branch,
                profile_image_url
              )
            `)
            .in('team_id', task.assigned_team_ids);
          
          // Fetch team leaders from teams table
          const { data: teamLeadersData } = await supabase
            .from('teams')
            .select(`
              leader_id,
              leader:staff!leader_id(
                id,
                name,
                email,
                role,
                department,
                branch,
                profile_image_url
              )
            `)
            .in('id', task.assigned_team_ids);
          
          // Transform members to match TaskAssignment structure
          const teamMembers = (teamMembersData || []).map(member => ({
            id: `team-member-${member.staff_id}`,
            staff_id: member.staff_id,
            staff: member.staff
          }));
          
          // Transform leaders to match TaskAssignment structure
          const teamLeaders = (teamLeadersData || []).map(team => ({
            id: `team-leader-${team.leader_id}`,
            staff_id: team.leader_id,
            staff: Array.isArray(team.leader) ? team.leader[0] : team.leader
          }));
          
          // Combine members + leaders, removing duplicates by staff_id
          const allTeamStaff = [...teamMembers, ...teamLeaders];
          const uniqueTeamStaff = allTeamStaff.filter((staff, index, self) => 
            index === self.findIndex(s => s.staff_id === staff.staff_id)
          );
          
          // Combine with existing staff (if any)
          enrichedStaff = [...enrichedStaff, ...uniqueTeamStaff];
          
          // console.log(`✅ Fetched ${teamMembers.length} members + ${teamLeaders.length} leaders = ${uniqueTeamStaff.length} unique staff for ${task.assigned_team_ids.length} teams`);
        }
        
        // Process delegation chain and original assignee
        const delegations = task.delegations || [];
        const sortedDelegations = delegations.sort((a: any, b: any) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // Find original assignee - the FIRST person assigned to the task
        let original_assignee = null;
        
        if (delegations && delegations.length > 0) {
          // Sort delegations by created_at (oldest first)
          const sortedDelegations = [...delegations].sort(
            (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          
          // The original assignee is the "from_staff" of the FIRST delegation
          const firstDelegation = sortedDelegations[0];
          if (firstDelegation.from_staff) {
            original_assignee = {
              id: firstDelegation.from_staff.id,
              name: firstDelegation.from_staff.name,
              email: firstDelegation.from_staff.email,
              employee_id: firstDelegation.from_staff.employee_id,
              profile_image_url: firstDelegation.from_staff.profile_image_url
            };
          }
        } else if (enrichedStaff && enrichedStaff.length > 0) {
          // No delegations - original is the first assigned staff from task_assignments
          const firstAssigned = [...enrichedStaff].sort(
            (a: any, b: any) => new Date(a.assigned_at || 0).getTime() - new Date(b.assigned_at || 0).getTime()
          )[0];
          if (firstAssigned.staff) {
            original_assignee = {
              id: firstAssigned.staff.id,
              name: firstAssigned.staff.name,
              email: firstAssigned.staff.email,
              employee_id: firstAssigned.staff.employee_id,
              profile_image_url: firstAssigned.staff.profile_image_url
            };
          }
        }
        
        // Build delegation chain
        const delegationChain = sortedDelegations.map((d: any) => ({
          from: d.from_staff?.name || 'Unknown',
          to: d.to_staff?.name || 'Unknown',
          from_image: d.from_staff?.profile_image_url || null,
          to_image: d.to_staff?.profile_image_url || null,
          reason: d.notes,
          timestamp: d.created_at
        }));

        // Debug logging to verify delegation data
        // console.log('🔍 Task delegation data:', {
        //   task_id: task.id,
        //   task_no: task.task_no,
        //   has_delegations: delegations && delegations.length > 0,
        //   delegation_count: delegations?.length || 0,
        //   first_delegation_from: delegations?.[0]?.from_staff?.name,
        //   first_delegation_to: delegations?.[0]?.to_staff?.name,
        //   original_assignee: original_assignee?.name,
        //   delegation_chain: delegationChain
        // });

        return {
          ...task,
          assigned_staff: enrichedStaff,
          assigned_teams: task.assigned_teams || [],
          // NEW: Delegation tracking fields
          original_assignee: original_assignee,
          delegation_count: sortedDelegations.length,
          delegation_chain: delegationChain,
          has_delegations: sortedDelegations.length > 0,
          // Legacy delegation fields (keep for backward compatibility)
          delegated_from_staff_id: delegationMap.get(task.id)?.delegated_from_staff_id || null,
          delegated_by_staff_name: delegationMap.get(task.id)?.delegated_by_staff_name || null,
          delegated_to_staff_id: delegationMap.get(task.id)?.delegated_to_staff_id || null,
          delegated_to_staff_name: delegationMap.get(task.id)?.delegated_to_staff_name || null,
          delegation_notes: delegationMap.get(task.id)?.delegation_notes || null,
          // Add reschedule information
          pending_reschedule: pendingRescheduleMap.get(task.id) || null,
          latest_approved_reschedule: approvedRescheduleMap.get(task.id) || null,
          has_pending_reschedule: pendingRescheduleMap.has(task.id),
          has_approved_reschedule: approvedRescheduleMap.has(task.id)
        };
      }));
      
      return tasksWithEnrichedData;
    },
    staleTime: 0, // Instant updates - no stale time
    refetchOnWindowFocus: false, // Disable - we have real-time
  });

  // Instant invalidation function
  const invalidateTasks = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    broadcastDataUpdate('tasks-updated');
  };

  // Listen for cross-tab sync via Broadcast Channel
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((message) => {
      if (message.type === 'tasks-updated') {
        // console.log('🔄 Cross-tab sync: tasks updated');
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    });
    
    return unsubscribe;
  }, [queryClient]);

  // Real-time subscription with debouncing
  useEffect(() => {
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          // console.log('📡 Tasks table changed:', payload);
          invalidateTasks(); // Use instant invalidation
          
          // Trigger real-time notification events for instant UI updates
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            window.dispatchEvent(new CustomEvent('taskUpdated', { 
              detail: { 
                taskId: (payload.new as any)?.id || (payload.old as any)?.id,
                eventType: payload.eventType,
                newData: payload.new,
                oldData: payload.old
              } 
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_assignments' },
        (payload) => {
          // console.log('📡 Task assignments changed:', payload);
          // console.log('🔄 Triggering tasks refetch due to task_assignments change');
          invalidateTasks(); // Use instant invalidation
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_delegations' },
        (payload) => {
          // console.log('📡 Task delegations changed:', payload);
          invalidateTasks(); // Use instant invalidation
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_team_assignments' },
        (payload) => {
          // console.log('📡 Task team assignments changed:', payload);
          invalidateTasks(); // Use instant invalidation
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_members' },
        (payload) => {
          // console.log('📡 Team members changed:', payload);
          invalidateTasks(); // Use instant invalidation
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_reschedules' },
        (payload) => {
          // console.log('📡 Task reschedules changed:', payload);
          invalidateTasks(); // Use instant invalidation
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // console.log('✅ Realtime connected: tasks');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Realtime error: tasks');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, invalidateTasks]);

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: async (formData: TaskFormData) => {
      // Check if this is multiple individual assignments (needs cloning)
      const isMultipleIndividuals = 
        formData.allocation_mode === 'individual' && 
        formData.assigned_staff_ids && 
        formData.assigned_staff_ids.length > 1;

      // Check if this is multiple team assignments (needs cloning)
      const isMultipleTeams = 
        formData.allocation_mode === 'team' && 
        formData.assigned_team_ids && 
        formData.assigned_team_ids.length > 1;

      if (isMultipleIndividuals) {
        // console.log('🔄 Creating cloned tasks for multiple individual assignments');
        
        // Create cloned tasks for each staff member
        const createdTasks = [];
        let parentTaskId = null; // Track parent task ID
        let baseTaskNo = null; // Will be set after first task is created
        
        for (let i = 0; i < (formData.assigned_staff_ids || []).length; i++) {
          const staffId = formData.assigned_staff_ids![i];
          
          // console.log(`🔄 Creating task for staff ${staffId}`);
          
          const taskData: any = {
            title: formData.title,
            description: formData.description,
            allocation_mode: 'individual', // Each clone is individual
            assigned_staff_ids: [staffId], // Only one staff per clone
            assigned_team_ids: [], // No teams for individual clones
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date,
            start_date: formData.start_date,
            is_repeated: formData.is_repeated || false,
            repeat_config: formData.repeat_config,
            support_files: formData.support_files || [],
            task_no: null, // Let database generate the base task_no
            parent_task_id: parentTaskId, // First task is parent (null), others reference it
            created_by_staff_id: user?.staffId || null, // Set if staff user created the task
          };
          
          const { data: task, error: taskError } = await supabase
            .from('tasks')
            .insert(taskData)
            .select()
            .single();
          
          if (taskError) {
            console.error(`❌ Failed to create task:`, taskError);
            throw taskError;
          }
          
          // Set base task number and parent task ID after first task is created
          if (i === 0) {
            baseTaskNo = task.task_no;
            parentTaskId = task.id;
            // console.log(`✅ Set parent task ID: ${parentTaskId} for base task ${baseTaskNo}`);
          } else {
            // Update task_no with suffix for cloned tasks
            const taskNoWithSuffix = `${baseTaskNo}.${i}`;
            const { error: updateError } = await supabase
              .from('tasks')
              .update({ task_no: taskNoWithSuffix })
              .eq('id', task.id);
            
            if (updateError) {
              console.error(`❌ Failed to update task_no suffix:`, updateError);
            } else {
              task.task_no = taskNoWithSuffix;
              // console.log(`✅ Updated task_no to ${taskNoWithSuffix}`);
            }
          }
          
          createdTasks.push(task);
          
          // Create task_assignment record
          const { error: assignmentError } = await supabase
            .from('task_assignments')
            .insert({
              task_id: task.id,
              staff_id: staffId,
            });
          
          if (assignmentError) {
            console.error(`❌ Failed to create assignment for ${task.task_no}:`, assignmentError);
            // Don't throw - task is created, just log error
          } else {
            // console.log(`✅ Task ${task.task_no} created successfully for staff ${staffId}`);
            
            // Insert notification for this staff member
            const { data: staffDetails } = await supabase
              .from('staff')
              .select('name, email')
              .eq('id', staffId)
              .single();

            await supabase
              .from('notifications')
              .insert({
                user_id: staffId,
                type: 'task_assignment',
                title: 'New Task Assigned',
                message: `New task assigned: ${formData.title}`,
                reference_id: task.id,
                reference_table: 'tasks',
                is_viewed: false,
                metadata: {
                  task_no: task.task_no,
                  priority: formData.priority,
                  due_date: formData.due_date,
                  assigned_by: user?.email
                }
              });

            // Send instant email for this staff member (OLD working system)
            if (staffDetails?.email) {
              fetch('/api/email/send-task-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  taskId: task.id,
                  staffEmail: staffDetails.email,
                  staffName: staffDetails.name,
                  type: 'assignment'
                })
              }).catch(err => console.error('Email send failed:', err));
            }
          }
        }
        
        // console.log(`✅ Created ${createdTasks.length} cloned tasks: ${createdTasks.map(t => t.task_no).join(', ')}`);
        return createdTasks;
      } else if (isMultipleTeams) {
        // console.log('🔄 Creating cloned tasks for multiple team assignments');
        
        const createdTasks = [];
        let parentTaskId = null;
        let baseTaskNo = null;
        
        for (let i = 0; i < (formData.assigned_team_ids || []).length; i++) {
          const teamId = formData.assigned_team_ids![i];
          
          // console.log(`🔄 Creating task for team ${teamId}`);
          
          const taskData: any = {
            title: formData.title,
            description: formData.description,
            allocation_mode: 'team',
            assigned_staff_ids: [],
            assigned_team_ids: [teamId],
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date,
            start_date: formData.start_date,
            is_repeated: formData.is_repeated || false,
            repeat_config: formData.repeat_config,
            support_files: formData.support_files || [],
            task_no: null,
            parent_task_id: parentTaskId,
            created_by_staff_id: user?.staffId || null, // Set if staff user created the task
          };
          
          const { data: task, error: taskError } = await supabase
            .from('tasks')
            .insert(taskData)
            .select()
            .single();
          
          if (taskError) {
            console.error(`❌ Failed to create task:`, taskError);
            throw taskError;
          }
          
          // Set base task number and parent task ID after first task
          if (i === 0) {
            baseTaskNo = task.task_no;
            parentTaskId = task.id;
            // console.log(`✅ Set parent task ID: ${parentTaskId} for base task ${baseTaskNo}`);
          } else {
            // Update task_no with suffix for cloned tasks
            const taskNoWithSuffix = `${baseTaskNo}.${i}`;
            const { error: updateError } = await supabase
              .from('tasks')
              .update({ task_no: taskNoWithSuffix })
              .eq('id', task.id);
            
            if (updateError) {
              console.error(`❌ Failed to update task_no suffix:`, updateError);
            } else {
              task.task_no = taskNoWithSuffix;
              // console.log(`✅ Updated task_no to ${taskNoWithSuffix}`);
            }
          }
          
          createdTasks.push(task);
          
          // Create task_team_assignments record
          const { error: teamAssignmentError } = await supabase
            .from('task_team_assignments')
            .insert({
              task_id: task.id,
              team_id: teamId,
            });
          
          if (teamAssignmentError) {
            console.error(`❌ Failed to create team assignment:`, teamAssignmentError);
          } else {
            // console.log(`✅ Team assignment created for ${task.task_no}`);
            
            // Fetch team members
            const { data: teamMembers } = await supabase
              .from('team_members')
              .select('staff_id, staff:staff(name, email)')
              .eq('team_id', teamId);
            
            if (teamMembers && teamMembers.length > 0) {
              const memberIds = teamMembers.map(m => m.staff_id);
              
              // Update task with assigned_staff_ids
              await supabase
                .from('tasks')
                .update({ assigned_staff_ids: memberIds })
                .eq('id', task.id);
              
              // Create task_assignments for members
              const assignments = memberIds.map(staffId => ({
                task_id: task.id,
                staff_id: staffId,
              }));
              
              await supabase
                .from('task_assignments')
                .insert(assignments);
              
              // Insert notifications and send emails
              for (const member of teamMembers) {
                // Get staff details for this member
                const { data: staffDetails } = await supabase
                  .from('staff')
                  .select('name, email')
                  .eq('id', member.staff_id)
                  .single();

                await supabase
                  .from('notifications')
                  .insert({
                    user_id: member.staff_id,
                    type: 'task_assignment',
                    title: 'New Team Task Assigned',
                    message: `New team task assigned: ${formData.title}`,
                    reference_id: task.id,
                    reference_table: 'tasks',
                    is_viewed: false,
                    metadata: {
                      task_no: task.task_no,
                      priority: formData.priority,
                      due_date: formData.due_date,
                      team_id: teamId,
                      assigned_by: user?.email
                    }
                  });
                
                // Send instant email
                if (staffDetails?.email) {
                  fetch('/api/email/send-task-notification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      taskId: task.id,
                      staffEmail: staffDetails.email,
                      staffName: staffDetails.name,
                      type: 'assignment'
                    })
                  }).catch(err => console.error('Email send failed:', err));
                }
              }
            }
          }
        }
        
        // console.log(`✅ Created ${createdTasks.length} cloned team tasks: ${createdTasks.map(t => t.task_no).join(', ')}`);
        return createdTasks;
      } else {
        // Original logic for single individual or team tasks
        // console.log('🔄 Creating single task (not cloning)');
        
        // Insert task and let database generate task_no automatically
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            title: formData.title,
            description: formData.description,
            allocation_mode: formData.allocation_mode,
            assigned_staff_ids: formData.assigned_staff_ids || [],
            assigned_team_ids: formData.assigned_team_ids || [],
            status: formData.status,
            priority: formData.priority,
            due_date: formData.due_date,
            start_date: formData.start_date,
            is_repeated: formData.is_repeated || false,
            repeat_config: formData.repeat_config,
            support_files: formData.support_files || [],
            task_no: null, // Let database generate the task_no
            parent_task_id: null, // Single tasks have no parent
            created_by_staff_id: user?.staffId || null, // Set if staff user created the task
          })
          .select()
          .single();

        if (error) throw error;

        // 4. IMMEDIATELY create task_assignments (for individual tasks)
        if (formData.allocation_mode === 'individual' && formData.assigned_staff_ids && formData.assigned_staff_ids.length > 0) {
          // console.log('🔄 Creating individual task assignments immediately');
          const assignments = formData.assigned_staff_ids.map((staffId: string) => ({
            task_id: data.id,
            staff_id: staffId,
          }));

          const { error: assignmentError } = await supabase
            .from('task_assignments')
            .insert(assignments);

          if (assignmentError) {
            console.error('❌ Failed to create individual assignments:', assignmentError);
            // Don't throw - task is created, just log error
          } else {
            // console.log('✅ Individual task assignments created successfully');
            
            // Insert notifications for all assigned staff
            for (const staffId of formData.assigned_staff_ids || []) {
              await supabase
                .from('notifications')
                .insert({
                  user_id: staffId,
                  type: 'task_assignment',
                  title: 'New Task Assigned',
                  message: `New task assigned: ${formData.title}`,
                  reference_id: data.id,
                  reference_table: 'tasks',
                  is_viewed: false,
                metadata: {
                  task_no: data.task_no,
                  priority: formData.priority,
                  due_date: formData.due_date,
                  assigned_by: user?.email
                }
                });
            }

            // Send instant emails for all assigned staff (OLD working system)
            for (const staffId of formData.assigned_staff_ids || []) {
              const { data: staffMember } = await supabase
                .from('staff')
                .select('email, name')
                .eq('id', staffId)
                .single();

              if (staffMember?.email) {
                // Use instant API call instead of queue
                fetch('/api/email/send-task-notification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    taskId: data.id,
                    staffEmail: staffMember.email,
                    staffName: staffMember.name,
                    type: 'assignment'
                  })
                }).catch(err => console.error('Email send failed:', err));
              }
            }
          }
        }

        // 5. IMMEDIATELY create team assignments (for team tasks)
        if (formData.allocation_mode === 'team' && formData.assigned_team_ids && formData.assigned_team_ids.length > 0) {
        // console.log('🔄 Creating team task assignments immediately');
        
        // Create task_team_assignments
        const teamAssignments = formData.assigned_team_ids.map((teamId: string) => ({
          task_id: data.id,
          team_id: teamId,
        }));

        const { error: teamAssignmentError } = await supabase
          .from('task_team_assignments')
          .insert(teamAssignments);

        if (teamAssignmentError) {
          console.error('❌ Failed to create team assignments:', teamAssignmentError);
        } else {
          // console.log('✅ Team assignments created successfully');
        }

        // Fetch team members and create task_assignments
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('staff_id')
          .in('team_id', formData.assigned_team_ids);

        if (teamMembers && teamMembers.length > 0) {
          const memberIds = teamMembers.map(m => m.staff_id);
          // console.log('✅ Found team members:', memberIds);
          
          // Update task with assigned_staff_ids
          const { error: updateError } = await supabase
            .from('tasks')
            .update({ assigned_staff_ids: memberIds })
            .eq('id', data.id);
          
          if (updateError) {
            console.error('❌ Failed to update assigned_staff_ids:', updateError);
          } else {
            // console.log('✅ Updated task with assigned_staff_ids');
          }

          // Create task_assignments for members
          const assignments = memberIds.map(staffId => ({
            task_id: data.id,
            staff_id: staffId,
          }));

          const { error: memberAssignmentError } = await supabase
            .from('task_assignments')
            .insert(assignments);

          if (memberAssignmentError) {
            console.error('❌ Failed to create member assignments:', memberAssignmentError);
          } else {
            // console.log('✅ Member task assignments created successfully');
            
            // Insert notifications for all team members
            for (const staffId of memberIds) {
              await supabase
                .from('notifications')
                .insert({
                  user_id: staffId,
                  type: 'task_assignment',
                  title: 'New Team Task Assigned',
                  message: `New team task assigned: ${formData.title}`,
                  reference_id: data.id,
                  reference_table: 'tasks',
                  is_viewed: false,
                  metadata: {
                    task_no: data.task_no,
                    priority: formData.priority,
                    due_date: formData.due_date,
                    team_id: formData.assigned_team_ids,
                    assigned_by: user?.email
                  }
                });
            }

            // Send instant emails for all team members (OLD working system)
            for (const staffId of memberIds) {
              const { data: member } = await supabase
                .from('staff')
                .select('email, name')
                .eq('id', staffId)
                .single();

              if (member?.email) {
                // Use instant API call instead of queue
                fetch('/api/email/send-task-notification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    taskId: data.id,
                    staffEmail: member.email,
                    staffName: member.name,
                    type: 'assignment'
                  })
                }).catch(err => console.error('Email send failed:', err));
              }
            }
          }
        } else {
          console.warn('⚠️ No team members found for teams:', formData.assigned_team_ids);
        }
      }

        return data;
      }
    },
    onMutate: async (newTask) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot previous value
      const previousTasks = queryClient.getQueryData<Task[]>(['tasks']);

      // Optimistically update
      if (previousTasks) {
        queryClient.setQueryData<Task[]>(['tasks'], [
          {
            id: 'temp-' + Date.now(),
            ...newTask,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Task,
          ...previousTasks,
        ]);
      }

      return { previousTasks };
    },
    onSuccess: async (result) => {
      // ✅ IMMEDIATE invalidation (like status update) - MUST be first!
      // console.log('🔄 IMMEDIATE invalidation on task creation success');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      
      // Handle both single task and array of tasks (cloned)
      const tasks = Array.isArray(result) ? result : [result];
      const taskIds = tasks.map(t => t.id);
      
      window.dispatchEvent(new CustomEvent('dataUpdated', { 
        detail: { type: 'task-created', taskIds } 
      }));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
      
      if (tasks.length === 1) {
        toast.success('Task created successfully!');
      } else {
        toast.success(`${tasks.length} tasks created successfully! (${tasks.map(t => t.task_no).join(', ')})`);
      }
      
      // Send email notifications using email helper
      try {
        // Process each task for email notifications
        for (const task of tasks) {
          if (task.allocation_mode === 'team' && task.assigned_team_ids?.length > 0) {
          // Get team leaders and members for email notifications
          const { data: teamData } = await supabase
            .from('teams')
            .select(`
              id,
              name,
              leader_id,
              staff!teams_leader_id_fkey(email, name)
            `)
            .in('id', task.assigned_team_ids);

          if (teamData) {
            for (const team of teamData as any) {
              // Email team leader (instant)
              if (team.staff?.email) {
                fetch('/api/email/send-task-notification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    taskId: task.id,
                    staffEmail: team.staff.email,
                    staffName: team.staff.name,
                    type: 'assignment'
                  })
                }).catch(err => console.error('Email send failed:', err));
              }

              // Email all team members
              const { data: members } = await supabase
                .from('team_members')
                .select(`
                  staff_id,
                  staff!team_members_staff_id_fkey(email, name)
                `)
                .eq('team_id', team.id);

              if (members) {
                for (const member of members as any) {
                  if (member.staff?.email) {
                    fetch('/api/email/send-task-notification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        taskId: task.id,
                        staffEmail: member.staff.email,
                        staffName: member.staff.name,
                        type: 'assignment'
                      })
                    }).catch(err => console.error('Email send failed:', err));
                  }
                }
              }
            }
          }
        } else if (task.allocation_mode === 'individual' && task.assigned_staff_ids?.length > 0) {
          // Send email notifications to assigned staff
          const { data: staffData } = await supabase
            .from('staff')
            .select('email, name')
            .in('id', task.assigned_staff_ids);

          if (staffData) {
            for (const staff of staffData) {
              if (staff.email) {
                fetch('/api/email/send-task-notification', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    taskId: task.id,
                    staffEmail: staff.email,
                    staffName: staff.name,
                    type: 'assignment'
                  })
                }).catch(err => console.error('Email send failed:', err));
              }
            }
          }
        }
        }
      } catch (emailError) {
        console.error('❌ Email notification error:', emailError);
      }
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast.error('Failed to create task: ' + (error as Error).message);
    },
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      // Get current user to track who made the update
      const currentUser = getCurrentUser();
      
      // Only set last_updated_by if user is staff (has staffId)
      // Admin users don't have staffId, so we skip tracking for them
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      }
      
      if (currentUser?.staffId) {
        updateData.last_updated_by = currentUser.staffId;
      }
      
      // Check if this is a delegated task completion
      if (updates.status === 'completed' && currentUser?.staffId) {
        // Check if current user is a delegatee (to_staff_id) in any delegation
        const { data: delegations } = await supabase
          .from('task_delegations')
          .select('*')
          .eq('task_id', id)
          .eq('to_staff_id', currentUser.staffId)
          .eq('delegation_status', 'active');

        if (delegations && delegations.length > 0) {
          // This is a delegated task completion - update delegation record instead of main task
          const delegation = delegations[0];
          
          // Update delegation record
          const { error: delegationError } = await supabase
            .from('task_delegations')
            .update({
              delegation_status: 'completed',
              completed_by_delegatee_at: new Date().toISOString(),
              delegatee_notes: updates.delegatee_notes || null
            })
            .eq('id', delegation.id);

          if (delegationError) {
            console.error('❌ Failed to update delegation:', delegationError);
            throw delegationError;
          }

          // Send notification to delegator (from_staff_id)
          await supabase
            .from('notifications')
            .insert({
              user_id: delegation.from_staff_id,
              type: 'delegation_completed',
              title: 'Delegated Task Completed',
              message: `Task "${updates.title || 'Unknown'}" has been completed by delegatee and requires your verification`,
              reference_id: id,
              reference_table: 'tasks',
              is_viewed: false,
              metadata: {
                task_no: updates.task_no,
                delegatee_id: currentUser.staffId,
                delegation_id: delegation.id
              }
            });

          // Send email notification
          const { data: delegatorData } = await supabase
            .from('staff')
            .select('name, email')
            .eq('id', delegation.from_staff_id)
            .single();

          if (delegatorData?.email) {
            fetch('/api/email/send-delegation-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'delegation_completed',
                delegatorEmail: delegatorData.email,
                delegatorName: delegatorData.name,
                delegateeName: currentUser.name || 'Unknown',
                taskTitle: updates.title || 'Unknown Task',
                taskNo: updates.task_no || 'Unknown'
              })
            }).catch(err => console.error('Delegation email send failed:', err));
          }

          // Return early - don't update main task status
          return { id, ...updates };
        }
      }

      // CRITICAL: Sync task_assignments table when assigned_staff_ids changes
      if (updates.assigned_staff_ids) {
        // console.log('🔄 Syncing task_assignments for task:', id, 'with new staff IDs:', updates.assigned_staff_ids);
        
        // 1. Delete all existing task_assignments for this task
        const { error: deleteError } = await supabase
          .from('task_assignments')
          .delete()
          .eq('task_id', id);
        
        if (deleteError) {
          console.error('❌ Failed to delete old task_assignments:', deleteError);
          throw deleteError;
        }
        
        // 2. Insert new task_assignments
        const newAssignments = updates.assigned_staff_ids.map((staffId: string) => ({
          task_id: id,
          staff_id: staffId,
        }));
        
        const { error: insertError } = await supabase
          .from('task_assignments')
          .insert(newAssignments);
        
        if (insertError) {
          console.error('❌ Failed to insert new task_assignments:', insertError);
          throw insertError;
        }
        
        // console.log('✅ Successfully synced task_assignments for task:', id);
      }
      
      // Update the task itself
      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Failed to update task:', error);
        throw error;
      }
      
      // Notify all assigned staff about the update
      const { data: taskWithAssignments } = await supabase
        .from('tasks')
        .select('*, assigned_staff:task_assignments(staff_id)')
        .eq('id', id)
        .single();

      if (taskWithAssignments) {
        for (const assignment of taskWithAssignments.assigned_staff || []) {
          await supabase
            .from('notifications')
            .insert({
              user_id: assignment.staff_id,
              type: 'task_update',
              title: 'Task Updated',
              message: `Task "${data.title}" has been updated`,
              reference_id: id,
              reference_table: 'tasks',
              is_viewed: false,
              metadata: {
                task_no: data.task_no,
                updated_fields: Object.keys(updates),
                updated_by: user?.email
              }
            });
        }
      }

      // Notify admin when staff updates task status
      if (updates.status && user?.role !== 'admin') {
        const { data: admins } = await supabase
          .from('staff')
          .select('id')
          .eq('role', 'admin');

        for (const admin of admins || []) {
          await supabase
            .from('notifications')
            .insert({
              user_id: admin.id,
              type: 'task_status_update',
              title: 'Task Status Updated',
              message: `${user?.name} updated task "${data.title}" to ${updates.status}`,
              reference_id: id,
              reference_table: 'tasks',
              is_viewed: false,
              metadata: {
                task_no: data.task_no,
                old_status: data.status,
                new_status: updates.status,
                updated_by: user?.name
              }
            });
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Send email notifications for status changes
      if (data.status) {
        // Get task details for email
        const task = data;
        
        // Send email to assigned staff about status change
        if (task.assigned_staff_ids && task.assigned_staff_ids.length > 0) {
          // Fetch staff details for email
          supabase
            .from('staff')
            .select('email, name')
            .in('id', task.assigned_staff_ids)
            .then(({ data: staffData }) => {
              if (staffData) {
                staffData.forEach((staff) => {
                  if (staff.email) {
                    fetch('/api/email/send-task-notification', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        taskId: task.id,
                        staffEmail: staff.email,
                        staffName: staff.name,
                        type: 'status_change',
                        newStatus: task.status
                      })
                    }).catch(err => console.error('Email send failed:', err));
                  }
                });
              }
            });
        }
      }
      
      // Invalidate queries to refresh UI with updated data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      
      // Trigger cross-tab sync
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error, _, context: any) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      toast.error('Failed to update task: ' + (error as Error).message);
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Check if this task has children (is a parent)
      const { data: children } = await supabase
        .from('tasks')
        .select('id, task_no')
        .eq('parent_task_id', id);
      
      if (children && children.length > 0) {
        // Show confirmation dialog
        const childTaskNumbers = children.map(c => c.task_no).join(', ');
        const confirmed = confirm(
          `This task has ${children.length} linked task(s): ${childTaskNumbers}.\n\n` +
          `Deleting this task will also delete all linked tasks.\n\n` +
          `Do you want to continue?`
        );
        
        if (!confirmed) {
          throw new Error('Delete cancelled');
        }
        
        // Delete children first
        const { error: childError } = await supabase
          .from('tasks')
          .delete()
          .eq('parent_task_id', id);
        
        if (childError) throw childError;
      }
      
      // Check if this task is a child (has parent)
      const { data: task } = await supabase
        .from('tasks')
        .select('parent_task_id, task_no')
        .eq('id', id)
        .single();
      
      if (task?.parent_task_id) {
        // Show info toast
        toast.info(
          `This is a linked task (${task.task_no}). Only this copy will be deleted.`
        );
      }
      
      // Delete the task
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Failed to delete task:', error);
        throw error;
      }
      
      return id;
    },
    onSuccess: (id) => {
      toast.success('Task deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      window.dispatchEvent(new CustomEvent('dataUpdated'));
      localStorage.setItem('data-sync-trigger', Date.now().toString());
    },
    onError: (error, _, context: any) => {
      if (error.message === 'Delete cancelled') {
        toast.info('Delete operation cancelled');
      } else {
        if (context?.previousTasks) {
          queryClient.setQueryData(['tasks'], context.previousTasks);
        }
        toast.error('Failed to delete task: ' + (error as Error).message);
      }
    },
  });

  // Verify delegation mutation
  const verifyDelegationMutation = useMutation({
    mutationFn: async ({ taskId, delegationId, action, notes }: { 
      taskId: string; 
      delegationId: string; 
      action: 'approve' | 'reject';
      notes?: string;
    }) => {
      const currentUser = getCurrentUser();
      
      if (action === 'approve') {
        // Update delegation as verified
        const { error: delegationError } = await supabase
          .from('task_delegations')
          .update({
            delegation_status: 'verified',
            verified_by_delegator_at: new Date().toISOString()
          })
          .eq('id', delegationId);

        if (delegationError) {
          console.error('❌ Failed to verify delegation:', delegationError);
          throw delegationError;
        }

        // Update main task status to completed
        const { error: taskError } = await supabase
          .from('tasks')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString(),
            last_updated_by: currentUser?.staffId
          })
          .eq('id', taskId);

        if (taskError) {
          console.error('❌ Failed to complete task:', taskError);
          throw taskError;
        }

        // Get delegation details for notifications
        const { data: delegation } = await supabase
          .from('task_delegations')
          .select(`
            *,
            from_staff:staff!task_delegations_from_staff_id_fkey(name, email),
            to_staff:staff!task_delegations_to_staff_id_fkey(name, email)
          `)
          .eq('id', delegationId)
          .single();

        if (delegation) {
          // Notify delegatee
          await supabase
            .from('notifications')
            .insert({
              user_id: delegation.to_staff_id,
              type: 'delegation_verified',
              title: 'Task Verification Approved',
              message: `Your completed task has been verified and approved`,
              reference_id: taskId,
              reference_table: 'tasks',
              is_viewed: false
            });

          // Notify admin
          const { data: admins } = await supabase
            .from('staff')
            .select('id')
            .eq('role', 'admin');

          for (const admin of admins || []) {
            await supabase
              .from('notifications')
              .insert({
                user_id: admin.id,
                type: 'delegation_verified',
                title: 'Delegated Task Completed',
                message: `Task has been completed and verified through delegation`,
                reference_id: taskId,
                reference_table: 'tasks',
                is_viewed: false
              });
          }

          // Send emails
          if (delegation.to_staff?.email) {
            fetch('/api/email/send-delegation-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'delegation_verified',
                delegateeEmail: delegation.to_staff.email,
                delegateeName: delegation.to_staff.name,
                delegatorName: delegation.from_staff?.name || 'Unknown',
                taskTitle: 'Task',
                taskNo: 'Unknown'
              })
            }).catch(err => console.error('Delegation verification email send failed:', err));
          }
        }

        toast.success('Task verification approved and completed');
      } else {
        // Reject delegation - return task to in_progress
        const { error: delegationError } = await supabase
          .from('task_delegations')
          .update({
            delegation_status: 'active',
            completed_by_delegatee_at: null,
            delegatee_notes: null
          })
          .eq('id', delegationId);

        if (delegationError) {
          console.error('❌ Failed to reject delegation:', delegationError);
          throw delegationError;
        }

        // Update main task status back to in_progress
        const { error: taskError } = await supabase
          .from('tasks')
          .update({
            status: 'in_progress',
            updated_at: new Date().toISOString(),
            last_updated_by: currentUser?.staffId
          })
          .eq('id', taskId);

        if (taskError) {
          console.error('❌ Failed to update task status:', taskError);
          throw taskError;
        }

        // Notify delegatee about rejection
        const { data: delegation } = await supabase
          .from('task_delegations')
          .select(`
            *,
            from_staff:staff!task_delegations_from_staff_id_fkey(name, email),
            to_staff:staff!task_delegations_to_staff_id_fkey(name, email)
          `)
          .eq('id', delegationId)
          .single();

        if (delegation) {
          await supabase
            .from('notifications')
            .insert({
              user_id: delegation.to_staff_id,
              type: 'delegation_rejected',
              title: 'Task Verification Rejected',
              message: `Your task completion was rejected. Please review and resubmit.`,
              reference_id: taskId,
              reference_table: 'tasks',
              is_viewed: false
            });

          // Send rejection email
          if (delegation.to_staff?.email) {
            fetch('/api/email/send-delegation-notification', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'delegation_rejected',
                delegateeEmail: delegation.to_staff.email,
                delegateeName: delegation.to_staff.name,
                delegatorName: delegation.from_staff?.name || 'Unknown',
                taskTitle: 'Task',
                taskNo: 'Unknown',
                rejectionReason: notes
              })
            }).catch(err => console.error('Delegation rejection email send failed:', err));
          }
        }

        toast.success('Task verification rejected - returned to delegatee');
      }

      // Invalidate tasks query to refresh data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error) => {
      toast.error('Failed to verify delegation: ' + (error as Error).message);
    },
  });

  return {
    tasks,
    isLoading,
    error,
    createTask: createMutation.mutate,
    updateTask: updateMutation.mutate,
    deleteTask: deleteMutation.mutate,
    verifyDelegation: verifyDelegationMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isVerifying: verifyDelegationMutation.isPending,
  };
}
