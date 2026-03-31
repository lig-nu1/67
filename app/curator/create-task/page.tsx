'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import InterviewChat from '@/components/InterviewChat';
import { Loader2 } from 'lucide-react';

function CreateTaskContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleTaskComplete = async (taskJson: any) => {
    if (!user) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          curator_id: user.id,
          ...taskJson,
          raw_input: JSON.stringify(taskJson),
        }),
      });
      const data = await res.json();
      if (res.ok && data.task) {
        router.push(`/curator/task/${data.task.id}`);
      } else {
        alert(data.error || 'Ошибка создания задачи');
      }
    } catch (err) {
      alert('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="page-container flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-sun-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold gradient-text mb-1">Создание задачи</h1>
          <p className="text-gray-500 text-sm">AI интервьюер поможет собрать все детали</p>
        </div>

        <div className="glass-card overflow-hidden">
          {saving ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-sun-400 animate-spin mb-4" />
              <p className="text-gray-400">Создаю задачу и генерирую embedding...</p>
            </div>
          ) : (
            <InterviewChat onTaskComplete={handleTaskComplete} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateTaskPage() {
  return (
    <AuthProvider>
      <CreateTaskContent />
    </AuthProvider>
  );
}
