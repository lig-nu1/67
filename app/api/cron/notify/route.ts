import { NextRequest, NextResponse } from 'next/server';
import { AIManagerService } from '@/lib/ai-manager-service';
import { dbAdmin } from '@/lib/db';

/**
 * POST /api/cron/notify
 * Trigger point for the Autonomous AI-Manager
 * Can be called by a real cron (Vercel/GitHub Actions) or local node-cron
 */
export async function POST(req: NextRequest) {
  try {
    const { taskId, curatorId } = await req.json().catch(() => ({}));
    
    // 1. Get tasks that are nearing deadline (24h) and need help
    let urgentTasks = [];
    
    if (taskId) {
      // Manual trigger for a specific task
      const { data: task } = await dbAdmin.from('tasks').select('*').eq('id', taskId).single();
      if (!task) return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
      if (curatorId && task.curator_id !== curatorId) {
        return NextResponse.json({ error: 'У вас нет прав для управления этой задачей' }, { status: 403 });
      }
      urgentTasks = [task];
    } else {
      // Automated sweep
      urgentTasks = await AIManagerService.getUrgentTasks();
    }
    
    if (!urgentTasks || urgentTasks.length === 0) {
      return NextResponse.json({ success: true, message: 'No urgent tasks found that require AI-Manager intervention.' });
    }

    let totalNotified = 0;
    const taskReports = [];

    // 2. Perform recruitment for each task
    for (const task of urgentTasks) {
      try {
        const report = await AIManagerService.recruitVolunteersForTask(task.id);
        totalNotified += report.notified || 0;
        taskReports.push({ taskId: task.id, title: task.title, ...report });
      } catch (err) {
        console.error(`[CRON] Error recruiting for task ${task.id}:`, err);
      }
    }

    console.log(`[CRON] Sweep complete. Total proactive notifications sent: ${totalNotified}`);
    return NextResponse.json({ 
      success: true, 
      notified: totalNotified,
      details: taskReports 
    });

  } catch (err: any) {
    console.error('[CRON] Global error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
