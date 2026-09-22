-- Access control and trigger behaviour for the init schema.
-- Run with: pnpm db:test   (supabase test db)
--
-- Users:      A = creator (owns P1 published, D1 draft), B = creator (owns DB draft),
--             U = audience (talked to P1), N = brand-new user with no role yet.
begin;
create extension if not exists pgtap with schema extensions;
select plan(61);

create schema tests;
grant usage on schema tests to anon, authenticated;
create function tests.rows_affected(statement text)
returns integer
language plpgsql
as $$
declare
  n integer;
begin
  execute statement;
  get diagnostics n = row_count;
  return n;
end;
$$;
grant execute on function tests.rows_affected(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Fixtures, created as the database owner
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-4111-8111-111111111111', 'a@test.dev', '{"full_name": "Creator A"}'),
  ('22222222-2222-4222-8222-222222222222', 'b@test.dev', '{}'),
  ('33333333-3333-4333-8333-333333333333', 'u@test.dev', '{"name": "Audience U"}'),
  ('44444444-4444-4444-8444-444444444444', 'n@test.dev', '{}');

select is(
  (select count(*)::int from public.profiles where id in (
    '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333', '44444444-4444-4444-8444-444444444444')),
  4, 'signup trigger creates one profile per user');
select is(
  (select full_name from public.profiles where id = '33333333-3333-4333-8333-333333333333'),
  'Audience U', 'profile name falls back to metadata name');

update public.profiles set account_type = 'creator'
  where id in ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222');
update public.profiles set account_type = 'user'
  where id = '33333333-3333-4333-8333-333333333333';

insert into public.creators (id, user_id, display_name) values
  ('aaaaaaaa-0000-4000-8000-00000000000a', '11111111-1111-4111-8111-111111111111', 'Creator A'),
  ('bbbbbbbb-0000-4000-8000-00000000000b', '22222222-2222-4222-8222-222222222222', 'Creator B');

insert into public.characters (id, creator_id, name, status) values
  ('0000000a-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-00000000000a', 'Public One', 'published'),
  ('0000000a-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-00000000000a', 'Draft One', 'draft'),
  ('0000000b-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-00000000000b', 'B Draft', 'draft');

update public.character_private
set instructions = 'secret instructions', voice_provider = 'cartesia',
    voice_id = 'voice-123', voice_status = 'ready'
where character_id = '0000000a-0000-4000-8000-000000000001';

insert into public.knowledge_sources (id, character_id, source_type, title, note_content, status)
values ('0000000c-0000-4000-8000-000000000001', '0000000a-0000-4000-8000-000000000001',
        'note', 'Bio', 'Creator A teaches Python.', 'ready');

insert into public.knowledge_chunks
  (knowledge_source_id, character_id, chunk_index, content, embedding, embedding_model)
values ('0000000c-0000-4000-8000-000000000001', '0000000a-0000-4000-8000-000000000001', 0,
        'Creator A teaches Python.', array_fill(0.1::real, array[768])::extensions.vector,
        'gemini-embedding-001');

insert into public.conversations (id, audience_user_id, character_id) values
  ('0000000d-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333',
   '0000000a-0000-4000-8000-000000000001');
insert into public.messages (conversation_id, role, content) values
  ('0000000d-0000-4000-8000-000000000001', 'user', 'hi'),
  ('0000000d-0000-4000-8000-000000000001', 'assistant', 'hello');

-- ---------------------------------------------------------------------------
-- Triggers, constraints, retrieval
-- ---------------------------------------------------------------------------

select ok(
  (select slug from public.characters where id = '0000000a-0000-4000-8000-000000000001')
    ~ '^public-one-[0-9a-f]{6}$',
  'slug is generated from the name');
select ok(
  (select published_at is not null from public.characters where id = '0000000a-0000-4000-8000-000000000001')
  and (select published_at is null from public.characters where id = '0000000a-0000-4000-8000-000000000002'),
  'published_at is stamped only for published characters');
select is((select count(*)::int from public.character_private), 3,
  'every character gets a private row');
select ok(
  (select voice_ready from public.characters where id = '0000000a-0000-4000-8000-000000000001')
  and not (select voice_ready from public.characters where id = '0000000a-0000-4000-8000-000000000002'),
  'voice_ready mirrors a ready cloned voice');

update public.character_private set voice_status = 'failed'
  where character_id = '0000000a-0000-4000-8000-000000000001';
select ok(
  not (select voice_ready from public.characters where id = '0000000a-0000-4000-8000-000000000001'),
  'voice_ready clears when the voice is no longer ready');
update public.character_private set voice_status = 'ready'
  where character_id = '0000000a-0000-4000-8000-000000000001';

select is(
  (select count(*)::int from public.match_knowledge_chunks(
    array_fill(0.1::real, array[768])::extensions.vector, '0000000a-0000-4000-8000-000000000001', 5)),
  1, 'retrieval finds the character chunk');
select is(
  (select count(*)::int from public.match_knowledge_chunks(
    array_fill(0.1::real, array[768])::extensions.vector, '0000000a-0000-4000-8000-000000000002', 5)),
  0, 'retrieval is scoped to one character');

select lives_ok(
  $$insert into public.call_sessions (user_id, character_id)
    values ('33333333-3333-4333-8333-333333333333', '0000000a-0000-4000-8000-000000000001')$$,
  'a user can start a call');
select throws_ok(
  $$insert into public.call_sessions (user_id, character_id)
    values ('33333333-3333-4333-8333-333333333333', '0000000a-0000-4000-8000-000000000001')$$,
  '23505', null, 'at most one active call per user');
select throws_ok(
  $$insert into public.knowledge_sources (character_id, source_type, title)
    values ('0000000a-0000-4000-8000-000000000001', 'pdf', 'No file')$$,
  '23514', null, 'file sources require a storage path');

-- ---------------------------------------------------------------------------
-- Anonymous visitor
-- ---------------------------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select is((select count(*)::int from public.characters), 1,
  'anon sees only published characters');
select is((select count(*)::int from public.creators), 1,
  'anon sees only creators with a published character');
select throws_ok('select * from public.character_private', '42501', null,
  'anon cannot read private character fields');
select throws_ok('select * from public.knowledge_chunks', '42501', null,
  'anon cannot read knowledge chunks');
select throws_ok('select * from public.profiles', '42501', null,
  'anon cannot read profiles');
select throws_ok(
  $$select * from public.match_knowledge_chunks(
    array_fill(0.1::real, array[768])::extensions.vector, '0000000a-0000-4000-8000-000000000001')$$,
  '42501', null, 'anon cannot call retrieval');
select throws_ok($$select public.choose_account_type('creator')$$, '42501', null,
  'anon cannot choose an account type');

reset role;

-- ---------------------------------------------------------------------------
-- Audience user U
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "33333333-3333-4333-8333-333333333333", "role": "authenticated"}', true);

select is((select count(*)::int from public.characters), 1,
  'audience sees published characters only');
select is((select count(*)::int from public.conversations), 1,
  'audience sees own conversation');
select is((select count(*)::int from public.messages), 2,
  'audience reads own messages');
select throws_ok(
  $$insert into public.messages (conversation_id, role, content)
    values ('0000000d-0000-4000-8000-000000000001', 'assistant', 'forged')$$,
  '42501', null, 'audience cannot write messages');
select is(
  tests.rows_affected($$update public.characters set name = 'Hacked'
    where id = '0000000a-0000-4000-8000-000000000001'$$),
  0, 'audience cannot edit a character');
select throws_ok(
  $$update public.profiles set account_type = 'creator'
    where id = '33333333-3333-4333-8333-333333333333'$$,
  '42501', null, 'account_type is not directly writable');
select is(
  tests.rows_affected($$update public.profiles set full_name = 'U2'
    where id = '33333333-3333-4333-8333-333333333333'$$),
  1, 'user renames own profile');
select throws_ok(
  $$insert into public.creators (user_id, display_name)
    values ('33333333-3333-4333-8333-333333333333', 'Fake')$$,
  '42501', null, 'audience accounts cannot create a creator identity');
select is((select count(*)::int from public.call_sessions), 1,
  'user reads own call sessions');
select throws_ok('delete from public.conversations', '42501', null,
  'audience cannot delete conversations');

reset role;

-- ---------------------------------------------------------------------------
-- New user N choosing a role
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "44444444-4444-4444-8444-444444444444", "role": "authenticated"}', true);

select is(public.choose_account_type('user'), 'user', 'first role choice is accepted');
select is(public.choose_account_type('user'), 'user', 'repeating the choice is a no-op');
select is(public.choose_account_type('creator'), 'creator', 'user can upgrade to creator');
select throws_ok($$select public.choose_account_type('user')$$, '42501', null,
  'creator cannot downgrade');
select throws_ok($$select public.choose_account_type('admin')$$, '22023', null,
  'unknown account types are rejected');
select lives_ok(
  $$insert into public.creators (user_id, display_name)
    values ('44444444-4444-4444-8444-444444444444', 'Creator N')$$,
  'upgraded creator can create a creator identity');

reset role;

-- ---------------------------------------------------------------------------
-- Creator B (not the owner of P1/D1)
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "22222222-2222-4222-8222-222222222222", "role": "authenticated"}', true);

select is((select count(*)::int from public.characters), 2,
  'creator sees published characters plus own drafts');
select is((select count(*)::int from public.conversations), 0,
  'creator cannot see conversations of other creators');
select is(
  (select count(*)::int from public.character_private
   where character_id = '0000000a-0000-4000-8000-000000000001'),
  0, 'creator cannot read another creator''s private fields');
select is(
  tests.rows_affected($$update public.character_private set instructions = 'x'
    where character_id = '0000000a-0000-4000-8000-000000000001'$$),
  0, 'creator cannot edit another creator''s private fields');
select throws_ok(
  $$insert into public.characters (creator_id, name)
    values ('aaaaaaaa-0000-4000-8000-00000000000a', 'Impostor')$$,
  '42501', null, 'creator cannot create characters for someone else');
select ok(
  not private.can_write_knowledge_path(
    '22222222-2222-4222-8222-222222222222/0000000a-0000-4000-8000-000000000001/f.pdf'),
  'upload path must point at an owned character');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('knowledge',
    '22222222-2222-4222-8222-222222222222/0000000a-0000-4000-8000-000000000001/f.pdf')$$,
  '42501', null, 'storage rejects uploads into another creator''s character');

reset role;

-- ---------------------------------------------------------------------------
-- Creator A (owner)
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub": "11111111-1111-4111-8111-111111111111", "role": "authenticated"}', true);

select is((select count(*)::int from public.characters), 2,
  'creator sees own published and draft characters');
select is(
  (select instructions from public.character_private
   where character_id = '0000000a-0000-4000-8000-000000000001'),
  'secret instructions', 'owner reads private fields');
select is((select count(*)::int from public.conversations), 1,
  'creator sees conversations with own characters');
select is((select count(*)::int from public.messages), 2,
  'creator reads transcripts of own characters');
select is(
  (select full_name from public.profiles where id = '33333333-3333-4333-8333-333333333333'),
  'U2', 'creator sees names of own audience');
select is(
  (select count(*)::int from public.profiles where id = '22222222-2222-4222-8222-222222222222'),
  0, 'creator cannot read unrelated profiles');
select is(
  tests.rows_affected($$update public.characters set name = 'Draft Renamed'
    where id = '0000000a-0000-4000-8000-000000000002'$$),
  1, 'owner edits own character');
select throws_ok(
  $$update public.characters set voice_ready = true
    where id = '0000000a-0000-4000-8000-000000000002'$$,
  '42501', null, 'voice_ready is not browser writable');
select throws_ok(
  $$update public.character_private set voice_id = 'attacker-voice'
    where character_id = '0000000a-0000-4000-8000-000000000002'$$,
  '42501', null, 'voice fields are not browser writable');
select throws_ok(
  $$delete from public.characters where id = '0000000a-0000-4000-8000-000000000002'$$,
  '42501', null, 'characters are deleted through the API only');
select throws_ok('select * from public.knowledge_chunks', '42501', null,
  'owners cannot read chunks directly either');
select throws_ok(
  $$insert into public.knowledge_sources (character_id, source_type, title, note_content)
    values ('0000000a-0000-4000-8000-000000000001', 'note', 'n', 'text')$$,
  '42501', null, 'knowledge sources are registered through the API only');
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('knowledge',
    '11111111-1111-4111-8111-111111111111/0000000a-0000-4000-8000-000000000001/doc.pdf')$$,
  'owner uploads into own character folder');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('knowledge',
    '11111111-1111-4111-8111-111111111111/not-a-uuid/doc.pdf')$$,
  '42501', null, 'malformed character folder is rejected');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('knowledge',
    '11111111-1111-4111-8111-111111111111/0000000a-0000-4000-8000-000000000001/extra/doc.pdf')$$,
  '42501', null, 'nested knowledge folders are rejected');
select lives_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('avatars', '11111111-1111-4111-8111-111111111111/avatar.webp')$$,
  'owner uploads an avatar into own folder');
select throws_ok(
  $$insert into storage.objects (bucket_id, name)
    values ('avatars', '22222222-2222-4222-8222-222222222222/avatar.webp')$$,
  '42501', null, 'cannot upload avatars into another user''s folder');
select is(
  tests.rows_affected($$update public.characters set status = 'published'
    where id = '0000000a-0000-4000-8000-000000000002'$$),
  1, 'owner publishes a draft');
select ok(
  (select published_at is not null from public.characters
   where id = '0000000a-0000-4000-8000-000000000002'),
  'publishing stamps published_at');

reset role;

select * from finish();
rollback;
