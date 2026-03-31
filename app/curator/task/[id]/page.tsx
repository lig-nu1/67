'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import TrustCard from '@/components/TrustCard';
import { formatDate } from '@/lib/utils';
import {
  Loader2,
  Calendar,
  MapPin,
  Users,
  ArrowLeft,
  UserCheck,
  UserX,
  Bot,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  volunteer_quota: number;
  hard_skills: string[];
  soft_skills: string[];
  status: string;
}

interface MatchedVolunteer {
  user_id: string;
  name: string;
  email: string;
  bio: string;
  skills: string[];
  similarity: number;
  explanation: string;
}

interface Application {
  id: string;
  volunteer_id: string;
  match_score: number;
  match_explanation: string;
  status: string;
  photo_url: string;
  verification_verdict: string;
  verification_comment: string;
  users?: { name: string; email: string };
}

function TaskDetailContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [matches, setMatches] = useState<MatchedVolunteer[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchLoading, setMatchLoading] = useState(false);
  const [tab, setTab] = useState<'info' | 'matches' | 'applications'>('info');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'curator') {
      router.push('/login');
      return;
    }

    const fetchTask = async () => {
      try {
        const res = await fetch(`/api/tasks?curatorId=${user.id}`);
        const data = await res.json();
        const found = (data.tasks || []).find((t: Task) => t.id === taskId);
        if (found) setTask(found);

        // Fetch applications
        const appRes = await fetch(`/api/applications?taskId=${taskId}`);
        const appData = await appRes.json();
        setApplications(appData.applications || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTask();
  }, [user, authLoading, router, taskId]);

  const loadMatches = async () => {
    setMatchLoading(true);
    try {
      const res = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      const data = await res.json();
      setMatches(data.matches || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMatchLoading(false);
    }
  };

  const handleApplicationAction = async (appId: string, status: 'approved' | 'rejected') => {
    try {
      await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, status }),
      });
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, status } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-sun-400 animate-spin" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="page-container">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-400">Задача не найдена</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <button
          onClick={() => router.push('/curator/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-sun-400 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к панели
        </button>

        {/* Task header */}
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-white mb-3">{task.title}</h1>
          <p className="text-gray-400 text-sm mb-4">{task.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
            {task.location && (
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {task.location}</span>
            )}
            {task.event_date && (
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {formatDate(task.event_date)}</span>
            )}
            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {task.volunteer_quota} чел.</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {task.hard_skills?.map((s, i) => (
              <span key={i} className="tag-pill">{s}</span>
            ))}
            {task.soft_skills?.map((s, i) => (
              <span key={i} className="tag-pill !bg-purple-500/15 !text-purple-300 !border-purple-500/20">{s}</span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'info', label: 'Информация' },
            { key: 'matches', label: 'AI Мэтчи' },
            { key: 'applications', label: `Заявки (${applications.length})` },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key as any);
                if (t.key === 'matches' && matches.length === 0) loadMatches();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-sun-500/20 text-sun-400 border border-sun-500/30'
                  : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'info' && (
          <div className="glass-card p-6 animate-fade-in">
            <h2 className="text-lg font-semibold text-white mb-4">Подробности задачи</h2>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500">Статус:</span> <span className="ml-2 text-white">{task.status}</span></div>
              <div><span className="text-gray-500">Описание:</span> <p className="mt-1 text-gray-300">{task.description}</p></div>
              <div><span className="text-gray-500">Локация:</span> <span className="ml-2 text-gray-300">{task.location || '—'}</span></div>
              <div><span className="text-gray-500">Дата:</span> <span className="ml-2 text-gray-300">{formatDate(task.event_date)}</span></div>
              <div><span className="text-gray-500">Квота:</span> <span className="ml-2 text-sun-400 font-bold">{task.volunteer_quota}</span></div>
            </div>
          </div>
        )}

        {tab === 'matches' && (
          <div className="space-y-4 animate-fade-in">
            {matchLoading ? (
              <div className="flex flex-col items-center py-20 glass-card">
                <Loader2 className="w-8 h-8 text-sun-400 animate-spin mb-4" />
                <p className="text-gray-400 text-sm">AI ищет подходящих волонтёров...</p>
                <p className="text-gray-600 text-xs mt-1">Генерируем объяснения для каждого мэтча</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Bot className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">Нет подходящих волонтёров</p>
                <p className="text-gray-600 text-xs mt-1">Волонтёры должны заполнить профиль с навыками</p>
              </div>
            ) : (
              matches.map((vol, i) => (
                <div key={vol.user_id} className="glass-card p-5 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">{vol.name}</h3>
                      <p className="text-xs text-gray-500">{vol.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-sun-400" />
                      <span className={`text-lg font-bold ${
                        vol.similarity >= 0.8 ? 'text-emerald-400' : vol.similarity >= 0.6 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {Math.round(vol.similarity * 100)}%
                      </span>
                    </div>
                  </div>

                  {vol.skills && vol.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {vol.skills.map((s, j) => (
                        <span key={j} className="tag-pill !text-[10px]">{s}</span>
                      ))}
                    </div>
                  )}

                  {vol.bio && (
                    <p className="text-xs text-gray-400 mb-3 line-clamp-2">{vol.bio}</p>
                  )}

                  <TrustCard score={vol.similarity} explanation={vol.explanation} />
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'applications' && (
          <div className="space-y-4 animate-fade-in">
            {applications.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">Пока нет заявок</p>
              </div>
            ) : (
              applications.map((app, i) => (
                <div key={app.id} className="glass-card p-5 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {(app as any).users?.name || 'Волонтёр'}
                      </h3>
                      <p className="text-xs text-gray-500">{(app as any).users?.email}</p>
                    </div>
                    <span className={`tag-pill ${
                      app.status === 'approved'
                        ? '!bg-emerald-500/15 !text-emerald-300 !border-emerald-500/20'
                        : app.status === 'rejected'
                          ? '!bg-red-500/15 !text-red-300 !border-red-500/20'
                          : ''
                    }`}>
                      {app.status === 'approved' ? 'Принят' : app.status === 'rejected' ? 'О�                  {/* Contact Volunteer (if approved) */}
                  {app.status === 'approved' && (
                    <div className="mt-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Контакт волонтёра:</p>
                        <p className="text-xs font-medium text-emerald-300">{(app as any).users?.email}</p>
                      </div>
                      <a 
                        href={`mailto:${(app as any).users?.email}`}
                        className="btn-primary !px-3 !py-1.5 text-[10px] flex items-center gap-1.5"
                      >
                        <Send className="w-3 h-3" />
                        Написать
                      </a>
                    </div>
                  )}v>
                  )}

                  {app.photo_url && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Фото загружено
                    </div>
                  )}

                  {/* Action buttons */}
                  {app.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleApplicationAction(app.id, 'approved')}
                        className="btn-success flex items-center gap-1 !px-4 !py-2 text-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Принять
                      </button>
                      <button
                        onClick={() => handleApplicationAction(app.id, 'rejected')}
                        className="btn-danger flex items-center gap-1 !px-4 !py-2 text-xs"
                      >
                        <UserX className="w-3.5 h-3.5" /> Отклонить
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CuratorTaskPage() {
  return (
    <AuthProvider>
      <TaskDetailContent />
    </AuthProvider>
  );
}
