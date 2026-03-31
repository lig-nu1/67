import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db';
import { getEmbedding } from '@/lib/openrouter';

// GET /api/tasks — fetch all tasks or by curator
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const curatorId = searchParams.get('curatorId');
    const status = searchParams.get('status');

    let query = dbAdmin
      .from('tasks')
      .select('*, curator:users!curator_id(name, email)')
      .order('created_at', { ascending: false });

    if (curatorId) query = query.eq('curator_id', curatorId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ tasks: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/tasks — create a new task
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { curator_id, title, description, location, event_date, volunteer_quota, hard_skills, soft_skills, raw_input } = body;

    if (!curator_id || !title || !description) {
      return NextResponse.json({ error: 'curator_id, title, description обязательны' }, { status: 400 });
    }

    // Generate embedding for the task
    const embeddingText = [title, description, ...(hard_skills || []), ...(soft_skills || [])].join(' ');
    let embedding: number[] | null = null;

    try {
      embedding = await getEmbedding(embeddingText);
    } catch (e) {
      console.error('Failed to generate task embedding:', e);
    }

    const { data: task, error } = await dbAdmin
      .from('tasks')
      .insert({
        curator_id,
        title,
        description,
        location,
        event_date,
        volunteer_quota: volunteer_quota || 1,
        hard_skills: hard_skills || [],
        soft_skills: soft_skills || [],
        raw_input: raw_input || '',
        embedding,
        status: 'open',
      })
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ task });
  } catch (err: any) {
    console.error('Create task error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
