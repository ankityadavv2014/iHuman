/**
 * Scheduling System for Automated Task Execution
 * Supports cron expressions and one-time scheduled tasks
 */

const db = require('./db/connection');
const { CronJob } = require('cron');

class SchedulerManager {
  constructor() {
    this.jobs = new Map(); // scheduleName -> CronJob
    this.activeSchedules = new Map(); // scheduleId -> details
    this.executionQueue = [];
  }

  /**
   * Initialize scheduler
   */
  async initialize() {
    console.log('⏰ Initializing scheduler system...');

    try {
      // Load and start all active schedules
      const schedules = await db.select('workflows', 'is_scheduled = true AND is_active = true', []);

      for (const schedule of schedules) {
        await this.startSchedule(schedule);
      }

      console.log(`✅ Scheduler initialized with ${schedules.length} active schedules`);
    } catch (error) {
      console.error('Scheduler initialization error:', error);
    }
  }

  /**
   * Create new schedule
   */
  async createSchedule(workflowId, cronExpression, description, params = {}) {
    try {
      // Validate cron expression
      if (!this.isValidCronExpression(cronExpression)) {
        throw new Error('Invalid cron expression');
      }

      const schedule = await db.insert('workflows', {
        workflow_id: `schedule_${Date.now()}`,
        skill_ids: JSON.stringify([]),
        is_scheduled: true,
        cron_expression: cronExpression,
        description,
        params: JSON.stringify(params),
        is_active: true,
        created_at: new Date()
      });

      console.log(`✅ Schedule created: ${schedule.id} | Cron: ${cronExpression}`);

      // Start schedule
      await this.startSchedule(schedule);

      return schedule;
    } catch (error) {
      console.error('Create schedule error:', error);
      throw error;
    }
  }

  /**
   * Start a schedule
   */
  async startSchedule(schedule) {
    try {
      const cronJob = new CronJob(
        schedule.cron_expression,
        async () => {
          await this.executeScheduledWorkflow(schedule);
        },
        null,
        true, // Start immediately
        'UTC'
      );

      this.jobs.set(schedule.id, cronJob);
      this.activeSchedules.set(schedule.id, {
        id: schedule.id,
        cronExpression: schedule.cron_expression,
        description: schedule.description,
        lastRun: null,
        nextRun: cronJob.nextDate().toJSDate(),
        executionCount: 0
      });

      console.log(`▶️ Schedule started: ${schedule.id} | Next run: ${cronJob.nextDate().toISO()}`);
    } catch (error) {
      console.error('Start schedule error:', error);
    }
  }

  /**
   * Execute scheduled workflow
   */
  async executeScheduledWorkflow(schedule) {
    const startTime = Date.now();

    try {
      console.log(`⚙️ Executing scheduled workflow: ${schedule.id}`);

      // Update last run time
      await db.update(
        'workflows',
        {
          last_run_at: new Date(),
          run_count: db.raw('run_count + 1')
        },
        'id = $1',
        [schedule.id]
      );

      // Parse skill IDs and params
      const skillIds = JSON.parse(schedule.skill_ids || '[]');
      const params = JSON.parse(schedule.params || '{}');

      // Execute each skill in sequence
      for (const skillId of skillIds) {
        await this.executeSkillWithRetry(skillId, params, 3);
      }

      const durationMs = Date.now() - startTime;

      // Log execution
      await db.insert('audit_logs', {
        user_id: null,
        entity_type: 'workflow',
        entity_id: schedule.id,
        action: 'execute',
        details: JSON.stringify({
          reason: 'scheduled',
          durationMs,
          skillCount: skillIds.length
        }),
        created_at: new Date()
      });

      // Update schedule stats
      const activeSchedule = this.activeSchedules.get(schedule.id);
      if (activeSchedule) {
        activeSchedule.lastRun = new Date();
        activeSchedule.executionCount++;

        const cronJob = this.jobs.get(schedule.id);
        if (cronJob) {
          activeSchedule.nextRun = cronJob.nextDate().toJSDate();
        }
      }

      console.log(`✅ Schedule executed successfully | Duration: ${durationMs}ms | Skills: ${skillIds.length}`);
    } catch (error) {
      console.error('Schedule execution error:', error);

      // Log error
      await db.insert('audit_logs', {
        user_id: null,
        entity_type: 'workflow',
        entity_id: schedule.id,
        action: 'execute_failed',
        details: JSON.stringify({
          reason: 'scheduled',
          error: error.message
        }),
        created_at: new Date()
      });
    }
  }

  /**
   * Execute skill with retry logic
   */
  async executeSkillWithRetry(skillId, params, maxRetries = 3, attemptNumber = 0) {
    try {
      const skill = await db.selectOne('skills', 'skill_id = $1', [skillId]);

      if (!skill) {
        throw new Error(`Skill not found: ${skillId}`);
      }

      // Simulate skill execution
      console.log(`🎯 Executing skill: ${skillId}`);

      // In production, this would trigger actual skill execution
      // For now, we'll just record it
      return {
        skillId,
        status: 'completed',
        duration: Math.random() * 1000
      };
    } catch (error) {
      console.error(`❌ Skill execution failed (attempt ${attemptNumber + 1}):`, error.message);

      if (attemptNumber < maxRetries - 1) {
        const delay = (attemptNumber + 1) * 5000; // 5s, 10s, 15s
        console.log(`⏳ Retrying in ${delay}ms...`);

        return new Promise((resolve, reject) => {
          setTimeout(() => {
            this.executeSkillWithRetry(skillId, params, maxRetries, attemptNumber + 1)
              .then(resolve)
              .catch(reject);
          }, delay);
        });
      } else {
        throw error;
      }
    }
  }

  /**
   * Validate cron expression
   */
  isValidCronExpression(expression) {
    try {
      new CronJob(expression);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Stop schedule
   */
  async stopSchedule(scheduleId) {
    const cronJob = this.jobs.get(scheduleId);
    if (cronJob) {
      cronJob.stop();
      this.jobs.delete(scheduleId);
      this.activeSchedules.delete(scheduleId);

      await db.update(
        'workflows',
        { is_active: false },
        'id = $1',
        [scheduleId]
      );

      console.log(`⏸️ Schedule stopped: ${scheduleId}`);
    }
  }

  /**
   * Pause schedule
   */
  async pauseSchedule(scheduleId) {
    const cronJob = this.jobs.get(scheduleId);
    if (cronJob) {
      cronJob.stop();
      console.log(`⏸️ Schedule paused: ${scheduleId}`);
    }
  }

  /**
   * Resume schedule
   */
  async resumeSchedule(scheduleId) {
    const schedule = await db.selectOne('workflows', 'id = $1', [scheduleId]);
    if (schedule) {
      const cronJob = this.jobs.get(scheduleId);
      if (cronJob) {
        cronJob.start();
        console.log(`▶️ Schedule resumed: ${scheduleId}`);
      }
    }
  }

  /**
   * Delete schedule
   */
  async deleteSchedule(scheduleId) {
    await this.stopSchedule(scheduleId);
    await db.deleteRecord('workflows', 'id = $1', [scheduleId]);
    console.log(`🗑️ Schedule deleted: ${scheduleId}`);
  }

  /**
   * Get schedule details
   */
  async getScheduleDetails(scheduleId) {
    const schedule = await db.selectOne('workflows', 'id = $1', [scheduleId]);
    const activeSchedule = this.activeSchedules.get(scheduleId);

    return {
      ...schedule,
      ...activeSchedule,
      skillCount: JSON.parse(schedule.skill_ids || '[]').length
    };
  }

  /**
   * List all schedules
   */
  async listSchedules(userId = null) {
    const schedules = await db.select(
      'workflows',
      userId ? 'user_id = $1 AND is_scheduled = true' : 'is_scheduled = true',
      userId ? [userId] : []
    );

    return schedules.map(schedule => ({
      ...schedule,
      ...this.activeSchedules.get(schedule.id),
      skillCount: JSON.parse(schedule.skill_ids || '[]').length
    }));
  }

  /**
   * Get statistics
   */
  getStats() {
    const stats = {
      totalSchedules: this.activeSchedules.size,
      totalExecutions: 0,
      totalErrors: 0,
      schedules: Array.from(this.activeSchedules.values()).map(s => ({
        id: s.id,
        description: s.description,
        cronExpression: s.cronExpression,
        executionCount: s.executionCount,
        lastRun: s.lastRun,
        nextRun: s.nextRun
      }))
    };

    stats.totalExecutions = stats.schedules.reduce((sum, s) => sum + s.executionCount, 0);

    return stats;
  }

  /**
   * Cleanup on shutdown
   */
  shutdown() {
    this.jobs.forEach((job) => {
      job.stop();
    });
    console.log('⏹️ Scheduler shutdown complete');
  }
}

module.exports = new SchedulerManager();
