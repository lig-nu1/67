import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 });
    }

    const { data: user, error } = await dbAdmin
      .from('users')
      .select('id, email, name, role, password_hash')
      .eq('email', email)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Simple password check (MVP — use proper hashing in production)
    if (user.password_hash !== password) {
      return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });
    }

    // Return user without password
    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: err.message || 'Ошибка сервера' }, { status: 500 });
  }
}
