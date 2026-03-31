import { NextRequest, NextResponse } from 'next/server';
import { chatCompletion } from '@/lib/openrouter';
import { dbAdmin } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { applicationId, photoUrl, photoBase64, taskDescription } = await req.json();

    if (!photoUrl && !photoBase64) {
      return NextResponse.json({ error: 'Фото в формате URL или Base64 обязательно' }, { status: 400 });
    }

    const finalPhotoUrl = photoUrl || `data:image/jpeg;base64,${photoBase64}`;

    const systemPrompt = `Ты — ИИ-аудитор социальной платформы волонтеров. Твоя задача — проверить, выполнил ли волонтер задачу на основе фото и описания задачи.
Сравни фото с названием и описанием задачи.
Проверь, доказывает ли фото выполнение (например, если задача "Уборка парка", на фото должен быть чистый парк или мешки с мусором).

Ответь СТРОГО в формате JSON:
{
  "verdict": "approved" (если выполнено) или "rejected" (если не выполнено или фото не по теме),
  "comment": "Краткое пояснение вердикта на русском языке (1-2 предложения)."
}`;

    const userMessage = {
      role: 'user' as const,
      content: [
        { type: 'text', text: `Задача: ${taskDescription}` },
        { type: 'image_url', image_url: { url: finalPhotoUrl } }
      ]
    };

    // Используем Gemini 2.0 Flash для Vision (быстро и надежно)
    const aiResponse = await chatCompletion([
      { role: 'system', content: systemPrompt },
      userMessage
    ], {
      model: 'google/gemini-2.0-flash-001',
      temperature: 0.1,
    });

    // Извлекаем JSON из ответа (на случай, если модель добавила markdown)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ 
        verdict: 'rejected', 
        comment: 'ИИ не смог сформировать четкий отчет по фото. Попробуйте загрузить другое фото.' 
      });
    }

    const result = JSON.parse(jsonMatch[0]);

    // Обновляем статус в базе данных, если передан ID заявки
    if (applicationId) {
      const { data: updatedApp, error: updateError } = await dbAdmin
        .from('applications')
        .update({
          photo_url: finalPhotoUrl,
          verification_verdict: result.verdict,
          verification_comment: result.comment,
          status: result.verdict === 'approved' ? 'completed' : 'rejected'
        })
        .eq('id', applicationId)
        .select()
        .single();

      if (updateError) {
        console.error('Update app error:', updateError);
        // Не фатально для ответа пользователю, но стоит залогировать
      }
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Verify photo error:', err);
    return NextResponse.json({ error: err.message || 'Ошибка верификации' }, { status: 500 });
  }
}
