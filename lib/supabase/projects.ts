import { supabase } from './client'

export interface Project {
  id?: string
  projectName: string
  projectNumber: string
  dueDate: string
  description?: string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  files?: string[]
  createdAt?: string
  updatedAt?: string
}

export async function addProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        project_name: project.projectName,
        project_number: project.projectNumber,
        due_date: project.dueDate,
        description: project.description || null,
        status: project.status,
        files: project.files || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to add project: ${error.message}`)
  }

  return data
}

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`)
  }

  return data
}

export async function updateProject(id: string, updates: Partial<Project>) {
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString(),
  }

  if (updates.projectName) updateData.project_name = updates.projectName
  if (updates.projectNumber) updateData.project_number = updates.projectNumber
  if (updates.dueDate) updateData.due_date = updates.dueDate
  if (updates.description !== undefined) updateData.description = updates.description
  if (updates.status) updateData.status = updates.status
  if (updates.files) updateData.files = updates.files

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`)
  }

  return data
}

export async function deleteProject(id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`)
  }
}

