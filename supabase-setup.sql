-- Обновление кэша Supabase
NOTIFY pgrst, 'reload schema';

-- Удаляем старые таблицы, если они были созданы неправильно (ОСТОРОЖНО: удалит все данные, но для старта это то, что нужно)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS volunteer_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Разрешаем использование расширения вектора для эмбеддингов
CREATE EXTENSION IF NOT EXISTS vector;

-- Таблица: users (Пользователи)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'volunteer',
    password TEXT,
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица: volunteer_profiles (Профили волонтёров)
CREATE TABLE public.volunteer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    bio TEXT DEFAULT '',
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    goals TEXT DEFAULT '',
    embedding vector(1536),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица: tasks (Задачи от кураторов)
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    event_date TIMESTAMP WITH TIME ZONE,
    volunteer_quota INTEGER DEFAULT 1,
    hard_skills TEXT[] DEFAULT '{}',
    soft_skills TEXT[] DEFAULT '{}',
    raw_input TEXT DEFAULT '',
    embedding vector(1536),
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица: applications (Заявки на задачи)
CREATE TABLE public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    volunteer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    match_score FLOAT,
    match_explanation TEXT,
    photo_url TEXT,
    verification_verdict TEXT,
    verification_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица: notifications (Уведомления)
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включение Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Создание политик доступа "Allow all" (для отладки и MVP)
CREATE POLICY "Allow all" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.volunteer_profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- Принудительно обновляем кэш схемы API PostgREST еще раз после создания
NOTIFY pgrst, 'reload schema';
