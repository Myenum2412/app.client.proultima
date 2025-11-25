"use server";

import { createClient } from "@/lib/supabase/server";
import bcrypt from "bcrypt";

export async function getSystemOptions(email: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('admins')
    .select('roles, departments, branches, expense_categories')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error fetching system options:', error);
    return { success: false, error: error.message };
  }

  return {
    success: true,
    data: {
      roles: data?.roles || [],
      departments: data?.departments || [],
      branches: data?.branches || [],
      expense_categories: data?.expense_categories || [],
    },
  };
}

export async function addSystemOption(
  email: string,
  type: 'roles' | 'departments' | 'branches' | 'expense_categories',
  value: string
) {
  const supabase = await createClient();

  // Trim and validate
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return { success: false, error: 'Value cannot be empty' };
  }

  // Get current options
  const { data: currentData, error: fetchError } = await supabase
    .from('admins')
    .select(type)
    .eq('email', email)
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  const currentOptions = (currentData as Record<string, string[]>)?.[type] || [];

  // Check for duplicates (case-insensitive)
  const exists = currentOptions.some(
    (option: string) => option.toLowerCase() === trimmedValue.toLowerCase()
  );

  if (exists) {
    return { success: false, error: 'This option already exists' };
  }

  // Add new option
  const updatedOptions = [...currentOptions, trimmedValue];

  const { error: updateError } = await supabase
    .from('admins')
    .update({ [type]: updatedOptions })
    .eq('email', email);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, data: updatedOptions };
}

export async function removeSystemOption(
  email: string,
  type: 'roles' | 'departments' | 'branches' | 'expense_categories',
  value: string
) {
  const supabase = await createClient();

  // Check if option is in use (only for roles, departments, branches)
  if (type !== 'expense_categories') {
    const columnName = type === 'roles' ? 'role' : type === 'departments' ? 'department' : 'branch';
    const { data: staffUsingOption, error: checkError } = await supabase
      .from('staff')
      .select('id')
      .eq(columnName, value)
      .limit(1);

    if (checkError) {
      return { success: false, error: checkError.message };
    }

    if (staffUsingOption && staffUsingOption.length > 0) {
      return {
        success: false,
        error: `Cannot delete: This ${type.slice(0, -1)} is currently assigned to staff members`,
      };
    }
  }

  // Get current options
  const { data: currentData, error: fetchError } = await supabase
    .from('admins')
    .select(type)
    .eq('email', email)
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  const currentOptions = (currentData as Record<string, string[]>)?.[type] || [];
  const updatedOptions = currentOptions.filter((option: string) => option !== value);

  const { error: updateError } = await supabase
    .from('admins')
    .update({ [type]: updatedOptions })
    .eq('email', email);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true, data: updatedOptions };
}

export async function updateAdminProfile(adminEmail: string, data: { name?: string; email?: string }) {
  const supabase = await createClient();

  const updateData: { name?: string; email?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (data.name) updateData.name = data.name.trim();
  if (data.email) updateData.email = data.email.trim().toLowerCase();

  const { error } = await supabase
    .from('admins')
    .update(updateData)
    .eq('email', adminEmail);

  if (error) {
    return { success: false, error: error.message };
  }

  // Update localStorage and trigger UI refresh
  if (typeof window !== 'undefined') {
    const { getCurrentUser, saveUser } = await import('@/lib/auth');
    const currentUser = getCurrentUser();
    if (currentUser) {
      if (data.name) currentUser.name = data.name;
      if (data.email) currentUser.email = data.email;
      saveUser(currentUser);
    }
    
    // Dispatch custom event for UI components to refresh
    window.dispatchEvent(new CustomEvent('adminProfileUpdated', { 
      detail: { updatedUser: currentUser } 
    }));
  }

  return { success: true };
}

export async function updateAdminPassword(adminEmail: string, data: {
  currentPassword: string;
  newPassword: string;
}) {
  const supabase = await createClient();

  // Get current admin data
  const { data: adminData, error: fetchError } = await supabase
    .from('admins')
    .select('password_hash')
    .eq('email', adminEmail)
    .single();

  if (fetchError) {
    return { success: false, error: fetchError.message };
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(
    data.currentPassword,
    adminData.password_hash
  );

  if (!isValidPassword) {
    return { success: false, error: 'Current password is incorrect' };
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

  // Update password
  const { error: updateError } = await supabase
    .from('admins')
    .update({
      password_hash: newPasswordHash,
      updated_at: new Date().toISOString(),
    })
    .eq('email', adminEmail);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  return { success: true };
}

export async function getAdminProfile(email: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('admins')
    .select('id, name, email, created_at')
    .eq('email', email)
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, data };
}

// Task Priority Management Functions
export async function getTaskPriorities() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('task_priority_options')
    .select('*')
    .order('display_order', { ascending: true });
  
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function addTaskPriority(name: string, color: string, displayOrder?: number) {
  const supabase = await createClient();
  
  // Check for duplicates
  const { data: existing } = await supabase
    .from('task_priority_options')
    .select('id')
    .ilike('name', name)
    .single();
  
  if (existing) {
    return { success: false, error: 'Priority name already exists' };
  }

  const { error } = await supabase
    .from('task_priority_options')
    .insert({ name: name.toLowerCase(), color, display_order: displayOrder || 99 });
  
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateTaskPriority(id: string, updates: { name?: string; color?: string; display_order?: number }) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('task_priority_options')
    .update(updates)
    .eq('id', id);
  
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeTaskPriority(id: string) {
  const supabase = await createClient();
  
  // Check if any tasks use this priority
  const { data: priority } = await supabase
    .from('task_priority_options')
    .select('name')
    .eq('id', id)
    .single();
  
  if (!priority) return { success: false, error: 'Priority not found' };
  
  const { data: tasksUsingPriority } = await supabase
    .from('tasks')
    .select('id')
    .eq('priority', priority.name)
    .limit(1);
  
  if (tasksUsingPriority && tasksUsingPriority.length > 0) {
    return { 
      success: false, 
      error: 'Cannot delete: This priority is assigned to existing tasks' 
    };
  }

  const { error } = await supabase
    .from('task_priority_options')
    .delete()
    .eq('id', id);
  
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// Task Status Management Functions
export async function getTaskStatuses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('task_status_options')
    .select('*')
    .order('display_order', { ascending: true });
  
  if (error) return { success: false, error: error.message };
  return { success: true, data };
}

export async function addTaskStatus(name: string, color: string, displayOrder?: number) {
  const supabase = await createClient();
  
  // Check for duplicates
  const { data: existing } = await supabase
    .from('task_status_options')
    .select('id')
    .ilike('name', name)
    .single();
  
  if (existing) {
    return { success: false, error: 'Status name already exists' };
  }

  const { error } = await supabase
    .from('task_status_options')
    .insert({ name: name.toLowerCase(), color, display_order: displayOrder || 99 });
  
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateTaskStatus(id: string, updates: { name?: string; color?: string; display_order?: number }) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('task_status_options')
    .update(updates)
    .eq('id', id);
  
  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function removeTaskStatus(id: string) {
  const supabase = await createClient();
  
  // Check if any tasks use this status
  const { data: status } = await supabase
    .from('task_status_options')
    .select('name')
    .eq('id', id)
    .single();
  
  if (!status) return { success: false, error: 'Status not found' };
  
  // Prevent deletion of critical statuses
  if (status.name === 'completed') {
    return { 
      success: false, 
      error: 'Cannot delete the "completed" status as it is system-critical' 
    };
  }
  
  const { data: tasksUsingStatus } = await supabase
    .from('tasks')
    .select('id')
    .eq('status', status.name)
    .limit(1);
  
  if (tasksUsingStatus && tasksUsingStatus.length > 0) {
    return { 
      success: false, 
      error: 'Cannot delete: This status is assigned to existing tasks' 
    };
  }

  const { error } = await supabase
    .from('task_status_options')
    .delete()
    .eq('id', id);
  
  if (error) return { success: false, error: error.message };
  return { success: true };
}

