'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  Loader2,
  Calendar,
  MapPin,
  Users,
  ChevronRight,
  ClipboardList,
  BarChart3,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string;
  volunteer_quota: number;
  status: string;
  created_at: string;
}

function CuratorDashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [appCounts, setAppCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'curator') {
      router.push('/login');
      return;
    }

    const fetchTasks = async () => {
      try {
        const res = await fetch(`/api/tasks?curatorId=${user.id}`);
        const data = await res.json();
        setTasks(data.tasks || []);

        // Fetch application counts for each task
        const counts: Record<string, number> = {};
        for (const task of data.tasks || []) {
          const appRes = await fetch(`/api/applications?taskId=${task.id}`);
          const appData = await appRes.json();
          counts[task.id] = (appData.applications || []).filter((a: any) => a.status === 'approved').length;
        }
        setAppCounts(counts);
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="tag-pill !bg-emerald-500/15 !text-emerald-300 !border-emerald-500/20">Открыта</span>;
      case 'closed':
        return <span className="tag-pill !bg-gray-500/15 !text-gray-300 !border-gray-500/20">Закрыта</span>;
      case 'completed':
        return <span className="tag-pill !bg-blue-500/15 !text-blue-300 !border-blue-500/20">Завершена</span>;
      default:
        return null;
    }
  };

  return (
    <div className="page-container">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-1">Панель куратора</h1>
            <p className="text-gray-500">Управляйте задачами и волонтёрами</p>
          </div>
          <Link href="/curator/create-task" className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Создать задачу
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: ClipboardList, label: 'Всего задач', value: tasks.length, color: 'text-sun-400' },
            { icon: BarChart3, label: 'Открытых', value: tasks.filter(t => t.status === 'open').length, color: 'text-emerald-400' },
            { icon: Users, label: 'Принято волонтёров', value: Object.values(appCounts).reduce((a, b) => a + b, 0), color: 'text-blue-400' },
            { icon: Calendar, label: 'Ближайшие', value: tasks.filter(t => new Date(t.event_date) > new Date()).length, color: 'text-purple-400' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-4 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tasks table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-sun-400 animate-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-20 glass-card animate-fade-in">
            <ClipboardList className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">Нет задач</h2>
            <p className="text-gray-600 mb-6">Создайте первую задачу с помощью AI интервьюера</p>
            <Link href="/curator/create-task" className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-5 h-5" /> Создать задачу
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task, i) => (
              <Link
                key={task.id}
                href={`/curator/task/${task.id}`}
                className="glass-card glass-card-hover p-5 flex items-center justify-between animate-slide-up block"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-semibold text-white truncate">{task.title}</h3>
                    {getStatusBadge(task.status)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {task.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formatDate(task.event_date)}
                      </span>
                    )}
                    {task.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {task.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {appCounts[task.id] || 0}/{task.volunteer_quota}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CuratorDashboard() {
  return (
    <AuthProvider>
      <CuratorDashboardContent />
    </AuthProvider>
  );
}
