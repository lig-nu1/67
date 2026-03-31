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
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица: volunteer_profiles (Профили волонтёров)
CREATE TABLE volunteer_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT DEFAULT '',
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    goals TEXT DEFAULT '',
    embedding vector(1536),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица: tasks (Задачи от кураторов)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    curator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT,
    event_date TEXT,
    volunteer_quota INTEGER DEFAULT 1,
    hard_skills TEXT[] DEFAULT '{}',
    soft_skills TEXT[] DEFAULT '{}',
    raw_input TEXT DEFAULT '',
    embedding vector(1536),
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица: applications (Заявки на задачи)
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    volunteer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    match_score FLOAT,
    match_explanation TEXT,
    photo_url TEXT,
    verification_verdict TEXT,
    verification_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица: notifications (Уведомления)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    title TEXT,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Принудительно обновляем кэш схемы API PostgREST еще раз после создания
NOTIFY pgrst, 'reload schema';
