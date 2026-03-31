import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db';
import { chatCompletion } from '@/lib/openrouter';

// POST /api/ai/volunteer-match — find best tasks for a volunteer
export async function POST(req: NextRequest) {
  try {
    const { volunteerId } = await req.json();

    // Get volunteer profile with embedding
    const { data: profile, error: profErr } = await dbAdmin
      .from('volunteer_profiles')
      .select('*')
      .eq('user_id', volunteerId)
      .single();

    if (profErr || !profile || !profile.embedding) {
      return NextResponse.json({ tasks: [] });
    }

    // Get all open tasks with embeddings
    const { data: tasks, error: tasksErr } = await dbAdmin
      .from('tasks')
      .select('*')
      .eq('status', 'open')
      .not('embedding', 'is', null);

    if (tasksErr || !tasks || tasks.length === 0) {
      return NextResponse.json({ tasks: [] });
    }

    // Compute cosine similarity for each task
    const volEmb = profile.embedding as number[];
    const tasksWithScores = tasks.map((task: any) => {
      const taskEmb = task.embedding as number[];
      const dot = volEmb.reduce((s: number, val: number, i: number) => s + val * taskEmb[i], 0);
      const normA = Math.sqrt(volEmb.reduce((s: number, val: number) => s + val * val, 0));
      const normB = Math.sqrt(taskEmb.reduce((s: number, val: number) => s + val * val, 0));
      const similarity = normA && normB ? dot / (normA * normB) : 0;
      return { id: task.id, similarity };
    });

    tasksWithScores.sort((a: any, b: any) => b.similarity - a.similarity);

    // Generate explanations for top 5
    const top5 = tasksWithScores.slice(0, 5);
    const enriched = await Promise.all(
      top5.map(async (scored: any) => {
        const task = tasks.find((t: any) => t.id === scored.id);
        let explanation = '';
        try {
          explanation = await chatCompletion([{
            role: 'user',
            content: `
Задача: "${task.title}" — ${task.description}
Навыки задачи: ${task.hard_skills?.join(', ')}

Волонтёр: навыки — ${profile.skills?.join(', ')}, интересы — ${profile.interests?.join(', ')}

Напиши 1 короткое предложение на русском, почему эта задача подходит этому волонтёру.
            `.trim(),
          }], { max_tokens: 80 });
        } catch {}
        return { ...scored, explanation };
      })
    );

    // Return all tasks with scores (explanations only for top 5)
    const resultMap = new Map(enriched.map((e: any) => [e.id, e]));
    const allResults = tasksWithScores.map((t: any) => ({
      ...t,
      explanation: resultMap.get(t.id)?.explanation || '',
    }));

    return NextResponse.json({ tasks: allResults });
  } catch (err: any) {
    console.error('Volunteer match error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
