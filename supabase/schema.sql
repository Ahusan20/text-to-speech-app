-- ==============================================================================
-- Supabase Schema for Vox Studio - Text-to-Speech Application
-- Sections 5, 13, 16 & 35: PostgreSQL Database, Supabase Auth & Cloud Storage
-- ==============================================================================

-- 1. SPEECH HISTORY TABLE
create table if not exists public.speech_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  language text not null,
  voice text not null,
  audio_url text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security (RLS)
alter table public.speech_history enable row level security;

-- Strict RLS Policies for speech_history: users can only see & insert their own data
create policy "Users can view their own speech history"
  on public.speech_history
  for select
  using (auth.uid() = user_id);

create policy "Users can insert into their own speech history"
  on public.speech_history
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own speech history"
  on public.speech_history
  for delete
  using (auth.uid() = user_id);

-- Index for fast user history lookup
create index if not exists idx_speech_history_user_created 
  on public.speech_history(user_id, created_at desc);


-- 2. FAVORITES TABLE
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  text text not null,
  voice text,
  created_at timestamp with time zone default now(),
  constraint unique_user_favorite_text unique(user_id, text)
);

alter table public.favorites enable row level security;

-- Strict RLS Policies for favorites
create policy "Users can view their own favorites"
  on public.favorites
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on public.favorites
  for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on public.favorites
  for delete
  using (auth.uid() = user_id);


-- 3. STORAGE BUCKET CONFIGURATION (for durable audio files)
-- To execute in Supabase SQL editor:
insert into storage.buckets (id, name, public)
values ('speech-audio', 'speech-audio', true)
on conflict (id) do nothing;

create policy "Public Access for Speech Audio"
  on storage.objects for select
  using (bucket_id = 'speech-audio');

create policy "Authenticated Users & Service Role Upload Access"
  on storage.objects for insert
  with check (bucket_id = 'speech-audio');
