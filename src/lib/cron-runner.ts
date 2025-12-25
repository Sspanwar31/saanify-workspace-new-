import { getServiceClient } from '@/lib/supabase-service'

interface CronJob {
  task_name: string
  schedule: string
  enabled: boolean
  next_run?: string
}

/**
 * Simple cron expression parser
 * Supports basic cron patterns: * * * * *
 * Format: minute hour day month weekday
 */
export function parseCronExpression(cron: string): Date | null {
  const now = new Date()
  const parts = cron.split(' ')
  
  if (parts.length !== 5) {
    return null
  }

  const [minute, hour, day, month, weekday] = parts
  
  // For simplicity, we'll just add 1 minute to now for any cron expression
  // In a production system, you'd want a proper cron parser
  const nextRun = new Date(now.getTime() + 60000) // 1 minute from now
  
  return nextRun
}

/**
 * Calculate next run time for a task based on its schedule
 */
export function calculateNextRunTime(schedule: string): string | null {
  const nextRun = parseCronExpression(schedule)
  return nextRun ? nextRun.toISOString() : null
}

/**
 * Update next run times for all enabled tasks
 */
export async function updateTaskRunTimes(): Promise<void> {
  const supabase = getServiceClient()
  
  try {
    // Get all enabled tasks
    const { data: tasks, error } = await supabase
      .from('automation_tasks')
      .select('task_name, schedule, enabled')
      .eq('enabled', true)

    if (error) {
      console.error('Failed to fetch tasks for run time update:', error)
      return
    }

    // Update next run times
    for (const task of tasks || []) {
      const nextRun = calculateNextRunTime(task.schedule)
      
      if (nextRun) {
        await supabase
          .from('automation_tasks')
          .update({ 
            next_run: nextRun,
            updated_at: new Date().toISOString()
          })
          .eq('task_name', task.task_name)
      }
    }

  } catch (error) {
    console.error('Error updating task run times:', error)
  }
}

/**
 * Check if a task is ready to run
 */
export function isTaskReadyToRun(lastRun: string | null, nextRun: string | null): boolean {
  if (!nextRun) return false
  
  const now = new Date()
  const nextRunDate = new Date(nextRun)
  
  return now >= nextRunDate
}

/**
 * Get tasks that are ready to run
 */
export async function getReadyTasks(): Promise<CronJob[]> {
  const supabase = getServiceClient()
  
  try {
    const { data: tasks, error } = await supabase
      .from('automation_tasks')
      .select('task_name, schedule, enabled, next_run, last_run')
      .eq('enabled', true)
      .or('next_run.is.null,next_run.lte.now()')

    if (error) {
      console.error('Failed to fetch ready tasks:', error)
      return []
    }

    return tasks || []

  } catch (error) {
    console.error('Error getting ready tasks:', error)
    return []
  }
}

/**
 * Execute a single task
 */
export async function executeTask(taskName: string): Promise<{ success: boolean; result?: any; error?: string }> {
  const supabase = getServiceClient()
  const jobId = crypto.randomUUID()

  try {
    // Insert running log entry
    await supabase
      .from('automation_logs')
      .insert({
        id: jobId,
        task_name: taskName,
        status: 'running',
        message: `Task "${taskName}" started`,
        details: { 
          trigger: 'cron',
          initiated_at: new Date().toISOString()
        }
      })

    let result = null
    let error = null

    // Execute the task based on type
    try {
      switch (taskName) {
        case 'schema_sync':
          result = await supabase.rpc('sync_schema')
          break
        case 'auto_sync_data':
          result = await supabase.rpc('auto_sync_data')
          break
        case 'backup':
          result = await supabase.rpc('run_backup')
          break
        case 'health_check':
          result = await supabase.rpc('health_check')
          break
        default:
          throw new Error(`Unknown task: ${taskName}`)
      }

      // Update log entry with success
      await supabase
        .from('automation_logs')
        .update({
          status: 'success',
          message: `Task "${taskName}" completed successfully`,
          details: { 
            result: result,
            completed_at: new Date().toISOString()
          }
        })
        .eq('id', jobId)

      // Update task last_run and next_run times
      const nextRun = calculateNextRunTime('* * * * *') // Default to 1 minute from now
      
      await supabase
        .from('automation_tasks')
        .update({ 
          last_run: new Date().toISOString(),
          next_run: nextRun,
          updated_at: new Date().toISOString()
        })
        .eq('task_name', taskName)

      return { success: true, result }

    } catch (taskError) {
      error = taskError
      console.error(`Task ${taskName} failed:`, taskError)

      // Update log entry with failure
      await supabase
        .from('automation_logs')
        .update({
          status: 'failed',
          message: `Task "${taskName}" failed: ${taskError instanceof Error ? taskError.message : 'Unknown error'}`,
          details: { 
            error: taskError instanceof Error ? taskError.message : 'Unknown error',
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', jobId)

      return { 
        success: false, 
        error: taskError instanceof Error ? taskError.message : 'Unknown error' 
      }
    }

  } catch (error) {
    console.error(`Failed to execute task ${taskName}:`, error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Main cron runner - executes all ready tasks
 */
export async function runCron(): Promise<{
  success: boolean
  tasksProcessed: number
  results: any[]
  summary: { successful: number; failed: number }
}> {
  const supabase = getServiceClient()
  const jobId = crypto.randomUUID()

  try {
    // Insert cron runner log entry
    await supabase
      .from('automation_logs')
      .insert({
        id: jobId,
        task_name: 'cron_runner',
        status: 'running',
        message: 'Cron runner started',
        details: { 
          trigger: 'scheduled',
          initiated_at: new Date().toISOString()
        }
      })

    // Get ready tasks
    const readyTasks = await getReadyTasks()
    const results = []

    // Process each task
    for (const task of readyTasks) {
      const result = await executeTask(task.task_name)
      results.push({
        task_name: task.task_name,
        ...result
      })
    }

    const summary = {
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    }

    // Update cron runner log entry
    await supabase
      .from('automation_logs')
      .update({
        status: 'success',
        message: 'Cron runner completed successfully',
        details: { 
          tasks_processed: readyTasks.length,
          results: results,
          summary: summary,
          completed_at: new Date().toISOString()
        }
      })
      .eq('id', jobId)

    return {
      success: true,
      tasksProcessed: readyTasks.length,
      results,
      summary
    }

  } catch (error) {
    console.error('Cron runner failed:', error)

    // Update cron runner log entry with failure
    try {
      await supabase
        .from('automation_logs')
        .update({
          status: 'failed',
          message: `Cron runner failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          details: { 
            error: error instanceof Error ? error.message : 'Unknown error',
            failed_at: new Date().toISOString()
          }
        })
        .eq('id', jobId)
    } catch (logError) {
      console.error('Failed to update cron log entry:', logError)
    }

    return {
      success: false,
      tasksProcessed: 0,
      results: [],
      summary: { successful: 0, failed: 0 }
    }
  }
}