'use client';

import React from 'react';
import Link from 'next/link';
import { Sun, ArrowRight, Bot, Users, Shield, Sparkles, Zap, Eye } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="page-container">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-sun-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-sun-600/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="text-center animate-fade-in">
            {/* Logo */}
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center animate-pulse-glow">
                <Sun className="w-8 h-8 text-midnight-950" />
              </div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
              <span className="gradient-text">Sun Proactive</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-400 max-w-3xl mx-auto mb-4 font-light">
              AI-платформа для социального обмена задачами
            </p>
            <p className="text-base text-gray-500 max-w-2xl mx-auto mb-12">
              Умное сопоставление волонтёров и задач с помощью искусственного интеллекта.
              Семантический поиск, RAG-консультант, верификация через Computer Vision.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Начать работу
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/login" className="btn-secondary text-lg px-8 py-4">
                Войти в аккаунт
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl font-bold text-center mb-4 gradient-text">6 AI-модулей</h2>
        <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
          Каждый модуль использует реальные вызовы к OpenAI GPT-4o через OpenRouter API
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Bot,
              title: 'AI Интервьюер',
              desc: 'Многооборотный диалог для создания задачи. AI задаёт уточняющие вопросы и формирует структурированное описание.',
              color: 'from-amber-500/20 to-orange-500/20',
              border: 'border-amber-500/20',
            },
            {
              icon: Zap,
              title: 'Семантический Мэтчинг',
              desc: 'Vector embeddings + pgvector + cosine similarity. Находит лучших волонтёров для каждой задачи.',
              color: 'from-emerald-500/20 to-teal-500/20',
              border: 'border-emerald-500/20',
            },
            {
              icon: Eye,
              title: 'Explainable AI',
              desc: 'Каждое решение AI сопровождается объяснением. Trust UI показывает почему волонтёр подходит.',
              color: 'from-blue-500/20 to-cyan-500/20',
              border: 'border-blue-500/20',
            },
            {
              icon: Shield,
              title: 'RAG Консультант',
              desc: 'Отвечает ТОЛЬКО на основе описания задачи. Не галлюцинирует — если инфы нет, говорит об этом.',
              color: 'from-purple-500/20 to-pink-500/20',
              border: 'border-purple-500/20',
            },
            {
              icon: Users,
              title: 'Computer Vision',
              desc: 'GPT-4o Vision анализирует фото выполненной работы и автоматически верифицирует результат.',
              color: 'from-red-500/20 to-rose-500/20',
              border: 'border-red-500/20',
            },
            {
              icon: Sparkles,
              title: 'AI Менеджер',
              desc: 'Фоновый процесс: находит срочные задачи, подбирает волонтёров, отправляет персональные уведомления.',
              color: 'from-yellow-500/20 to-amber-500/20',
              border: 'border-yellow-500/20',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className={`glass-card glass-card-hover p-6 animate-slide-up border ${feature.border}`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h2 className="text-3xl font-bold text-center mb-16 gradient-text">Две роли</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="glass-card p-8 border border-sun-500/20 glass-card-hover">
            <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mb-6">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Куратор</h3>
            <p className="text-gray-400 mb-4">Организатор задач</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-sun-400" /> Создаёт задачи через AI интервьюер</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-sun-400" /> Видит AI-мэтчи с объяснениями</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-sun-400" /> Принимает/отклоняет заявки</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-sun-400" /> Просматривает верификацию фото</li>
            </ul>
          </div>

          <div className="glass-card p-8 border border-emerald-500/20 glass-card-hover">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center mb-6">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Волонтёр</h3>
            <p className="text-gray-400 mb-4">Исполнитель задач</p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-emerald-400" /> Заполняет профиль с навыками</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-emerald-400" /> Видит задачи с AI-скором совпадения</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-emerald-400" /> Задаёт вопросы RAG-консультанту</li>
              <li className="flex items-center gap-2"><ArrowRight className="w-3 h-3 text-emerald-400" /> Загружает фото для верификации</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sun className="w-5 h-5 text-sun-400" />
            <span className="text-sm font-semibold gradient-text">Sun Proactive</span>
          </div>
          <p className="text-xs text-gray-600">AI Social Task Exchange • 2026</p>
        </div>
      </footer>
    </div>
  );
}
