import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/openrouter';

const SYSTEM_PROMPT = `
Ты — AI-интервьюер платформы Sun Proactive. Твоя задача — помочь куратору создать чёткое описание задачи для волонтёров.

Правила:
1. Веди диалог по-русски, задавай по ОДНОМУ уточняющему вопросу за раз.
2. Собери следующие данные: название задачи, дата и время, локация (адрес), описание работы, необходимые hard skills (технические навыки), необходимые soft skills (личные качества), количество волонтёров.
3. Когда у тебя есть ВСЕ данные, выведи ТОЛЬКО JSON без лишнего текста в формате:

ЗАДАЧА_ГОТОВА:
{
  "title": "string",
  "description": "string",
  "location": "string",
  "event_date": "ISO 8601 datetime",
  "volunteer_quota": number,
  "hard_skills": ["string"],
  "soft_skills": ["string"]
}

4. Если данных недостаточно — продолжай диалог.
5. Начни с приветствия и попроси описать задачу.
`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    // messages: Array<{role: 'user'|'assistant', content: string}>

    const reply = await chatCompletion([
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ], {
      model: 'google/gemini-2.5-flash',
      temperature: 0.3,
    });

    // Check if task is ready
    const isComplete = reply.includes('ЗАДАЧА_ГОТОВА:');
    let taskJson = null;

    if (isComplete) {
      const jsonStr = reply.split('ЗАДАЧА_ГОТОВА:')[1].trim();
      try {
        // Extract JSON even if there's text after it
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          taskJson = JSON.parse(jsonMatch[0]);
        }
      } catch (e) {
        console.error('Failed to parse task JSON:', e);
      }
    }

    return NextResponse.json({ reply, isComplete, taskJson });
  } catch (err: any) {
    console.error('Interview error:', err);
    return NextResponse.json(
      { error: err.message || 'Ошибка AI', reply: 'Произошла ошибка при обращении к AI. Попробуйте ещё раз.', isComplete: false, taskJson: null },
      { status: 500 }
    );
  }
}
