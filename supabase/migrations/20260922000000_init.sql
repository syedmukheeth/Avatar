-- MindLink initial schema.
--
-- Access model:
--   * The browser uses the publishable key and talks to PostgREST as `anon` or `authenticated`.
--     RLS decides which rows it sees; column grants decide which columns it may write.
--   * The Python backend connects directly as the database owner (bypasses RLS) and enforces
--     access in code using the same helpers defined here (private.can_view_character).
--   * Anything a creator must not be able to forge (voice fields, chunks, messages, usage)
--     has no browser write grant at all.

create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Helpers live in a schema the Data API does not expose.
create schema if not exists private;
grant usage on schema private to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Shared trigger functions
-- ---------------------------------------------------------------------------

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  -- null until the user explicitly picks a role on /welcome (public.choose_account_type).
  account_type text check (account_type in ('creator', 'user')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.creators (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  profession text check (char_length(profession) <= 120),
  bio text check (char_length(bio) <= 2000),
  social_links jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Public-safe character fields only. Anything private lives in character_private, because RLS
-- filters rows, not columns: a published row is readable by anyone.
create table public.characters (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creators (id) on delete cascade,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 64),
  name text not null check (char_length(name) between 1 and 80),
  tagline text check (char_length(tagline) <= 140),
  description text check (char_length(description) <= 2000),
  avatar_path text check (char_length(avatar_path) <= 300),
  language text not null default 'en'
    check (language in ('en', 'hi', 'ta', 'te', 'mr', 'bn', 'gu', 'kn', 'ml', 'pa', 'es', 'fr')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  -- Maintained from character_private by trigger; never written by the browser.
  voice_ready boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index characters_creator_id_idx on public.characters (creator_id);
create index characters_published_idx on public.characters (published_at desc)
  where status = 'published';
create index characters_search_idx on public.characters
  using gin ((name || ' ' || coalesce(tagline, '')) extensions.gin_trgm_ops);

create table public.character_private (
  character_id uuid primary key references public.characters (id) on delete cascade,
  personality text check (char_length(personality) <= 4000),
  instructions text check (char_length(instructions) <= 8000),
  voice_provider text check (voice_provider in ('cartesia')),
  voice_id text check (char_length(voice_id) <= 200),
  voice_status text not null default 'not_setup'
    check (voice_status in ('not_setup', 'processing', 'ready', 'failed')),
  voice_error text check (char_length(voice_error) <= 300),
  voice_updated_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references public.characters (id) on delete cascade,
  source_type text not null check (source_type in ('pdf', 'text', 'note')),
  title text not null check (char_length(title) between 1 and 200),
  storage_path text unique check (char_length(storage_path) <= 400),
  note_content text check (char_length(note_content) <= 50000),
  byte_size integer check (byte_size >= 0),
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'ready', 'failed')),
  error text check (char_length(error) <= 300),
  attempts integer not null default 0,
  locked_at timestamptz,
  char_count integer,
  chunk_count integer,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Notes carry their text inline; files point at a storage object. Never both.
  check ((source_type = 'note') = (note_content is not null)),
  check ((source_type = 'note') = (storage_path is null))
);

create index knowledge_sources_character_id_idx on public.knowledge_sources (character_id);
create index knowledge_sources_queue_idx on public.knowledge_sources (created_at)
  where status in ('queued', 'processing');

create table public.knowledge_chunks (
  id bigint generated always as identity primary key,
  knowledge_source_id uuid not null references public.knowledge_sources (id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  chunk_index integer not null check (chunk_index >= 0),
  content text not null,
  token_count integer,
  embedding extensions.vector(768) not null,
  embedding_model text not null,
  created_at timestamptz not null default now(),
  unique (knowledge_source_id, chunk_index)
);

create index knowledge_chunks_character_id_idx on public.knowledge_chunks (character_id);
create index knowledge_chunks_embedding_idx on public.knowledge_chunks
  using hnsw (embedding extensions.vector_cosine_ops);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  audience_user_id uuid not null references public.profiles (id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  channel text not null default 'text' check (channel in ('text', 'voice')),
  created_at timestamptz not null default now(),
  -- Bumped whenever a message is added; drives "recent conversations" lists.
  updated_at timestamptz not null default now()
);

create index conversations_audience_idx
  on public.conversations (audience_user_id, character_id, updated_at desc);
create index conversations_character_idx on public.conversations (character_id, updated_at desc);

create table public.messages (
  -- Identity ids are monotonic, which makes keyset pagination trivial.
  id bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 8000),
  -- chunk ids used, model, token usage, latency. Never secrets.
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, id);
create index messages_created_at_idx on public.messages (created_at);

create table public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  character_id uuid not null references public.characters (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  ended_at timestamptz,
  end_reason text check (end_reason in (
    'hangup', 'max_duration', 'idle', 'disconnected', 'error', 'stale', 'server_shutdown'
  )),
  duration_secs numeric(8, 1),
  stt_secs numeric(8, 1) not null default 0,
  tts_chars integer not null default 0,
  llm_input_tokens integer not null default 0,
  llm_output_tokens integer not null default 0,
  est_cost_usd numeric(10, 5),
  metrics jsonb not null default '{}'::jsonb,
  check ((status = 'ended') = (ended_at is not null))
);

-- At most one live call per user, enforced by the database rather than process memory.
create unique index call_sessions_one_active_per_user
  on public.call_sessions (user_id) where status = 'active';
create index call_sessions_user_started_idx on public.call_sessions (user_id, started_at desc);

-- Proof of consent for every voice clone. Kept if the character is deleted.
create table public.voice_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  character_id uuid references public.characters (id) on delete set null,
  consent_version text not null check (char_length(consent_version) <= 40),
  language text not null,
  audio_sha256 text not null check (audio_sha256 ~ '^[0-9a-f]{64}$'),
  voice_id text,
  created_at timestamptz not null default now()
);

create index voice_consents_user_idx on public.voice_consents (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Access helpers (security definer so policies never recurse into each other)
-- ---------------------------------------------------------------------------

create function private.my_creator_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select c.id from public.creators c where c.user_id = auth.uid()
$$;

create function private.is_creator_account()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.account_type = 'creator'
  )
$$;

create function private.owns_character(p_character_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.characters ch
    join public.creators cr on cr.id = ch.creator_id
    where ch.id = p_character_id and cr.user_id = auth.uid()
  )
$$;

create function private.creator_has_published_character(p_creator_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.characters ch
    where ch.creator_id = p_creator_id and ch.status = 'published'
  )
$$;

create function private.can_read_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations cv
    join public.characters ch on ch.id = cv.character_id
    join public.creators cr on cr.id = ch.creator_id
    where cv.id = p_conversation_id
      and (cv.audience_user_id = auth.uid() or cr.user_id = auth.uid())
  )
$$;

-- True when the given profile has talked to one of the caller's characters. Lets a creator read
-- the display names of their audience.
create function private.is_my_audience(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversations cv
    join public.characters ch on ch.id = cv.character_id
    join public.creators cr on cr.id = ch.creator_id
    where cv.audience_user_id = p_profile_id and cr.user_id = auth.uid()
  )
$$;

-- The one access rule for talking to a character: it is published, or the user owns it.
-- Called by the backend with an explicit user id; not exposed to browser roles.
create function private.can_view_character(p_user_id uuid, p_character_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.characters ch
    join public.creators cr on cr.id = ch.creator_id
    where ch.id = p_character_id and (ch.status = 'published' or cr.user_id = p_user_id)
  )
$$;

revoke execute on function private.can_view_character(uuid, uuid) from public, anon, authenticated;

-- Storage path rule for knowledge uploads: "{auth.uid()}/{character_id}/{file}" where the caller
-- owns the character.
create function private.can_write_knowledge_path(p_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  parts text[] := storage.foldername(p_name);
  target uuid;
begin
  if coalesce(array_length(parts, 1), 0) <> 2 or parts[1] is distinct from auth.uid()::text then
    return false;
  end if;
  begin
    target := parts[2]::uuid;
  exception when invalid_text_representation then
    return false;
  end;
  return private.owns_character(target);
end;
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'), 120)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Fill a slug from the name when the client does not send one.
create function private.characters_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  base text;
begin
  if new.slug is null or new.slug = '' then
    base := trim(both '-' from regexp_replace(lower(new.name), '[^a-z0-9]+', '-', 'g'));
    if char_length(base) < 3 then
      base := 'character';
    end if;
    new.slug := left(base, 50) || '-' || substr(md5(gen_random_uuid()::text), 1, 6);
  end if;
  return new;
end;
$$;

create trigger characters_before_insert
  before insert on public.characters
  for each row execute function private.characters_before_insert();

create function private.characters_set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger characters_set_published_at
  before insert or update of status on public.characters
  for each row execute function private.characters_set_published_at();

-- Every character always has its private row.
create function private.characters_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.character_private (character_id) values (new.id);
  return new;
end;
$$;

create trigger characters_after_insert
  after insert on public.characters
  for each row execute function private.characters_after_insert();

-- Mirror voice readiness onto the public row so the UI can show the call button without
-- reading private data.
create function private.sync_voice_ready()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.characters
  set voice_ready = (new.voice_status = 'ready' and new.voice_id is not null)
  where id = new.character_id
    and voice_ready is distinct from (new.voice_status = 'ready' and new.voice_id is not null);
  return new;
end;
$$;

create trigger character_private_sync_voice_ready
  after insert or update of voice_status, voice_id on public.character_private
  for each row execute function private.sync_voice_ready();

create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();
create trigger creators_touch before update on public.creators
  for each row execute function private.touch_updated_at();
create trigger characters_touch before update on public.characters
  for each row execute function private.touch_updated_at();
create trigger character_private_touch before update on public.character_private
  for each row execute function private.touch_updated_at();
create trigger knowledge_sources_touch before update on public.knowledge_sources
  for each row execute function private.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RPCs callable from the browser
-- ---------------------------------------------------------------------------

-- Role choice: null -> creator|user once, or user -> creator. Anything else is rejected.
-- Repeating the current choice is a no-op so double submits are harmless.
create function public.choose_account_type(p_account_type text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_type text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;
  if p_account_type not in ('creator', 'user') then
    raise exception 'invalid account type' using errcode = '22023';
  end if;

  select account_type into current_type from public.profiles where id = auth.uid() for update;
  if not found then
    raise exception 'profile not found' using errcode = 'P0002';
  end if;

  if current_type is not distinct from p_account_type then
    return current_type;
  end if;
  if current_type is null or (current_type = 'user' and p_account_type = 'creator') then
    update public.profiles set account_type = p_account_type where id = auth.uid();
    return p_account_type;
  end if;
  raise exception 'account type change not allowed' using errcode = '42501';
end;
$$;

revoke execute on function public.choose_account_type(text) from public, anon;
grant execute on function public.choose_account_type(text) to authenticated;

-- Nearest chunks of one character. Backend only: chunks are private knowledge.
-- Iterative HNSW scans keep returning rows until enough pass the character filter.
create function public.match_knowledge_chunks(
  query_embedding extensions.vector(768),
  match_character_id uuid,
  match_count integer default 5,
  min_similarity double precision default 0
)
returns table (
  id bigint,
  knowledge_source_id uuid,
  chunk_index integer,
  content text,
  similarity double precision
)
language sql
stable
set search_path = ''
set hnsw.iterative_scan = 'relaxed_order'
as $$
  select
    kc.id,
    kc.knowledge_source_id,
    kc.chunk_index,
    kc.content,
    1 - (kc.embedding operator(extensions.<=>) query_embedding) as similarity
  from public.knowledge_chunks kc
  where kc.character_id = match_character_id
    and 1 - (kc.embedding operator(extensions.<=>) query_embedding) >= min_similarity
  order by kc.embedding operator(extensions.<=>) query_embedding
  limit least(greatest(match_count, 1), 20)
$$;

revoke execute on function public.match_knowledge_chunks(extensions.vector, uuid, integer, double precision)
  from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Privileges: start from nothing, grant only what the browser needs.
-- ---------------------------------------------------------------------------

revoke all on public.profiles, public.creators, public.characters, public.character_private,
  public.knowledge_sources, public.knowledge_chunks, public.conversations, public.messages,
  public.call_sessions, public.voice_consents
  from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;

grant select on public.creators to anon, authenticated;
grant insert (user_id, display_name, profession, bio, social_links) on public.creators to authenticated;
grant update (display_name, profession, bio, social_links) on public.creators to authenticated;

grant select on public.characters to anon, authenticated;
grant insert (creator_id, slug, name, tagline, description, avatar_path, language)
  on public.characters to authenticated;
grant update (slug, name, tagline, description, avatar_path, language, status)
  on public.characters to authenticated;
-- Delete goes through the API so the cloned voice and storage objects are cleaned up too.

grant select on public.character_private to authenticated;
grant update (personality, instructions) on public.character_private to authenticated;

grant select on public.knowledge_sources to authenticated;
grant select on public.conversations to authenticated;
grant select on public.messages to authenticated;
grant select on public.call_sessions to authenticated;
grant select on public.voice_consents to authenticated;
-- knowledge_chunks: no browser access at all.

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.creators enable row level security;
alter table public.characters enable row level security;
alter table public.character_private enable row level security;
alter table public.knowledge_sources enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.call_sessions enable row level security;
alter table public.voice_consents enable row level security;

create policy "profiles: read own or my audience" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.is_my_audience(id));
create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "creators: read own or publicly listed" on public.creators
  for select to anon, authenticated
  using (user_id = (select auth.uid()) or private.creator_has_published_character(id));
create policy "creators: creator accounts insert own" on public.creators
  for insert to authenticated
  with check (user_id = (select auth.uid()) and (select private.is_creator_account()));
create policy "creators: update own" on public.creators
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "characters: read published or own" on public.characters
  for select to anon, authenticated
  using (status = 'published' or creator_id = (select private.my_creator_id()));
create policy "characters: insert own" on public.characters
  for insert to authenticated
  with check (creator_id = (select private.my_creator_id()));
create policy "characters: update own" on public.characters
  for update to authenticated
  using (creator_id = (select private.my_creator_id()))
  with check (creator_id = (select private.my_creator_id()));

create policy "character_private: owner reads" on public.character_private
  for select to authenticated
  using (private.owns_character(character_id));
create policy "character_private: owner updates" on public.character_private
  for update to authenticated
  using (private.owns_character(character_id))
  with check (private.owns_character(character_id));

create policy "knowledge_sources: owner reads" on public.knowledge_sources
  for select to authenticated
  using (private.owns_character(character_id));

create policy "conversations: participant or character owner reads" on public.conversations
  for select to authenticated
  using (audience_user_id = (select auth.uid()) or private.owns_character(character_id));

create policy "messages: readable with their conversation" on public.messages
  for select to authenticated
  using (private.can_read_conversation(conversation_id));

create policy "call_sessions: read own" on public.call_sessions
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "voice_consents: read own" on public.voice_consents
  for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('knowledge', 'knowledge', false, 10485760, array['application/pdf', 'text/plain']),
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "knowledge: owner uploads into own character folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'knowledge' and private.can_write_knowledge_path(name));
create policy "knowledge: owner reads own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'knowledge' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "knowledge: owner deletes own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'knowledge' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "avatars: upload into own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "avatars: delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
