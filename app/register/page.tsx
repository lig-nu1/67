'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sun, Mail, Lock, User, Loader2, Users, ClipboardList } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'curator' | 'volunteer' | ''>('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) { setError('Выберите роль'); return; }
    setError('');
    setLoading(true);
    try {
      await register(email, password, name, role);
      router.push(role === 'curator' ? '/curator/dashboard' : '/volunteer/profile');
    } catch (err: any) {
      setError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container flex items-center justify-center min-h-screen">
      <div className="absolute top-10 right-10 w-64 h-64 bg-sun-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-sun-600/5 rounded-full blur-3xl" />

      <div className="w-full max-w-md mx-4 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-bg mb-4 animate-pulse-glow">
            <Sun className="w-7 h-7 text-midnight-950" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Регистрация</h1>
          <p className="text-gray-500">Присоединяйтесь к Sun Proactive</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Имя</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field !pl-10"
                placeholder="Ваше имя"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field !pl-10"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field !pl-10"
                placeholder="••••••••"
                minLength={6}
                required
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="text-sm text-gray-400 mb-3 block">Выберите роль</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('curator')}
                className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                  role === 'curator'
                    ? 'border-sun-500/50 bg-sun-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <ClipboardList className={`w-5 h-5 mb-2 ${role === 'curator' ? 'text-sun-400' : 'text-gray-500'}`} />
                <p className={`text-sm font-semibold ${role === 'curator' ? 'text-sun-400' : 'text-gray-300'}`}>Куратор</p>
                <p className="text-[10px] text-gray-500 mt-1">Создаю задачи</p>
              </button>
              <button
                type="button"
                onClick={() => setRole('volunteer')}
                className={`p-4 rounded-xl border transition-all duration-300 text-left ${
                  role === 'volunteer'
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <Users className={`w-5 h-5 mb-2 ${role === 'volunteer' ? 'text-emerald-400' : 'text-gray-500'}`} />
                <p className={`text-sm font-semibold ${role === 'volunteer' ? 'text-emerald-400' : 'text-gray-300'}`}>Волонтёр</p>
                <p className="text-[10px] text-gray-500 mt-1">Выполняю задачи</p>
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading || !role} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Зарегистрироваться'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-sun-400 hover:text-sun-300 transition-colors">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthProvider>
      <RegisterForm />
    </AuthProvider>
  );
}
