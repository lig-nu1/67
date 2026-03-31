'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, CheckCircle2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface TaskData {
  title: string;
  description: string;
  location: string;
  event_date: string;
  volunteer_quota: number;
  hard_skills: string[];
  soft_skills: string[];
}

interface InterviewChatProps {
  onTaskComplete: (task: TaskData) => void;
}

export default function InterviewChat({ onTaskComplete }: InterviewChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [taskJson, setTaskJson] = useState<TaskData | null>(null);
  const [started, setStarted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startInterview = async () => {
    setStarted(true);
    setLoading(true);
    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      });
      const data = await res.json();
      setMessages([{ role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages([{ role: 'assistant', content: 'Ошибка подключения к AI. Попробуйте позже.' }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();

      setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);

      if (data.isComplete && data.taskJson) {
        setTaskJson(data.taskJson);
      }
    } catch {
      setMessages([
        ...updatedMessages,
        { role: 'assistant', content: 'Произошла ошибка. Попробуйте ещё раз.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="w-20 h-20 rounded-2xl gradient-bg flex items-center justify-center mb-6 animate-float">
          <Bot className="w-10 h-10 text-midnight-950" />
        </div>
        <h2 className="text-2xl font-bold gradient-text mb-3">AI Интервьюер</h2>
        <p className="text-gray-400 text-center max-w-md mb-8">
          AI поможет вам создать чёткое описание задачи для волонтёров.
          Просто расскажите, что нужно сделать — AI задаст уточняющие вопросы.
        </p>
        <button onClick={startInterview} className="btn-primary text-lg px-8 py-4">
          Начать создание задачи
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-start gap-2 max-w-[80%]">
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-sun-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-sun-400" />
                </div>
              )}
              <div
                className={`chat-bubble ${
                  msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-midnight-700 flex items-center justify-center flex-shrink-0 mt-1">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="flex items-center gap-2 chat-bubble chat-bubble-ai">
              <Loader2 className="w-4 h-4 text-sun-400 animate-spin" />
              <span className="text-sm text-gray-400">AI думает...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Task Preview Card */}
      {taskJson && (
        <div className="mx-4 mb-4 glass-card p-6 animate-slide-up border-sun-500/30">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-emerald-400">Задача готова!</h3>
          </div>

          <div className="grid gap-3 text-sm mb-4">
            <div>
              <span className="text-gray-500">Название:</span>
              <span className="ml-2 text-white font-medium">{taskJson.title}</span>
            </div>
            <div>
              <span className="text-gray-500">Описание:</span>
              <p className="mt-1 text-gray-300">{taskJson.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-500">Локация:</span>
                <span className="ml-2 text-gray-300">{taskJson.location}</span>
              </div>
              <div>
                <span className="text-gray-500">Дата:</span>
                <span className="ml-2 text-gray-300">{taskJson.event_date}</span>
              </div>
            </div>
            <div>
              <span className="text-gray-500">Количество волонтёров:</span>
              <span className="ml-2 text-sun-400 font-bold">{taskJson.volunteer_quota}</span>
            </div>
            <div>
              <span className="text-gray-500">Hard Skills:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {taskJson.hard_skills.map((s, i) => (
                  <span key={i} className="tag-pill">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Soft Skills:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {taskJson.soft_skills.map((s, i) => (
                  <span key={i} className="tag-pill !bg-purple-500/15 !text-purple-300 !border-purple-500/20">{s}</span>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => onTaskComplete(taskJson)}
            className="btn-primary w-full"
          >
            Создать задачу
          </button>
        </div>
      )}

      {/* Input Area */}
      {!taskJson && (
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Опишите задачу..."
              rows={1}
              className="input-field resize-none flex-1"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="btn-primary !px-4 !py-3"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
