import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/openrouter';
import { dbAdmin } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { applicationId, photoBase64, taskDescription } = await req.json();

    if (!photoBase64 || !taskDescription) {
      return NextResponse.json({ error: 'Фото и описание задачи обязательны' }, { status: 400 });
    }

    const prompt = `
Ты — верификатор выполненной волонтёрской задачи.

Описание задачи: "${taskDescription}"

Проанализируй прикреплённое фото и определи:
1. Соответствует ли фото описанию задачи?
2. Есть ли признаки выполненной работы?

Верни СТРОГО JSON (без лишнего текста):
{
  "verdict": "approved" или "rejected",
  "comment": "краткое объяснение решения на русском языке (1-2 предложения)"
}
    `.trim();

    const reply = await chatCompletion([{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${photoBase64}` } },
      ],
    }], {
      model: 'google/gemini-2.5-flash',
      temperature: 0.1,
    });

    // Parse JSON from response
    const jsonMatch = reply.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ verdict: 'rejected', comment: 'Не удалось обработать фото.' });
    }

    const result = JSON.parse(jsonMatch[0]);

    // Update DB if applicationId provided
    if (applicationId) {
      await dbAdmin
        .from('applications')
        .update({
          verification_verdict: result.verdict,
          verification_comment: result.comment,
        })
        .eq('id', applicationId);
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Verify photo error:', err);
    return NextResponse.json({ error: err.message || 'Ошибка верификации' }, { status: 500 });
  }
}
