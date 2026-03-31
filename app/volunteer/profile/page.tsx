'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import {
  Loader2,
  Save,
  Plus,
  X,
  User,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

function ProfileContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [goals, setGoals] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'volunteer') {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/volunteers?userId=${user.id}`);
        const data = await res.json();
        if (data.profile) {
          setBio(data.profile.bio || '');
          setSkills(data.profile.skills || []);
          setInterests(data.profile.interests || []);
          setGoals(data.profile.goals || '');
        }
      } catch {} finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, router]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/volunteers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          bio,
          skills,
          interests,
          goals,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Ошибка сохранения');
      }
    } catch {
      alert('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  };

  const addInterest = () => {
    const trimmed = interestInput.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
      setInterestInput('');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-sun-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold gradient-text mb-1">Мой профиль</h1>
          <p className="text-gray-500 text-sm">Заполните профиль — AI подберёт лучшие задачи для вас</p>
        </div>

        <div className="glass-card p-6 space-y-6 animate-slide-up">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center">
              <User className="w-8 h-8 text-midnight-950" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{user?.name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">О себе</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input-field min-h-[100px] resize-y"
              placeholder="Расскажите о себе, вашем опыте и мотивации..."
            />
          </div>

          {/* Skills */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Навыки (Hard Skills)</label>
            <div className="flex gap-2 mb-2">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="input-field flex-1"
                placeholder="Например: SMM, фотография, организация мероприятий"
              />
              <button onClick={addSkill} className="btn-secondary !px-3">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((s, i) => (
                <span key={i} className="tag-pill flex items-center gap-1">
                  {s}
                  <button onClick={() => setSkills(skills.filter((_, j) => j !== i))} className="hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Интересы</label>
            <div className="flex gap-2 mb-2">
              <input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                className="input-field flex-1"
                placeholder="Например: экология, образование, спорт"
              />
              <button onClick={addInterest} className="btn-secondary !px-3">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {interests.map((s, i) => (
                <span key={i} className="tag-pill !bg-purple-500/15 !text-purple-300 !border-purple-500/20 flex items-center gap-1">
                  {s}
                  <button onClick={() => setInterests(interests.filter((_, j) => j !== i))} className="hover:text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div>
            <label className="text-sm text-gray-400 mb-1.5 block">Цели волонтёрства</label>
            <textarea
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="input-field min-h-[80px] resize-y"
              placeholder="Чего вы хотите достичь через волонтёрство?"
            />
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {saving ? 'Сохранение...' : 'Сохранить профиль'}
            </button>

            {saved && (
              <span className="flex items-center gap-1 text-sm text-emerald-400 animate-fade-in">
                <CheckCircle className="w-4 h-4" />
                Сохранено! Embedding обновлён.
              </span>
            )}
          </div>

          {/* AI hint */}
          <div className="p-4 rounded-xl bg-sun-500/5 border border-sun-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-sun-400" />
              <span className="text-xs font-semibold text-sun-400">Как это работает?</span>
            </div>
            <p className="text-xs text-gray-400">
              При сохранении профиля AI создаёт векторное представление (embedding) ваших навыков. 
              Это позволяет семантически сопоставлять вас с задачами — не по ключевым словам, 
              а по смыслу.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VolunteerProfilePage() {
  return (
    <AuthProvider>
      <ProfileContent />
    </AuthProvider>
  );
}
