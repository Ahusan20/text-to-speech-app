-- ==============================================================================
-- Supabase Schema for Vox Studio - Text-to-Speech Application
-- Sections 5, 13, 16 & 35: PostgreSQL Database, Supabase Auth & Cloud Storage
-- ==============================================================================

-- 0. STORAGE OBJECTS
-- The backend uploads with the service-role key, which bypasses RLS. Public
-- reads are intentional because generated audio URLs are shared with the app.
insert into storage.buckets (id, name, public)
values ('speech-audio', 'speech-audio', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public Access for Speech Audio" on storage.objects;
create policy "Public Access for Speech Audio"
  on storage.objects for select
  using (bucket_id = 'speech-audio');

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
drop policy if exists "Users can view their own speech history" on public.speech_history;
create policy "Users can view their own speech history"
  on public.speech_history
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert into their own speech history" on public.speech_history;
create policy "Users can insert into their own speech history"
  on public.speech_history
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own speech history" on public.speech_history;
create policy "Users can delete their own speech history"
  on public.speech_history
  for delete
  using (auth.uid() = user_id);

-- Index for fast user history lookup
create index if not exists idx_speech_history_user_created 
  on public.speech_history(user_id, created_at desc);


-- 2. USAGE AND ANALYTICS
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null,
  language text,
  character_count integer not null default 0,
  success boolean not null default true,
  created_at timestamp with time zone default now()
);

alter table public.usage_events enable row level security;

drop policy if exists "Users can insert their own usage events" on public.usage_events;
create policy "Users can insert their own usage events"
  on public.usage_events
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own usage events" on public.usage_events;
create policy "Users can view their own usage events"
  on public.usage_events
  for select
  using (auth.uid() = user_id);

create index if not exists idx_usage_events_user_created
  on public.usage_events(user_id, created_at desc);


-- 3. FAVORITES TABLE
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
drop policy if exists "Users can view their own favorites" on public.favorites;
create policy "Users can view their own favorites"
  on public.favorites
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own favorites" on public.favorites;
create policy "Users can insert their own favorites"
  on public.favorites
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own favorites" on public.favorites;
create policy "Users can delete their own favorites"
  on public.favorites
  for delete
  using (auth.uid() = user_id);

-- 4. ACCOUNT AND ADMIN ANALYTICS
create or replace function public.get_my_usage()
returns table (
  total_requests bigint,
  successful_requests bigint,
  failed_requests bigint,
  characters_generated bigint
)
language sql
security invoker
as $$
  select
    count(*)::bigint,
    count(*) filter (where success)::bigint,
    count(*) filter (where not success)::bigint,
    coalesce(sum(character_count) filter (where success), 0)::bigint
  from public.usage_events
  where user_id = auth.uid();
$$;

create or replace function public.get_admin_usage()
returns json
language sql
security invoker
as $$
  select case
    when coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false) then
      json_build_object(
        'totalUsers', (select count(distinct user_id) from public.usage_events),
        'totalRequests', (select count(*) from public.usage_events),
        'successfulRequests', (select count(*) from public.usage_events where success),
        'failedRequests', (select count(*) from public.usage_events where not success),
        'charactersGenerated', (
          select coalesce(sum(character_count) filter (where success), 0)
          from public.usage_events
        )
      )
    else json_build_object('error', 'Administrator access required')
  end;
$$;
