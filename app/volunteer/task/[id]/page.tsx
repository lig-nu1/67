'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import RAGChat from '@/components/RAGChat';
import TrustCard from '@/components/TrustCard';
import { formatDate } from '@/lib/utils';
import {
  Loader2,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Send,
  Upload,
  CheckCircle,
  XCircle,
  Camera,
  Bot,
} from 'lucide-react';

function TaskDetailContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id as string;

  const [task, setTask] = useState<any>(null);
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'volunteer') {
      router.push('/login');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch all tasks and find this one
        const tasksRes = await fetch('/api/tasks');
        const tasksData = await tasksRes.json();
        const found = (tasksData.tasks || []).find((t: any) => t.id === taskId);
        if (found) setTask(found);

        // Check if already applied
        const appRes = await fetch(`/api/applications?volunteerId=${user.id}&taskId=${taskId}`);
        const appData = await appRes.json();
        const myApp = (appData.applications || []).find(
          (a: any) => a.task_id === taskId && a.volunteer_id === user.id
        );
        if (myApp) {
          setApplication(myApp);
          if (myApp.verification_verdict) {
            setVerification({
              verdict: myApp.verification_verdict,
              comment: myApp.verification_comment,
            });
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, router, taskId]);

  const handleApply = async () => {
    if (!user || !task) return;
    setApplying(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_id: taskId,
          volunteer_id: user.id,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setApplication(data.application);
      } else {
        alert(data.error || 'Ошибка подачи заявки');
      }
    } catch {
      alert('Ошибка сети');
    } finally {
      setApplying(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !application || !task) return;

    setUploading(true);
    setVerifying(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];

        // Call verification API
        const res = await fetch('/api/ai/verify-photo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId: application.id,
            photoBase64: base64,
            taskDescription: task.description,
          }),
        });
        const result = await res.json();
        setVerification(result);
        setVerifying(false);
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setVerifying(false);
      setUploading(false);
      alert('Ошибка загрузки фото');
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button
          onClick={() => router.push('/volunteer/tasks')}
          className="flex items-center gap-2 text-gray-500 hover:text-sun-400 text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Назад к задачам
        </button>

        {/* Task Header */}
        <div className="glass-card p-6 mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-white mb-3">{task.title}</h1>
          <p className="text-gray-400 text-sm mb-4 leading-relaxed">{task.description}</p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4">
            {task.location && (
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {task.location}</span>
            )}
            {task.event_date && (
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {formatDate(task.event_date)}</span>
            )}
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {task.volunteer_quota} чел.</span>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {task.hard_skills?.map((s: string, i: number) => (
              <span key={i} className="tag-pill">{s}</span>
            ))}
            {task.soft_skills?.map((s: string, i: number) => (
              <span key={i} className="tag-pill !bg-purple-500/15 !text-purple-300 !border-purple-500/20">{s}</span>
            ))}
          </div>

          {/* Apply button */}
          {!application ? (
            <button
              onClick={handleApply}
              disabled={applying}
              className="btn-primary flex items-center gap-2"
            >
              {applying ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
              {applying ? 'Отправка...' : 'Откликнуться'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className={`p-3 rounded-lg border flex items-center gap-2 ${
                application.status === 'approved'
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : application.status === 'rejected'
                    ? 'bg-red-500/10 border-red-500/20'
                    : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                {application.status === 'approved' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : application.status === 'rejected' ? (
                  <XCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                )}
                <span className={`text-sm font-medium ${
                  application.status === 'approved' ? 'text-emerald-300' :
                  application.status === 'rejected' ? 'text-red-300' : 'text-amber-300'
                }`}>
                  {application.status === 'approved' ? 'Заявка принята!' :
                   application.status === 'rejected' ? 'Заявка отклонена' : 'Заявка на рассмотрении'}
                </span>
              </div>

              {/* Contact Curator (only when approved) */}
              {application.status === 'approved' && (
                <div className="glass-card p-5 animate-slide-up">
                  <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                    <Send className="w-4 h-4 text-sun-400" />
                    Связаться с куратором
                  </h3>
                  <p className="text-xs text-gray-400 mb-4">
                    Ваша заявка одобрена! Теперь вы можете связаться с куратором для уточнения деталей.
                  </p>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <p className="text-xs text-gray-500">Куратор:</p>
                      <p className="text-sm font-medium text-white">{task.curator?.name || 'Загрузка...'}</p>
                    </div>
                    <a 
                      href={`mailto:${task.curator?.email}`}
                      className="btn-primary !px-4 !py-2 text-xs flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Написать
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RAG Chat Widget */}
      <RAGChat taskId={taskId} />
    </div>
  );
}

export default function VolunteerTaskPage() {
  return (
    <AuthProvider>
      <TaskDetailContent />
    </AuthProvider>
  );
}
