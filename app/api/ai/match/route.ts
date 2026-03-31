import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/openrouter';
import { dbAdmin } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { taskId } = await req.json();

    // 1. Get task from DB (including embedding)
    const { data: task, error: taskErr } = await dbAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }

    if (!task.embedding) {
      return NextResponse.json({ error: 'У задачи нет embedding' }, { status: 400 });
    }

    // 2. Use pgvector for fast search
    const { data: volunteers, error: volErr } = await dbAdmin.rpc('match_volunteers', {
      query_embedding: task.embedding,
      match_threshold: 0.0,
      match_count: 10,
    });

    if (volErr) {
      console.error('pgvector query error:', volErr);
      // Fallback: fetch all volunteers and compute similarity in JS
      const { data: allVols } = await dbAdmin
        .from('volunteer_profiles')
        .select('*, users!inner(name, email)')
        .not('embedding', 'is', null);

      if (!allVols || allVols.length === 0) {
        return NextResponse.json({ matches: [] });
      }

      // Compute cosine similarity manually
      const taskEmb = task.embedding as number[];
      const withScores = allVols.map((v: any) => {
        const volEmb = v.embedding as number[];
        const dot = taskEmb.reduce((s: number, val: number, i: number) => s + val * volEmb[i], 0);
        const normA = Math.sqrt(taskEmb.reduce((s: number, val: number) => s + val * val, 0));
        const normB = Math.sqrt(volEmb.reduce((s: number, val: number) => s + val * val, 0));
        const similarity = normA && normB ? dot / (normA * normB) : 0;
        return { ...v, similarity, name: v.users?.name, email: v.users?.email };
      });

      withScores.sort((a: any, b: any) => b.similarity - a.similarity);
      const top = withScores.slice(0, 5);

      const results = await Promise.all(
        top.map(async (volunteer: any) => {
          const explanation = await generateMatchExplanation(task, volunteer);
          return { ...volunteer, explanation };
        })
      );

      return NextResponse.json({ matches: results });
    }

    // 3. Generate explanation for top matches via AI
    const top5 = (volunteers || []).slice(0, 5);
    const results = await Promise.all(
      top5.map(async (volunteer: any) => {
        const explanation = await generateMatchExplanation(task, volunteer);
        return { ...volunteer, explanation };
      })
    );

    return NextResponse.json({ matches: results });
  } catch (err: any) {
    console.error('Match error:', err);
    return NextResponse.json({ error: err.message || 'Ошибка мэтчинга' }, { status: 500 });
  }
}

async function generateMatchExplanation(task: any, volunteer: any): Promise<string> {
  try {
    const prompt = `
Задача: "${task.title}"
Требуемые навыки: ${task.hard_skills?.join(', ') || 'не указаны'}, ${task.soft_skills?.join(', ') || 'не указаны'}

Волонтёр: ${volunteer.name || 'Имя не указано'}
Навыки волонтёра: ${volunteer.skills?.join(', ') || 'не указаны'}
Биография: ${volunteer.bio || 'не указана'}

Напиши 2 предложения, объясняющих КОНКРЕТНО почему этот волонтёр подходит для данной задачи.
Ссылайся на конкретные совпадения навыков. Пиши по-русски, кратко и убедительно.
    `.trim();

    return await chatCompletion([{ role: 'user', content: prompt }], {
      model: 'google/gemini-2.5-flash',
      max_tokens: 150,
    });
  } catch {
    return 'Не удалось сгенерировать объяснение.';
  }
}
