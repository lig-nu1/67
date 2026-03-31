import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/openrouter';
import { dbAdmin } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { taskId, curatorId } = await req.json();
    if (!taskId || !curatorId) {
       return NextResponse.json({ error: 'taskId и curatorId обязательны' }, { status: 400 });
    }

    // 1. Get task from DB (including embedding)
    const { data: task, error: taskErr } = await dbAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskErr || !task) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }

    // Security check: Only the task's curator or an admin can run matching
    if (task.curator_id !== curatorId) {
      return NextResponse.json({ error: 'У вас нет прав для подбора волонтеров для этой задачи' }, { status: 403 });
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
      const parseEmb = (e: any) => typeof e === 'string' ? JSON.parse(e) : e;
      const taskEmb = parseEmb(task.embedding);
      
      const withScores = allVols.map((v: any) => {
        const volEmb = parseEmb(v.embedding);
        if (!Array.isArray(taskEmb) || !Array.isArray(volEmb)) return { ...v, similarity: 0 };

        const dot = taskEmb.reduce((s: number, val: number, i: number) => s + val * (volEmb[i] || 0), 0);
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
      ROLE: Sun Proactive Semantic Matcher
      TASK: "${task.title}" — Skills needed: ${task.hard_skills?.join(', ')}
      VOLUNTEER: ${volunteer.name} — Skills: ${volunteer.skills?.join(', ')}
      BIO: ${volunteer.bio}
      
      GOAL: Justify why this volunteer is a GREAT match for the task.
      Rule: Be specific about their skills/bio matching the task. 
      Limit to 2-3 sentences.
      Language: Russian.
      Example: «Рекомендуем этого кандидата: его опыт ведения школьного Instagram (из био) идеально закрывает вашу потребность в SMM для мероприятия».
    `.trim();

    return await chatCompletion([{ role: 'system', content: 'Вы — высококвалифицированный HR-специалист фонда Sun Foundation. Ваша задача — лаконично объяснить подбор кандидатов.' }, { role: 'user', content: prompt }], {
      model: 'google/gemini-2.0-flash-001',
      max_tokens: 200,
    });
  } catch (err) {
    console.error('Explanation generation error:', err);
    return 'Это отличный кандидат: его навыки и опыт хорошо соотносятся с требованиями задачи.';
  }
}
