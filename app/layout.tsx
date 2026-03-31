import type { Metadata } from 'next';
import './globals.css';

// Initialize background cron jobs (only runs in main backend process)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  try {
    require('@/lib/cron');
  } catch (e) {
    console.error('Failed to load cron:', e);
  }
}

import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Sun Proactive — AI Social Task Exchange',
  description:
    'Платформа для социального обмена задачами на базе AI. Создавайте задачи, находите волонтёров, верифицируйте выполнение с помощью ИИ.',
  keywords: ['волонтёрство', 'AI', 'задачи', 'социальный обмен', 'Sun Proactive'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
