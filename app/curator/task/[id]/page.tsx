'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import TrustCard from '@/components/TrustCard';
import { formatDate } from '@/lib/utils';
import {
  Loader2,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  User,
  ExternalLink,
  Bot,
  BrainCircuit,
} from 'lucide-react';

interface Application {
  id: string;
  volunteer_id: string;
  status: string;
  photo_url?: string;
  verification_verdict?: string;
  verification_comment?: string;
  match_score?: number;
  match_explanation?: string;
  created_at: string;
  users?: {
    name: string;
    email: string;
  }
}

export default function CuratorTaskDetailPage() {
  return (
    <TaskDetailContent />
  );
}

function TaskDetailContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchingResults, setMatchingResults] = useState<any[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  async function fetchData() {
    try {
      // 1. Fetch task
      const taskRes = await fetch(`/api/tasks`);
      const tasksData = await taskRes.json();
      const foundTask = (tasksData.tasks || []).find((t: any) => t.id === taskId);
      setTask(foundTask);

      // 2. Fetch applications
      const appRes = await fetch(`/api/applications?taskId=${taskId}`);
      const appsData = await appRes.json();
      setApplications(appsData.applications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'curator') {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user, authLoading, taskId]);

  async function updateAppStatus(appId: string, status: 'approved' | 'rejected') {
    try {
      const res = await fetch('/api/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, status }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      alert('Ошибка при обновлении статуса');
    }
  }

  async function runSmartMatch() {
    setMatchingLoading(true);
    setMatchingResults([]);
    try {
      const res = await fetch('/api/ai/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, curatorId: user?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setMatchingResults(data.matches || []);
      } else {
        alert(data.error || 'Ошибка при подборе');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setMatchingLoading(false);
    }
  }

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
        <div className="max-w-4xl mx-auto px-4 py-20 text-center text-gray-500">
          Задача не найдена
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/curator/dashboard')}
          className="flex items-center gap-2 text-gray-500 hover:text-sun-400 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад в дашборд
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 border-sun-500/10 animate-fade-in relative overflow-hidden">
               <div className="absolute top-0 right-0 w-24 h-24 bg-sun-500/5 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
               
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold text-white leading-tight">{task.title}</h1>
                <div className="flex gap-2">
                   {task.status === 'open' ? (
                     <span className="tag-pill !bg-emerald-500/20 !text-emerald-400 border-emerald-500/30">ОТКРЫТА</span>
                   ) : (
                     <span className="tag-pill !bg-gray-500/20 !text-gray-400 border-gray-500/30">{task.status.toUpperCase()}</span>
                   )}
                </div>
              </div>
              
              <p className="text-gray-400 mb-6 leading-relaxed whitespace-pre-wrap">{task.description}</p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6 py-4 border-y border-white/5">
                {task.location && (
                  <span className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sun-400" /> {task.location}
                  </span>
                )}
                {task.event_date && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sun-400" /> {formatDate(task.event_date)}
                  </span>
                )}
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-sun-400" /> Квота: {task.volunteer_quota} чел.
                </span>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Требуемые компетенции</h3>
                <div className="flex flex-wrap gap-2">
                  {task.hard_skills?.map((skill: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-sun-500/10 text-sun-400 text-xs font-medium border border-sun-500/20">{skill}</span>
                  ))}
                  {task.soft_skills?.map((skill: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-medium border border-indigo-500/20">{skill}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 ml-1">Отклики ({applications.length})</h2>
              {applications.length === 0 ? (
                <div className="glass-card p-12 text-center text-gray-500 italic">Нет откликов</div>
              ) : (
                applications.map((app, i) => (
                  <div key={app.id} className="glass-card p-5 animate-slide-up group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-sun-500/10 flex items-center justify-center border border-sun-500/20"><User className="w-5 h-5 text-sun-400" /></div>
                        <div>
                          <h4 className="font-bold text-white group-hover:text-sun-400 transition-colors">
                            {app.users?.name || 'Без имени'}
                          </h4>
                          <p className="text-xs text-gray-500">{app.users?.email || 'Без email'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {app.status === 'pending' ? (
                          <><button onClick={() => updateAppStatus(app.id, 'approved')} className="text-emerald-400 hover:scale-110"><CheckCircle className="w-5 h-5" /></button><button onClick={() => updateAppStatus(app.id, 'rejected')} className="text-red-500 hover:scale-110"><XCircle className="w-5 h-5" /></button></>
                        ) : (<span className="tag-pill text-xs px-2 py-0.5 uppercase tracking-tighter">{app.status}</span>)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 border-indigo-500/20 bg-indigo-500/5 group">
              <div className="flex items-center gap-3 mb-6"><Sparkles className="w-5 h-5 text-indigo-400" /><h3 className="font-bold text-white text-sm uppercase tracking-wider">Smart Matching</h3></div>
              <button
                onClick={runSmartMatch}
                disabled={matchingLoading}
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
              >
                {matchingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Run Smart Pick
              </button>
              {matchingResults.length > 0 && (
                <div className="mt-8 space-y-4 animate-fade-in">
                  {matchingResults.map((match, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-white/5 border border-white/5 space-y-1">
                      <div className="flex justify-betweenItems justify-between"><span className="text-xs font-bold text-white truncate max-w-[120px]">{match.name}</span><span className="text-[10px] text-emerald-400">{Math.round(match.similarity * 100)}%</span></div>
                      <p className="text-[10px] text-gray-400 leading-relaxed italic border-l-2 border-indigo-500/30 pl-2">{match.explanation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
