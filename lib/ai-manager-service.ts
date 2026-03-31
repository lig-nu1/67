import { dbAdmin } from './db';
import { chatCompletion, getEmbedding } from './openrouter';

/**
 * AI Manager Service handles proactive volunteer recruitment and matching
 */
export class AIManagerService {
  /**
   * Find tasks that need more volunteers and are close to their deadline (24h)
   */
  static async getUrgentTasks() {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: tasks, error } = await dbAdmin
      .from('tasks')
      .select('*')
      .eq('status', 'open')
      .gte('event_date', now.toISOString())
      .lte('event_date', in24h.toISOString());

    if (error) throw error;
    return tasks || [];
  }

  /**
   * Perform proactive matching for a specific task
   */
  static async recruitVolunteersForTask(taskId: string) {
    // 1. Fetch task
    const { data: task, error: taskErr } = await dbAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) throw new Error('Task not found');
    if (!task.embedding) return { notified: 0, reason: 'No task embedding' };

    // 2. Check quota
    const { count: filledCount } = await dbAdmin
      .from('applications')
      .select('id', { count: 'exact' })
      .eq('task_id', taskId)
      .eq('status', 'approved');

    const needed = (task.volunteer_quota || 1) - (filledCount || 0);
    if (needed <= 0) return { notified: 0, reason: 'Quota already filled' };

    // 3. Find candidates using semantic search
    const { data: alreadyContacted } = await dbAdmin
      .from('notifications')
      .select('user_id')
      .eq('task_id', taskId);

    const contactedIds = (alreadyContacted || []).map(n => n.user_id);

    const { data: candidates, error: candErr } = await dbAdmin
      .from('volunteer_profiles')
      .select('*, users!inner(name, email)')
      .not('embedding', 'is', null);

    if (candErr) throw candErr;

    const taskEmb = task.embedding as number[];
    const topCandidates = candidates
      .filter(v => !contactedIds.includes(v.user_id))
      .map(v => {
        const volEmb = v.embedding as number[];
        const dot = taskEmb.reduce((s, val, i) => s + val * volEmb[i], 0);
        const normA = Math.sqrt(taskEmb.reduce((s, val) => s + val * val, 0));
        const normB = Math.sqrt(volEmb.reduce((s, val) => s + val * val, 0));
        const similarity = normA && normB ? dot / (normA * normB) : 0;
        return { ...v, similarity, name: v.users?.name };
      })
      .filter(v => v.similarity > 0.6) // Match threshold
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, needed * 2);

    let notifiedCount = 0;

    for (const candidate of topCandidates) {
      try {
        // 4. Generate Explainable AI Argumentation for the push notification
        const message = await chatCompletion([{
          role: 'user',
          content: `
            ROLE: Sun Proactive AI-Manager
            TASK: "${task.title}" — ${task.description}
            VOLUNTEER: ${candidate.name}
            SKILLS: ${candidate.skills?.join(', ')}
            BIO: ${candidate.bio}
            
            GOAL: Write a short, PERSONALIZED, and URGENT message to recruit this person.
            Explain exactly why they were matched (mentioning their bio/skills).
            Mention the 24-hour deadline before the event starts.
            Tone: Professional, but high energy and appreciative.
            Language: Russian. Max 3 sentences.
          `.trim()
        }], { max_tokens: 150 });

        await dbAdmin
          .from('notifications')
          .insert({
            user_id: candidate.user_id,
            task_id: taskId,
            message,
          });

        notifiedCount++;
      } catch (e) {
        console.error('Recruitment error for candidate:', candidate.name, e);
      }
    }

    return { notified: notifiedCount };
  }
}
