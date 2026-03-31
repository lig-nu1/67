import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db';
import { chatCompletion } from '@/lib/openrouter';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { application_id, photo_url } = body;

    if (!application_id || !photo_url) {
      return NextResponse.json({ error: 'application_id и photo_url обязательны' }, { status: 400 });
    }

    // 1. Получаем данные заявки и задачи
    const { data: application, error: appError } = await dbAdmin
      .from('applications')
      .select('*, tasks(*)')
      .eq('id', application_id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
    }

    const task = application.tasks;
    if (!task) {
      return NextResponse.json({ error: 'Задача не найдена' }, { status: 404 });
    }

    // 2. Формируем запрос к Vision API
    const systemPrompt = `Вы — ИИ-аудитор социальной платформы волонтеров. Ваш задача — проверить, выполнил ли волонтер задачу на основе фото и описания задачи.
Сравните фото с названием и описанием задачи.
Проверьте, доказывает ли фото выполнение (например, если задача "Уборка парка", на фото должен быть чистый парк или мешки с мусором).

Ответьте ТОЛЬКО в формате JSON:
{
  "verdict": "approved" (если выполнено) или "rejected" (если не выполнено или фото не по теме),
  "comment": "Краткое пояснение вердикта на русском языке."
}`;

    const userMessage = {
      role: 'user' as const,
      content: [
        { type: 'text', text: `Задача: ${task.title}\nОписание: ${task.description}` },
        { type: 'image_url', image_url: { url: photo_url } }
      ]
    };

    // 3. Вызываем OpenRouter (используем Gemini Flash или GPT-4o-mini для скорости и цены)
    const aiResponse = await chatCompletion([
      { role: 'system', content: systemPrompt },
      userMessage
    ], {
      model: 'google/gemini-2.0-flash-001', // Оптимально для Vision
      temperature: 0.1,
    });

    // Очищаем ответ от markdown-блоков, если они есть
    const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    let result;
    try {
      result = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse AI response:', aiResponse);
      return NextResponse.json({ error: 'Ошибка разбора ответа ИИ' }, { status: 500 });
    }

    // 4. Обновляем статус в базе данных
    const { data: updatedApp, error: updateError } = await dbAdmin
      .from('applications')
      .update({
        photo_url,
        verification_verdict: result.verdict,
        verification_comment: result.comment,
        status: result.verdict === 'approved' ? 'completed' : 'rejected'
      })
      .eq('id', application_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      verdict: result.verdict, 
      comment: result.comment,
      application: updatedApp 
    });

  } catch (err: any) {
    console.error('Verification error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
