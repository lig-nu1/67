'use client';

import React, { useEffect, useState } from 'react';
import { Bot, Calendar, Users, Sparkles, Loader2, Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { formatDate } from '@/lib/utils';

export default function AIManagerPage() {
  return (
    <AIManagerContent />
  );
}

function AIManagerContent() {
  const { user, loading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recruitingTaskId, setRecruitingTaskId] = useState<string | null>(null);

  async function fetchUrgentTasks() {
    setLoading(true);
    try {
      const resp = await fetch(`/api/tasks?curatorId=${user!.id}&status=open`);
      const data = await resp.json();
      setTasks(data.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading || !user) return;
    fetchUrgentTasks();
  }, [user, authLoading]);

  async function triggerRecruitment(taskId: string) {
    setRecruitingTaskId(taskId);
    try {
      const resp = await fetch('/api/cron/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, curatorId: user?.id }) 
      });
      const data = await resp.json();
      if (resp.ok) {
        alert(`AI Manager: Отправлено ${data.notified} персонализированных приглашений.`);
      } else {
        alert(data.error || 'Ошибка при запуске');
      }
    } catch (err) {
      alert('Ошибка при запуске поиска');
    } finally {
      setRecruitingTaskId(null);
    }
  }

  if (authLoading || !user) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-sun-400" /></div>;

  return (
    <div className="page-container">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-10 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold gradient-text flex items-center gap-3">
              <Bot className="w-10 h-10 text-sun-400" />
              Autonomous AI-Manager
            </h1>
            <p className="text-gray-400 mt-2">Проактивный подбор волонтеров и управление дедлайнами без участия куратора</p>
          </div>
          <button 
            onClick={fetchUrgentTasks}
            className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-sun-400"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 border-sun-500/20 bg-sun-500/5">
              <h3 className="text-sm font-bold text-sun-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Service Status
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Background Worker</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    ACTIVE
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Recall Logic</span>
                  <span className="text-xs font-bold text-gray-200">24h Deadline</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Semantic Engine</span>
                  <span className="text-xs font-bold text-sun-400">Gemini-2.0-Flash</span>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 border-blue-500/20">
              <h4 className="text-xs font-bold text-blue-400 uppercase mb-3">AI Engine Strategy</h4>
              <p className="text-xs text-gray-400 leading-relaxed italic">
                "Система анализирует свободные ресурсы и ищет совпадения по векторам био и навыков. При обнаружении 'горящей' вакансии менее чем за 24 часа — отправляется персонализированное уведомление с аргументацией, почему именно этот человек нам нужен."
              </p>
            </div>
          </div>

          {/* Task Monitor */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-white mb-2 ml-1">Мониторинг задач</h2>
            {loading ? (
              <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-sun-400" /></div>
            ) : tasks.length === 0 ? (
              <div className="glass-card p-20 text-center text-gray-500">Задач не найдено</div>
            ) : (
              tasks.map((task: any, idx: number) => {
                const deadline = new Date(task.event_date);
                const now = new Date();
                const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
                const isUrgent = diffHours < 48 && diffHours > 0;
                
                return (
                  <div 
                    key={task.id} 
                    className={`glass-card p-5 transition-all hover:border-white/20 animate-slide-up`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-white">{task.title}</h3>
                          {isUrgent && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> URGENT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {formatDate(task.event_date)}</span>
                          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {task.volunteer_quota} чел.</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => triggerRecruitment(task.id)}
                        disabled={recruitingTaskId === task.id}
                        className={`btn-primary !px-5 !py-2.5 !rounded-lg text-sm flex items-center gap-2 ${recruitingTaskId === task.id ? 'opacity-50' : ''}`}
                      >
                        {recruitingTaskId === task.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        <span>{recruitingTaskId === task.id ? 'Поиск...' : 'Run Smart Pick'}</span>
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Bot className="w-3.5 h-3.5 text-sun-500" />
                        <span>AI-Manager Progress:</span>
                        <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-sun-500 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="text-sun-400 font-bold">45% filled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-gray-500">Waitlisted: 3 volunteers</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
