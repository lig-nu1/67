'use client';

import React, { useState } from 'react';
import { Bot, CheckCircle2, XCircle, Image as ImageIcon, Loader2, Sparkles, Send, Camera } from 'lucide-react';

interface VerificationCardProps {
  applicationId: string;
  taskTitle: string;
  onVerified?: (data: any) => void;
}

export default function VerificationCard({ applicationId, taskTitle, onVerified }: VerificationCardProps) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ verdict: 'approved' | 'rejected'; comment: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify(base64?: string) {
    const finalPhotoBase64 = base64;
    
    if (!photoUrl && !finalPhotoBase64) {
      setError('Пожалуйста, загрузите фото или укажите ссылку');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const resp = await fetch('/api/ai/verify-photo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId: applicationId,
          photoUrl: photoUrl || null,
          photoBase64: finalPhotoBase64 || null,
          taskDescription: taskTitle,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Ошибка верификации');

      setResult({
        verdict: data.verdict,
        comment: data.comment,
      });
      
      if (onVerified) onVerified(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      handleVerify(base64String);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-gray-900/40 p-6 backdrop-blur-md shadow-2xl transition-all hover:shadow-sun-900/10 animate-fade-in group">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-sun-500/20 flex items-center justify-center border border-sun-500/30 group-hover:bg-sun-500/30 transition-colors">
          <Bot className="w-5 h-5 text-sun-400" />
        </div>
        <div>
          <h3 className="font-bold text-gray-100 uppercase tracking-wider text-sm">AI Verification Center</h3>
          <p className="text-xs text-gray-400">Автоматическая проверка результата задачи</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white/5 rounded-xl px-4 py-3 border border-white/10 group-focus-within:border-sun-500/30 transition-all">
          <label className="text-[10px] uppercase font-bold text-sun-400/80 mb-1 block">Task Verification Target</label>
          <div className="text-sm font-medium text-gray-200">{taskTitle}</div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-300 ml-1">Photo Evidence</label>
          <div className="flex gap-2">
            <div className="relative group/input flex-1">
              <input
                type="text"
                placeholder="Вставьте ссылку на фото..."
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                disabled={loading || !!result}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-11 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-sun-500/40 focus:border-sun-500/50 transition-all disabled:opacity-50"
              />
              <ImageIcon className="absolute left-4 top-3.5 w-4 h-4 text-gray-500 group-focus-within/input:text-sun-400 transition-colors" />
            </div>
            
            <button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={loading || !!result}
              className="px-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-gray-400 hover:text-sun-400 transition-all flex items-center justify-center shrink-0"
              title="Загрузить файл"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input 
              id="file-upload"
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="hidden" 
            />
          </div>
          <p className="text-[10px] text-gray-500 ml-1 italic">Подскажите: вставьте ссылку на фото или загрузите файл напрямую</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}

        {result ? (
          <div className={`mt-6 p-4 rounded-xl border animate-scale-in ${
            result.verdict === 'approved' 
              ? 'bg-emerald-500/10 border-emerald-500/20' 
              : 'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {result.verdict === 'approved' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <span className={`text-sm font-bold uppercase tracking-widest ${
                  result.verdict === 'approved' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {result.verdict === 'approved' ? 'VERIFIED' : 'REJECTED'}
                </span>
              </div>
              <span className="text-[10px] text-gray-500 flex items-center gap-1 font-mono">
                <Sparkles className="w-3 h-3 text-sun-400" />
                AI-AUDITOR-v2.0
              </span>
            </div>
            
            <p className="text-sm text-gray-200 leading-relaxed mb-1">
              {result.comment}
            </p>
            
            {result.verdict === 'rejected' && (
              <button 
                onClick={() => setResult(null)}
                className="mt-3 text-[10px] font-bold text-amber-400/80 hover:text-amber-300 transition-colors uppercase flex items-center gap-1"
              >
                Повторить попытку
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => handleVerify()}
            disabled={loading || (!photoUrl && !loading)}
            className="w-full bg-sun-500 hover:bg-sun-400 disabled:bg-gray-700 disabled:opacity-50 text-gray-950 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-sun-600/10 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Анализ выполненной работы...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Отправить на верификацию</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
