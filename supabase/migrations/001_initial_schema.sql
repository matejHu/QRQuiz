-- ============================================================
-- QRQuizes - Initial Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enums
create type user_role as enum ('admin', 'creator', 'student');
create type qr_code_type as enum ('dynamic', 'static');
create type question_type as enum ('multiple_choice', 'true_false', 'short_text', 'multiple_select');

-- ============================================================
-- profiles (extends auth.users)
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role user_role not null default 'creator',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'creator'::user_role)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- anonymous_students (GDPR-friendly, no personal data)
-- ============================================================
create table anonymous_students (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  total_points integer not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- quizzes
-- ============================================================
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  creator_id uuid not null references profiles(id) on delete cascade,
  time_limit_seconds integer,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_quizzes_creator on quizzes(creator_id);

-- ============================================================
-- questions
-- ============================================================
create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  question_text text not null,
  type question_type not null,
  order_index integer not null default 0,
  points integer not null default 10
);

create index idx_questions_quiz on questions(quiz_id);

-- ============================================================
-- question_options
-- ============================================================
create table question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  order_index integer not null default 0
);

create index idx_options_question on question_options(question_id);

-- ============================================================
-- qr_codes (represent physical labels)
-- ============================================================
create table qr_codes (
  id uuid primary key default gen_random_uuid(),
  type qr_code_type not null default 'dynamic',
  label text not null,
  location_description text,
  creator_id uuid not null references profiles(id) on delete cascade,
  -- dynamic: points to a quiz (changeable)
  current_quiz_id uuid references quizzes(id) on delete set null,
  -- static: locked to a single question forever
  locked_question_id uuid references questions(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  -- Enforce: static QR codes cannot have current_quiz_id
  constraint static_qr_has_question check (
    (type = 'static' and locked_question_id is not null and current_quiz_id is null)
    or (type = 'dynamic' and locked_question_id is null)
  )
);

create index idx_qr_codes_creator on qr_codes(creator_id);
create index idx_qr_codes_quiz on qr_codes(current_quiz_id);

-- ============================================================
-- qr_code_assignments (history + scheduling for dynamic QR codes)
-- ============================================================
create table qr_code_assignments (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid not null references qr_codes(id) on delete cascade,
  quiz_id uuid not null references quizzes(id) on delete cascade,
  assigned_by uuid not null references profiles(id),
  active_from timestamptz not null default now(),
  active_until timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_assignments_qr on qr_code_assignments(qr_code_id);

-- ============================================================
-- quiz_attempts
-- ============================================================
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  -- what was answered (one of these will be set)
  quiz_id uuid references quizzes(id) on delete set null,
  question_id uuid references questions(id) on delete set null,
  -- which physical QR code was used
  qr_code_id uuid references qr_codes(id) on delete set null,
  -- who answered (one of these will be set)
  user_id uuid references profiles(id) on delete set null,
  anonymous_id uuid references anonymous_students(id) on delete set null,
  -- results
  score integer not null default 0,
  max_score integer not null,
  time_taken_seconds integer,
  answers jsonb not null default '{}',
  submitted_at timestamptz not null default now(),
  constraint attempt_has_participant check (
    user_id is not null or anonymous_id is not null
  )
);

create index idx_attempts_user on quiz_attempts(user_id);
create index idx_attempts_anon on quiz_attempts(anonymous_id);
create index idx_attempts_quiz on quiz_attempts(quiz_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table anonymous_students enable row level security;
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table qr_codes enable row level security;
alter table qr_code_assignments enable row level security;
alter table quiz_attempts enable row level security;

-- profiles: users can read all, update own
create policy "profiles: read all" on profiles for select using (true);
create policy "profiles: update own" on profiles for update using (auth.uid() = id);

-- anonymous_students: service role manages, public can insert own
create policy "anon_students: insert" on anonymous_students for insert with check (true);
create policy "anon_students: read own" on anonymous_students for select using (true);
create policy "anon_students: update own" on anonymous_students for update using (true);

-- quizzes: public reads active public quizzes; creators manage own
create policy "quizzes: read public" on quizzes for select using (is_public = true or auth.uid() = creator_id);
create policy "quizzes: insert own" on quizzes for insert with check (auth.uid() = creator_id);
create policy "quizzes: update own" on quizzes for update using (auth.uid() = creator_id);
create policy "quizzes: delete own" on quizzes for delete using (auth.uid() = creator_id);

-- questions: readable if quiz is readable
create policy "questions: read" on questions for select using (
  exists (select 1 from quizzes q where q.id = quiz_id and (q.is_public or q.creator_id = auth.uid()))
);
create policy "questions: manage" on questions for all using (
  exists (select 1 from quizzes q where q.id = quiz_id and q.creator_id = auth.uid())
);

-- question_options: same as questions
create policy "options: read" on question_options for select using (
  exists (
    select 1 from questions qu
    join quizzes qz on qz.id = qu.quiz_id
    where qu.id = question_id and (qz.is_public or qz.creator_id = auth.uid())
  )
);
create policy "options: manage" on question_options for all using (
  exists (
    select 1 from questions qu
    join quizzes qz on qz.id = qu.quiz_id
    where qu.id = question_id and qz.creator_id = auth.uid()
  )
);

-- qr_codes: all can read active codes; creators manage own
create policy "qr_codes: read active" on qr_codes for select using (is_active = true or auth.uid() = creator_id);
create policy "qr_codes: manage own" on qr_codes for all using (auth.uid() = creator_id);

-- qr_code_assignments: creators manage own QR
create policy "assignments: read" on qr_code_assignments for select using (
  exists (select 1 from qr_codes q where q.id = qr_code_id and q.creator_id = auth.uid())
);
create policy "assignments: manage" on qr_code_assignments for all using (
  exists (select 1 from qr_codes q where q.id = qr_code_id and q.creator_id = auth.uid())
);

-- quiz_attempts: users see own; anon access via service role
create policy "attempts: insert" on quiz_attempts for insert with check (true);
create policy "attempts: read own registered" on quiz_attempts for select using (auth.uid() = user_id);
create policy "attempts: read own anon" on quiz_attempts for select using (anonymous_id is not null);

-- ============================================================
-- Helper function: increment anonymous student points atomically
-- ============================================================
create or replace function increment_student_points(student_id uuid, points_to_add integer)
returns void language plpgsql security definer as $$
begin
  update anonymous_students
  set total_points = total_points + points_to_add
  where id = student_id;
end;
$$;
