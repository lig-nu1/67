'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import { formatDate } from '@/lib/utils';
import {
  Loader2,
  ClipboardList,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Star,
  User,
} from 'lucide-react';

function VolunteerDashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'volunteer') {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch applications
        const appRes = await fetch(`/api/applications?volunteerId=${user.id}`);
        const appData = await appRes.json();
        const apps = appData.applications || [];
        setApplications(apps);

        // Fetch task details for each application
        const allTasks = await fetch('/api/tasks');
        const allTasksData = await allTasks.json();
        const taskMap: Record<string, any> = {};
        for (const t of allTasksData.tasks || []) {
          taskMap[t.id] = t;
        }
        setTasks(taskMap);

        // Fetch profile
        const profRes = await fetch(`/api/volunteers?userId=${user.id}`);
        const profData = await profRes.json();
        setProfile(profData.profile);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-sun-400 animate-spin" />
      </div>
    );
  }

  const profileComplete = profile && profile.bio && profile.skills?.length > 0;

  return (
    <div className="page-container">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-3xl font-bold gradient-text mb-1">
            Привет, {user.name}! 👋
          </h1>
          <p className="text-gray-500">Ваша панель волонтёра</p>
        </div>

        {/* Profile alert */}
        {!profileComplete && (
          <div className="glass-card p-5 mb-6 border border-sun-500/30 animate-slide-up">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-sun-400" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-sun-400">Заполните профиль</h3>
                <p className="text-xs text-gray-400">Добавьте навыки, чтобы AI мог подбирать вам лучшие задачи</p>
              </div>
              <Link href="/volunteer/profile" className="btn-primary !px-4 !py-2 text-sm">
                Заполнить
              </Link>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: ClipboardList, label: 'Всего заявок', value: applications.length, color: 'text-sun-400' },
            { icon: Clock, label: 'Ожидают', value: applications.filter(a => a.status === 'pending').length, color: 'text-amber-400' },
            { icon: CheckCircle, label: 'Принятых', value: applications.filter(a => a.status === 'approved').length, color: 'text-emerald-400' },
            { icon: Star, label: 'Выполнено', value: applications.filter(a => a.verification_verdict === 'approved').length, color: 'text-blue-400' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-4 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Applications list */}
        <h2 className="text-lg font-semibold text-white mb-4">Мои заявки</h2>
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-sun-400 animate-spin" />
          </div>
        ) : applications.length === 0 ? (
          <div className="glass-card p-8 text-center animate-fade-in">
            <ClipboardList className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Нет заявок</h3>
            <p className="text-gray-600 mb-6 text-sm">Найдите подходящие задачи и подайте заявку</p>
            <Link href="/volunteer/tasks" className="btn-primary inline-flex items-center gap-2 text-sm">
              Найти задачи
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app, i) => {
              const task = tasks[app.task_id];
              return (
                <Link
                  key={app.id}
                  href={`/volunteer/task/${app.task_id}`}
                  className="glass-card glass-card-hover p-5 flex items-center justify-between block animate-slide-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-base font-semibold text-white truncate">
                      {task?.title || 'Задача'}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className={`flex items-center gap-1 ${
                        app.status === 'approved' ? 'text-emerald-400' : 
                        app.status === 'rejected' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {app.status === 'approved' ? <CheckCircle className="w-3 h-3" /> :
                         app.status === 'rejected' ? <XCircle className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
                        {app.status === 'approved' ? 'Принята' : app.status === 'rejected' ? 'Отклонена' : 'Ожидает'}
                      </span>
                      {task?.event_date && (
                        <span>{formatDate(task.event_date)}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VolunteerDashboard() {
  return (
    <AuthProvider>
      <VolunteerDashboardContent />
    </AuthProvider>
  );
}
