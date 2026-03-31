'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Sun,
  LogOut,
  Bell,
  LayoutDashboard,
  ClipboardList,
  User as UserIcon,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

interface Notification {
  id: string;
  message: string;
  task_id: string;
  sent_at: string;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Fetch notifications
    fetch(`/api/notifications?userId=${user.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.notifications) setNotifications(d.notifications);
      })
      .catch(() => {});
    
    // Poll every 30 seconds
    const interval = setInterval(() => {
      fetch(`/api/notifications?userId=${user.id}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.notifications) setNotifications(d.notifications);
        })
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!user) return null;

  const isCurator = user.role === 'curator';

  const navLinks = isCurator
    ? [
        { href: '/curator/dashboard', label: 'Панель управления', icon: LayoutDashboard },
        { href: '/curator/create-task', label: 'Создать задачу', icon: ClipboardList },
        { href: '/curator/ai-manager', label: 'AI Manager', icon: Sparkles },
      ]
    : [
        { href: '/volunteer/dashboard', label: 'Панель управления', icon: LayoutDashboard },
        { href: '/volunteer/tasks', label: 'Найти задачи', icon: ClipboardList },
        { href: '/volunteer/profile', label: 'Профиль', icon: UserIcon },
      ];

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={isCurator ? '/curator/dashboard' : '/volunteer/dashboard'} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center transition-transform group-hover:scale-110">
              <Sun className="w-5 h-5 text-midnight-950" />
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:block">Sun Proactive</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-gray-300 hover:text-sun-400 hover:bg-white/5 transition-all duration-200"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-lg text-gray-400 hover:text-sun-400 hover:bg-white/5 transition-all"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="notification-badge">{notifications.length}</span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-12 w-80 glass-card p-4 shadow-2xl animate-fade-in max-h-96 overflow-y-auto">
                  <h3 className="text-sm font-semibold text-sun-400 mb-3">Уведомления</h3>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-gray-500">Нет новых уведомлений</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className="mb-3 p-3 rounded-lg bg-white/5 text-xs text-gray-300">
                        <p>{n.message}</p>
                        <p className="text-gray-500 mt-1">{new Date(n.sent_at).toLocaleString('ru-RU')}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* User badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5">
              <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                <span className="text-xs font-bold text-midnight-950">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-xs text-gray-300 max-w-[100px] truncate">{user.name}</span>
              <span className="tag-pill !text-[10px] !px-2 !py-0.5">
                {isCurator ? 'Куратор' : 'Волонтёр'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              title="Выйти"
            >
              <LogOut className="w-5 h-5" />
            </button>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-sun-400 transition-all"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-white/5 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-300 hover:text-sun-400 hover:bg-white/5 transition-all"
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
