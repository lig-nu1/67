import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db';
import { getEmbedding } from '@/lib/openrouter';

// GET /api/volunteers?userId=xxx — get volunteer profile
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId обязателен' }, { status: 400 });
    }

    const { data: profile, error } = await dbAdmin
      .from('volunteer_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return NextResponse.json({ profile });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/volunteers — update volunteer profile + regenerate embedding
export async function PUT(req: NextRequest) {
  try {
    const { userId, bio, skills, interests, goals } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId обязателен' }, { status: 400 });
    }

    // Generate embedding from profile data
    const embeddingText = [bio, ...(skills || []), ...(interests || []), goals].filter(Boolean).join(' ');
    let embedding: number[] | null = null;

    try {
      embedding = await getEmbedding(embeddingText);
    } catch (e) {
      console.error('Failed to generate volunteer embedding:', e);
    }

    const { data: profile, error } = await dbAdmin
      .from('volunteer_profiles')
      .update({
        bio,
        skills: skills || [],
        interests: interests || [],
        goals,
        embedding,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) throw error;

    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error('Update volunteer error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
