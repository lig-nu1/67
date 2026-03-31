'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import TrustCard from '@/components/TrustCard';
import { formatDate } from '@/lib/utils';
import { chatCompletion } from '@/lib/openrouter';
import {
  Loader2,
  Search,
  MapPin,
  Calendar,
  Users,
  Star,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

interface TaskWithScore {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  volunteer_quota: number;
  hard_skills: string[];
  soft_skills: string[];
  status: string;
  similarity?: number;
  explanation?: string;
}

function TasksContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<TaskWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'volunteer') {
      router.push('/login');
      return;
    }

    const fetchTasks = async () => {
      try {
        // Fetch all open tasks
        const res = await fetch('/api/tasks?status=open');
        const data = await res.json();
        const allTasks = data.tasks || [];

        // Fetch volunteer profile for matching
        const profRes = await fetch(`/api/volunteers?userId=${user.id}`);
        const profData = await profRes.json();
        const profile = profData.profile;

        if (profile?.embedding) {
          // Compute similarity on the client side (since we can't use pgvector from client)
          // We'll call a matching endpoint  
          const matchRes = await fetch('/api/ai/volunteer-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ volunteerId: user.id }),
          });
          
          if (matchRes.ok) {
            const matchData = await matchRes.json();
            const matchMap = new Map(
              (matchData.tasks || []).map((t: any) => [t.id, t])
            );
            
            const enriched = allTasks.map((task: TaskWithScore) => {
              const match = matchMap.get(task.id) as any;
              return {
                ...task,
                similarity: match?.similarity || 0,
                explanation: match?.explanation || '',
              };
            });
            
            enriched.sort((a: TaskWithScore, b: TaskWithScore) => (b.similarity || 0) - (a.similarity || 0));
            setTasks(enriched);
          } else {
            setTasks(allTasks);
          }
        } else {
          setTasks(allTasks);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-sun-400 animate-spin" />
      </div>
    );
  }

  const filtered = searchQuery
    ? tasks.filter(
        (t) =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : tasks;

  return (
    <div className="page-container">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold gradient-text mb-1">Найти задачи</h1>
            <p className="text-gray-500 text-sm">Задачи отсортированы по AI-совпадению с вашим профилем</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6 animate-slide-up">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field !pl-12"
            placeholder="Поиск по названию или описанию..."
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="w-8 h-8 text-sun-400 animate-spin mb-4" />
            <p className="text-gray-400 text-sm">Загружаем задачи и рассчитываем совпадения...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-8 text-center animate-fade-in">
            <Search className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400">Задачи не найдены</h3>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((task, i) => {
              const percent = Math.round((task.similarity || 0) * 100);
              return (
                <Link
                  key={task.id}
                  href={`/volunteer/task/${task.id}`}
                  className="glass-card glass-card-hover p-5 animate-slide-up block"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-semibold text-white leading-tight flex-1 pr-3">
                      {task.title}
                    </h3>
                    {percent > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="w-4 h-4 text-sun-400" />
                        <span className={`text-sm font-bold ${
                          percent >= 80 ? 'text-emerald-400' : percent >= 60 ? 'text-amber-400' : 'text-red-400'
                        }`}>
                          {percent}%
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-2 mb-3">{task.description}</p>

                  <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-gray-500">
                    {task.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {task.location}
                      </span>
                    )}
                    {task.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(task.event_date)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {task.volunteer_quota} чел.
                    </span>
                  </div>

                  {task.hard_skills && task.hard_skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {task.hard_skills.slice(0, 3).map((s, j) => (
                        <span key={j} className="tag-pill !text-[10px]">{s}</span>
                      ))}
                    </div>
                  )}

                  {/* Score bar */}
                  {percent > 0 && (
                    <div>
                      <div className="score-bar mb-1">
                        <div
                          className={`score-bar-fill ${
                            percent >= 80 ? 'bg-emerald-500' : percent >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      {task.explanation && (
                        <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-sun-400" />
                          {task.explanation.substring(0, 80)}...
                        </p>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VolunteerTasksPage() {
  return (
    <TasksContent />
  );
}
