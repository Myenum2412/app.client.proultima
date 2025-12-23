/**
 * Supabase Seed Helpers
 * TypeScript utilities for programmatically seeding the database
 * (Alternative to SQL seed script for development/testing)
 */

// @ts-nocheck - Temporary bypass for Supabase type generation issues
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types'

type SupabaseClientType = SupabaseClient<Database>

/**
 * Seed projects table
 */
export async function seedProjects(supabase: SupabaseClientType) {
  const projects = [
    {
      project_number: 'U2524',
      project_name: 'Valley View Business Park Tilt Panels',
      client_name: 'RE-STEEL',
      contractor_name: 'T&T CONSTRUCTION',
      project_location: 'JESSUP, PA',
      estimated_tons: 398.9,
      detailing_status: 'COMPLETED',
      revision_status: 'COMPLETED',
      release_status: 'RELEASED COMPLETELY',
      status: 'completed' as const,
    },
    {
      project_number: 'U2532',
      project_name: 'MID-WAY SOUTH LOGISTIC CENTER, PANELS',
      client_name: 'RE-STEEL',
      contractor_name: 'T&T CONSTRUCTION',
      project_location: 'BETHEL, PA',
      estimated_tons: 189,
      detailing_status: 'IN PROCESS',
      revision_status: 'IN PROCESS',
      release_status: 'IN PROCESS',
      status: 'in-progress' as const,
    },
    {
      project_number: 'U3223P',
      project_name: 'PANATTONI LEHIGH 309 BUILDING B TILT PANELS',
      client_name: 'RE-STEEL',
      contractor_name: 'FORCINE CONCRETE',
      project_location: 'UPPER SAUCON TWP, PA',
      estimated_tons: 412.5,
      detailing_status: 'COMPLETED',
      revision_status: 'IN PROCESS',
      release_status: 'IN PROCESS',
      status: 'in-progress' as const,
    },
  ]

  const { data, error } = await supabase
    .from('projects')
    .upsert(projects, { onConflict: 'project_number' })
    .select()

  if (error) throw error
  console.log(`✅ Seeded ${data.length} projects`)
  return data
}

/**
 * Seed drawings yet to release
 */
export async function seedDrawingsYetToRelease(supabase: SupabaseClientType, projectId: string) {
  const drawings = [
    { dwg: 'R-1', description: 'FOUNDATION PANELS F1 TO F4', total_weight: 12.32, latest_submitted_date: '2019-10-05' },
    { dwg: 'R-2', description: 'FOUNDATION PANELS F5 TO F8', total_weight: 12.31, latest_submitted_date: '2019-10-05' },
    { dwg: 'R-3', description: 'NORTH WALL PANELS N1 TO N4', total_weight: 14.89, latest_submitted_date: '2019-10-05' },
    { dwg: 'R-4', description: 'NORTH WALL PANELS N1 TO N8', total_weight: 17.77, latest_submitted_date: '2019-10-05' },
    { dwg: 'R-5', description: 'NORTH WALL PANELS N9 TO N15', total_weight: 19.70, latest_submitted_date: '2019-10-05' },
  ].map(d => ({
    ...d,
    project_id: projectId,
    status: 'FFU' as const,
    release_status: 'Released',
  }))

  const { data, error } = await supabase
    .from('drawings_yet_to_release')
    .insert(drawings)
    .select()

  if (error) throw error
  console.log(`✅ Seeded ${data.length} drawings yet to release`)
  return data
}

/**
 * Seed invoices
 */
export async function seedInvoices(supabase: SupabaseClientType) {
  const invoices = [
    {
      invoice_id: 'INV-1001',
      project_number: 'U2524',
      project_name: 'Valley View Business Park Tilt Panels',
      billed_tonnage: 12.4,
      unit_price_lump_sum: 150,
      tons_billed_amount: 1860.0,
      billed_hours_co: 6.5,
      co_price: 975.0,
      co_billed_amount: 975.0,
      total_amount_billed: 2835.0,
      status: 'Pending' as const,
    },
    {
      invoice_id: 'INV-1003',
      project_number: 'U2524',
      project_name: 'Valley View Business Park Tilt Panels',
      billed_tonnage: 8.2,
      unit_price_lump_sum: 150,
      tons_billed_amount: 1230.0,
      billed_hours_co: 0.0,
      co_price: 0.0,
      co_billed_amount: 0.0,
      total_amount_billed: 1230.0,
      status: 'Pending' as const,
    },
  ]

  const { data, error } = await supabase
    .from('invoices')
    .upsert(invoices, { onConflict: 'invoice_id' })
    .select()

  if (error) throw error
  console.log(`✅ Seeded ${data.length} invoices`)
  return data
}

/**
 * Seed submissions
 */
export async function seedSubmissions(supabase: SupabaseClientType, projectId: string) {
  const submissions = [
    {
      project_id: projectId,
      submission_type: 'RFI' as const,
      work_description: 'Anchor bolt plan update',
      drawing_number: 'R-71',
      submission_date: '2024-12-22',
      submitted_by: 'PROULTIMA PM',
    },
    {
      project_id: projectId,
      submission_type: 'SUBMITTAL' as const,
      work_description: 'Embed layout confirmation',
      drawing_number: 'R-16',
      submission_date: '2024-12-18',
      submitted_by: 'PROULTIMA PM',
    },
  ]

  const { data, error } = await supabase
    .from('submissions')
    .insert(submissions)
    .select()

  if (error) throw error
  console.log(`✅ Seeded ${data.length} submissions`)
  return data
}

/**
 * Clear all data from tables (careful!)
 */
export async function clearAllData(supabase: SupabaseClientType) {
  console.log('⚠️  Clearing all data...')
  
  // Delete in reverse order of dependencies
  await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('submissions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('material_list_fields').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('material_list_bar_items').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('material_lists').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('drawing_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('drawings_yet_to_release').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('drawings_yet_to_return').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  
  console.log('✅ All data cleared')
}

/**
 * Seed all tables with demo data
 */
export async function seedAll(supabase: SupabaseClientType) {
  console.log('🌱 Starting database seeding...')
  
  try {
    // Seed projects
    const projects = await seedProjects(supabase)
    
    // Find U2524 project
    const u2524 = projects.find(p => p.project_number === 'U2524')
    if (!u2524) throw new Error('U2524 project not found')
    
    // Seed drawings for U2524
    await seedDrawingsYetToRelease(supabase, u2524.id)
    
    // Seed invoices
    await seedInvoices(supabase)
    
    // Seed submissions for U2524
    await seedSubmissions(supabase, u2524.id)
    
    console.log('✅ Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  }
}

/**
 * Example usage:
 * 
 * import { createSupabaseServerClient } from '@/lib/supabase/server'
 * import { seedAll } from '@/lib/supabase/seed-helpers'
 * 
 * const supabase = await createSupabaseServerClient()
 * await seedAll(supabase)
 */

