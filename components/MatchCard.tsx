'use client';

import React from 'react';
import TrustCard from './TrustCard';
import { MapPin, Calendar, Users, Star } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface MatchCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    location?: string;
    event_date?: string;
    volunteer_quota?: number;
    hard_skills?: string[];
    soft_skills?: string[];
  };
  score: number;
  explanation: string;
  linkPrefix: string;
}

export default function MatchCard({ task, score, explanation, linkPrefix }: MatchCardProps) {
  const percent = Math.round(score * 100);

  return (
    <Link
      href={`${linkPrefix}/${task.id}`}
      className="block glass-card glass-card-hover p-5 animate-slide-up"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-semibold text-white group-hover:text-sun-400 transition-colors leading-tight flex-1 pr-3">
          {task.title}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Star className="w-4 h-4 text-sun-400" />
          <span className={`text-sm font-bold ${
            percent >= 80 ? 'text-emerald-400' : percent >= 60 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {percent}%
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-400 line-clamp-2 mb-3">{task.description}</p>

      {/* Meta */}
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
        {task.volunteer_quota && (
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {task.volunteer_quota} чел.
          </span>
        )}
      </div>

      {/* Skills */}
      {task.hard_skills && task.hard_skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.hard_skills.slice(0, 4).map((s, i) => (
            <span key={i} className="tag-pill !text-[10px]">{s}</span>
          ))}
          {task.hard_skills.length > 4 && (
            <span className="text-[10px] text-gray-500">+{task.hard_skills.length - 4}</span>
          )}
        </div>
      )}

      {/* Trust Card */}
      <TrustCard score={score} explanation={explanation} compact />
    </Link>
  );
}
