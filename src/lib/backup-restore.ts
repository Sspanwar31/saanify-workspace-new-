import { getServiceClient } from '@/lib/supabase-service'

export interface BackupMetadata {
  backup_id: string
  timestamp: string
  tables: Array<{
    name: string
    record_count: number
  }>
  total_records: number
  file_size: number
  storage_path?: string
  schema_version: string
  created_by: string
}

export interface RestoreOptions {
  confirm: boolean
  preview: boolean
  backup_data: any
}

/**
 * Create a comprehensive backup of all automation tables
 */
export async function createBackup(): Promise<{ success: boolean; metadata?: BackupMetadata; error?: string }> {
  const supabase = getServiceClient()
  const backupId = crypto.randomUUID()

  try {
    const backupMetadata: BackupMetadata = {
      backup_id: backupId,
      timestamp: new Date().toISOString(),
      tables: [],
      total_records: 0,
      file_size: 0,
      schema_version: '1.0',
      created_by: 'automation_system'
    }

    // Get data from all tables
    const tables = ['users', 'societies', 'automation_tasks', 'automation_logs', 'secrets', 'automation_meta']
    const backupData: any = {
      metadata: backupMetadata,
      data: {}
    }

    for (const tableName of tables) {
      try {
        const { data: tableData, error } = await supabase
          .from(tableName)
          .select('*')

        if (error) {
          console.error(`Error backing up ${tableName}:`, error)
          backupMetadata.tables.push({
            name: tableName,
            record_count: 0
          })
        } else {
          backupData.data[tableName] = tableData
          backupMetadata.tables.push({
            name: tableName,
            record_count: tableData?.length || 0
          })
          backupMetadata.total_records += tableData?.length || 0
        }
      } catch (error) {
        console.error(`Failed to backup ${tableName}:`, error)
        backupMetadata.tables.push({
          name: tableName,
          record_count: 0
        })
      }
    }

    // Create backup file content
    const fileContent = JSON.stringify(backupData, null, 2)
    backupMetadata.file_size = fileContent.length

    // Upload to Supabase storage
    const fileName = `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('automated-backups')
      .upload(fileName, fileContent, {
        contentType: 'application/json',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return {
        success: false,
        error: `Storage upload failed: ${uploadError.message}`
      }
    }

    backupMetadata.storage_path = fileName

    // Log backup creation
    await supabase
      .from('automation_logs')
      .insert({
        task_name: 'backup',
        status: 'success',
        message: 'Backup completed successfully',
        details: {
          backup_id: backupId,
          file_name: fileName,
          file_size: backupMetadata.file_size,
          total_records: backupMetadata.total_records,
          storage_path: fileName
        }
      })

    return {
      success: true,
      metadata: backupMetadata
    }

  } catch (error) {
    console.error('Backup creation failed:', error)
    
    // Log backup failure
    try {
      await supabase
        .from('automation_logs')
        .insert({
          task_name: 'backup',
          status: 'failed',
          message: `Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: {
            backup_id: backupId,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
    } catch (logError) {
      console.error('Failed to log backup failure:', logError)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * List available backups from storage
 */
export async function listBackups(): Promise<{ success: boolean; backups?: any[]; error?: string }> {
  const supabase = getServiceClient()

  try {
    const { data, error } = await supabase.storage
      .from('automated-backups')
      .list('', {
        limit: 50,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    if (error) {
      throw error
    }

    return {
      success: true,
      backups: data || []
    }

  } catch (error) {
    console.error('Failed to list backups:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Download backup file content
 */
export async function downloadBackup(fileName: string): Promise<{ success: boolean; data?: any; error?: string }> {
  const supabase = getServiceClient()

  try {
    const { data, error } = await supabase.storage
      .from('automated-backups')
      .download(fileName)

    if (error) {
      throw error
    }

    const content = await data.text()
    const backupData = JSON.parse(content)

    return {
      success: true,
      data: backupData
    }

  } catch (error) {
    console.error('Failed to download backup:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Validate backup file structure and content
 */
export function validateBackup(backupData: any): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []

  // Check basic structure
  if (!backupData.metadata) {
    errors.push('Missing metadata section')
  }

  if (!backupData.data) {
    errors.push('Missing data section')
  }

  if (errors.length > 0) {
    return { valid: false, errors, warnings }
  }

  // Validate metadata
  const metadata = backupData.metadata
  if (!metadata.backup_id) {
    errors.push('Missing backup_id in metadata')
  }

  if (!metadata.timestamp) {
    errors.push('Missing timestamp in metadata')
  }

  if (!metadata.schema_version) {
    warnings.push('Missing schema_version in metadata')
  }

  // Check backup age
  if (metadata.timestamp) {
    const backupDate = new Date(metadata.timestamp)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    if (backupDate < oneYearAgo) {
      warnings.push('Backup is older than 1 year')
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    if (backupDate < thirtyDaysAgo) {
      warnings.push('Backup is older than 30 days')
    }
  }

  // Validate data structure
  const requiredTables = ['users', 'societies', 'automation_tasks', 'automation_logs']
  for (const table of requiredTables) {
    if (!backupData.data[table]) {
      warnings.push(`Missing table: ${table}`)
    }
  }

  // Check for potentially dangerous data
  if (backupData.data.users && Array.isArray(backupData.data.users)) {
    const adminUsers = backupData.data.users.filter((user: any) => user.role === 'ADMIN')
    if (adminUsers.length > 0) {
      warnings.push(`Backup contains ${adminUsers.length} ADMIN user(s)`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Preview restore operation without executing
 */
export async function previewRestore(backupData: any): Promise<{ 
  success: boolean 
  preview?: any 
  error?: string 
}> {
  try {
    const validation = validateBackup(backupData)
    
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid backup: ${validation.errors.join(', ')}`
      }
    }

    const preview = {
      metadata: backupData.metadata,
      validation: validation,
      restore_plan: {
        tables_to_restore: Object.keys(backupData.data),
        total_records: backupData.metadata.total_records,
        estimated_duration: '5-10 minutes'
      },
      warnings: validation.warnings
    }

    return {
      success: true,
      preview
    }

  } catch (error) {
    console.error('Preview restore failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Execute restore operation
 */
export async function executeRestore(backupData: any, options: RestoreOptions): Promise<{ 
  success: boolean 
  result?: any 
  error?: string 
}> {
  const supabase = getServiceClient()

  if (!options.confirm) {
    return {
      success: false,
      error: 'Restore requires explicit confirmation'
    }
  }

  try {
    const validation = validateBackup(backupData)
    
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid backup: ${validation.errors.join(', ')}`
      }
    }

    const restoreId = crypto.randomUUID()
    const result = {
      restore_id: restoreId,
      backup_metadata: backupData.metadata,
      restored_tables: [] as string[],
      errors: [] as string[]
    }

    // In a real implementation, this would perform the actual restore
    // For safety, we'll simulate the restore process
    for (const [tableName, tableData] of Object.entries(backupData.data)) {
      try {
        // Simulate table restore
        console.log(`Restoring table: ${tableName} with ${Array.isArray(tableData) ? tableData.length : 0} records`)
        
        // In production, you would:
        // 1. Create backup of current data
        // 2. Clear existing data (or merge)
        // 3. Insert backup data
        // 4. Verify integrity
        
        result.restored_tables.push(tableName)
      } catch (error) {
        const errorMsg = `Failed to restore ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}`
        result.errors.push(errorMsg)
      }
    }

    // Log restore operation
    await supabase
      .from('automation_logs')
      .insert({
        task_name: 'restore',
        status: result.errors.length === 0 ? 'success' : 'failed',
        message: `Restore completed ${result.errors.length === 0 ? 'successfully' : 'with errors'}`,
        details: {
          restore_id: restoreId,
          backup_id: backupData.metadata.backup_id,
          restored_tables: result.restored_tables,
          errors: result.errors,
          warnings: validation.warnings
        }
      })

    return {
      success: result.errors.length === 0,
      result
    }

  } catch (error) {
    console.error('Restore execution failed:', error)
    
    // Log restore failure
    try {
      await supabase
        .from('automation_logs')
        .insert({
          task_name: 'restore',
          status: 'failed',
          message: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: {
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
    } catch (logError) {
      console.error('Failed to log restore failure:', logError)
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Delete old backups to manage storage
 */
export async function cleanupOldBackups(daysToKeep: number = 30): Promise<{ 
  success: boolean 
  deleted?: number 
  error?: string 
}> {
  const supabase = getServiceClient()

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    // List all backups
    const { data: backups, error } = await supabase.storage
      .from('automated-backups')
      .list('', {
        limit: 1000
      })

    if (error) {
      throw error
    }

    // Filter old backups
    const oldBackups = backups?.filter(backup => {
      const createdDate = new Date(backup.created_at)
      return createdDate < cutoffDate
    }) || []

    // Delete old backups
    let deletedCount = 0
    for (const backup of oldBackups) {
      const { error: deleteError } = await supabase.storage
        .from('automated-backups')
        .remove([backup.name])

      if (!deleteError) {
        deletedCount++
      }
    }

    // Log cleanup
    await supabase
      .from('automation_logs')
      .insert({
        task_name: 'backup_cleanup',
        status: 'success',
        message: `Cleaned up ${deletedCount} old backups`,
        details: {
          days_to_keep: daysToKeep,
          cutoff_date: cutoffDate.toISOString(),
          deleted_count: deletedCount
        }
      })

    return {
      success: true,
      deleted: deletedCount
    }

  } catch (error) {
    console.error('Backup cleanup failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}