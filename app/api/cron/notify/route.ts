import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db';
import { chatCompletion } from '@/lib/openrouter';

// POST /api/cron/notify — Background job trigger (call via Vercel Cron or manually)
export async function POST(req: NextRequest) {
  try {
    // Validate cron secret (optional security)
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find urgent tasks: event in next 24h AND quota not filled
    const { data: tasks, error: tasksErr } = await dbAdmin
      .from('tasks')
      .select('*')
      .eq('status', 'open')
      .gte('event_date', now.toISOString())
      .lte('event_date', in24h.toISOString());

    if (tasksErr) throw tasksErr;

    let notified = 0;

    for (const task of (tasks || [])) {
      // Count filled spots
      const { count: filledCount } = await dbAdmin
        .from('applications')
        .select('id', { count: 'exact' })
        .eq('task_id', task.id)
        .eq('status', 'approved');

      const filledSpots = filledCount || 0;
      if (filledSpots >= (task.volunteer_quota || 1)) continue;
      const needed = (task.volunteer_quota || 1) - filledSpots;

      if (!task.embedding) continue;

      // Find best matching free volunteers (not already applied)
      const { data: alreadyApplied } = await dbAdmin
        .from('applications')
        .select('volunteer_id')
        .eq('task_id', task.id);

      const appliedIds = (alreadyApplied || []).map((a: any) => a.volunteer_id);

      // Get all volunteers with embeddings
      let volQuery = dbAdmin
        .from('volunteer_profiles')
        .select('*, users!inner(name, email)')
        .not('embedding', 'is', null);

      const { data: candidates } = await volQuery;

      if (!candidates || candidates.length === 0) continue;

      // Filter out already applied and compute similarity
      const taskEmb = task.embedding as number[];
      const matchedCandidates = candidates
        .filter((v: any) => !appliedIds.includes(v.user_id))
        .map((v: any) => {
          const volEmb = v.embedding as number[];
          const dot = taskEmb.reduce((s: number, val: number, i: number) => s + val * volEmb[i], 0);
          const normA = Math.sqrt(taskEmb.reduce((s: number, val: number) => s + val * val, 0));
          const normB = Math.sqrt(volEmb.reduce((s: number, val: number) => s + val * val, 0));
          const similarity = normA && normB ? dot / (normA * normB) : 0;
          return { ...v, similarity, name: v.users?.name };
        })
        .sort((a: any, b: any) => b.similarity - a.similarity)
        .slice(0, needed * 2);

      // Generate personalized notification for each candidate
      for (const candidate of matchedCandidates) {
        try {
          const message = await chatCompletion([{
            role: 'user',
            content: `
Напиши срочное персонализированное уведомление волонтёру.
Имя волонтёра: ${candidate.name || 'Волонтёр'}
Навыки волонтёра: ${candidate.skills?.join(', ') || 'не указаны'}
Задача: "${task.title}" — ${task.description}
До начала: менее 24 часов!

Уведомление должно быть: срочным, личным, 2-3 предложения. По-русски.
Упомяни конкретный навык волонтёра, который нужен для задачи.
            `.trim(),
          }], { max_tokens: 100 });

          await dbAdmin
            .from('notifications')
            .insert({
              user_id: candidate.user_id,
              task_id: task.id,
              message,
            });

          notified++;
        } catch (e) {
          console.error(`Failed to notify ${candidate.name}:`, e);
        }
      }
    }

    return NextResponse.json({ success: true, notified });
  } catch (err: any) {
    console.error('Cron notify error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
