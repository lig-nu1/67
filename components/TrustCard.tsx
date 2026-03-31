'use client';

import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

interface TrustCardProps {
  score: number;
  explanation: string;
  compact?: boolean;
}

export default function TrustCard({ score, explanation, compact = false }: TrustCardProps) {
  const percent = Math.round(score * 100);
  
  let colorClass: string;
  let bgClass: string;
  let barColor: string;
  let label: string;

  if (percent >= 80) {
    colorClass = 'text-emerald-300';
    bgClass = 'bg-emerald-500/10 border-emerald-500/20';
    barColor = 'bg-emerald-500';
    label = 'Отличное совпадение';
  } else if (percent >= 60) {
    colorClass = 'text-amber-300';
    bgClass = 'bg-amber-500/10 border-amber-500/20';
    barColor = 'bg-amber-500';
    label = 'Хорошее совпадение';
  } else {
    colorClass = 'text-red-300';
    bgClass = 'bg-red-500/10 border-red-500/20';
    barColor = 'bg-red-500';
    label = 'Слабое совпадение';
  }

  if (compact) {
    return (
      <div className={`rounded-lg p-3 border ${bgClass} animate-fade-in`}>
        <div className="flex items-center gap-2 mb-1">
          <Bot className="w-3.5 h-3.5 text-sun-400" />
          <span className={`text-xs font-bold ${colorClass}`}>
            {percent}% — {label}
          </span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">{explanation}</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-4 border ${bgClass} animate-fade-in`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sun-500/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-sun-400" />
          </div>
          <div>
            <span className="text-xs font-bold text-sun-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              AI Объяснение
            </span>
          </div>
        </div>
        <span className={`text-lg font-bold ${colorClass}`}>{percent}%</span>
      </div>

      {/* Score bar */}
      <div className="score-bar mb-3">
        <div
          className={`score-bar-fill ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <p className="text-sm text-gray-300 leading-relaxed">{explanation}</p>
      
      <div className="mt-2 flex items-center gap-1">
        <span className={`text-xs font-medium ${colorClass}`}>{label}</span>
      </div>
    </div>
  );
}
