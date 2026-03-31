import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db';

// GET /api/applications?taskId=xxx&volunteerId=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('taskId');
    const volunteerId = searchParams.get('volunteerId');

    let query = dbAdmin
      .from('applications')
      .select('*, users!volunteer_id(name, email)')
      .order('match_score', { ascending: false });

    if (taskId) query = query.eq('task_id', taskId);
    if (volunteerId) query = query.eq('volunteer_id', volunteerId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ applications: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/applications — volunteer applies to task
export async function POST(req: NextRequest) {
  try {
    const { task_id, volunteer_id, match_score, match_explanation } = await req.json();

    if (!task_id || !volunteer_id) {
      return NextResponse.json({ error: 'task_id и volunteer_id обязательны' }, { status: 400 });
    }

    // Check if already applied
    const { data: existing } = await dbAdmin
      .from('applications')
      .select('id')
      .eq('task_id', task_id)
      .eq('volunteer_id', volunteer_id)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Вы уже подали заявку на эту задачу' }, { status: 409 });
    }

    const { data: application, error } = await dbAdmin
      .from('applications')
      .insert({
        task_id,
        volunteer_id,
        match_score: match_score || null,
        match_explanation: match_explanation || null,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ application });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/applications — update application status (approve/reject)
export async function PATCH(req: NextRequest) {
  try {
    const { applicationId, status, photo_url, verification_verdict, verification_comment } = await req.json();

    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId обязателен' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (status) updateData.status = status;
    if (photo_url) updateData.photo_url = photo_url;
    if (verification_verdict) updateData.verification_verdict = verification_verdict;
    if (verification_comment) updateData.verification_comment = verification_comment;

    const { data, error } = await dbAdmin
      .from('applications')
      .update(updateData)
      .eq('id', applicationId)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ application: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
