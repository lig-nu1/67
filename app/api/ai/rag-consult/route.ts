import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/openrouter';
import { dbAdmin } from '@/lib/db';

const RAG_SYSTEM = (taskContext: string) => `
Ты — консультант по задаче на платформе Sun Proactive.

КОНТЕКСТ ЗАДАЧИ (только этим и руководствуйся):
---
${taskContext}
---

СТРОГИЕ ПРАВИЛА:
1. Отвечай ТОЛЬКО на основе информации из контекста выше.
2. Если ответа в контексте НЕТ — скажи ровно: "Организатор этого не указал. Рекомендую уточнить напрямую."
3. НЕ придумывай информацию. НЕ используй свои общие знания.
4. Отвечай по-русски, кратко и по делу.
`;

export async function POST(req: NextRequest) {
  try {
    const { taskId, question, chatHistory } = await req.json();

    // RAG: fetch task as context
    const { data: task, error } = await dbAdmin
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error || !task) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }

    const context = `
Название: ${task.title}
Описание: ${task.description}
Локация: ${task.location || 'Не указана'}
Дата: ${task.event_date || 'Не указана'}
Нужные навыки: ${task.hard_skills?.join(', ') || 'Не указаны'}
Мягкие навыки: ${task.soft_skills?.join(', ') || 'Не указаны'}
Количество мест: ${task.volunteer_quota || 'Не указано'}
    `.trim();

    const answer = await chatCompletion([
      { role: 'system', content: RAG_SYSTEM(context) },
      ...(chatHistory || []),
      { role: 'user', content: question },
    ], {
      model: 'google/gemini-2.5-flash',
      temperature: 0.1, // Low temperature = less hallucination
    });

    return NextResponse.json({ answer });
  } catch (err: any) {
    console.error('RAG consult error:', err);
    return NextResponse.json({ error: err.message || 'Ошибка AI' }, { status: 500 });
  }
}
