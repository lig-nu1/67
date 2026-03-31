import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, role } = await req.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Все поля обязательны' }, { status: 400 });
    }
    if (!['curator', 'volunteer'].includes(role)) {
      return NextResponse.json({ error: 'Неверная роль' }, { status: 400 });
    }

    // Check existing user
    const { data: existing } = await dbAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 409 });
    }

    // Create user (simple auth — hashing omitted for MVP, use Supabase Auth in production)
    const { data: user, error } = await dbAdmin
      .from('users')
      .insert({ email, name, role, password_hash: password })
      .select('id, email, name, role')
      .single();

    if (error) throw error;

    // If volunteer, create empty profile
    if (role === 'volunteer') {
      await dbAdmin
        .from('volunteer_profiles')
        .insert({ user_id: user.id, bio: '', skills: [], interests: [], goals: '' });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error('Register error:', err);
    return NextResponse.json({ error: err.message || 'Ошибка сервера' }, { status: 500 });
  }
}
