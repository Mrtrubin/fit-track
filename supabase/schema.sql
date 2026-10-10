-- ============================================================
-- FitTrack 我的健身 · Supabase 建表脚本（含 Row Level Security）
-- 在 Supabase Dashboard → SQL Editor 中一次性执行。
-- 执行后到 .env.local 填写项目 URL 与 anon key 即可启用云端同步。
-- ============================================================

-- ---------- 1. users ----------
create table if not exists public.users (
  id text primary key default gen_random_text(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 2. profiles ----------
create table if not exists public.profiles (
  id text primary key default gen_random_text(),
  user_id text not null references public.users(id) on delete cascade,
  name text not null,
  gender text not null check (gender in ('male','female')),
  age int not null,
  height_cm numeric not null,
  weight_kg numeric not null,
  body_fat_pct numeric,
  activity_level text not null check (activity_level in ('sedentary','light','moderate','high','athlete')),
  training_days_per_week int not null default 3,
  training_minutes_per_session int not null default 60,
  goal text not null check (goal in ('fat_loss','muscle_gain','maintain','recomp')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 3. goals ----------
create table if not exists public.goals (
  id text primary key default gen_random_text(),
  user_id text not null references public.users(id) on delete cascade,
  goal text not null check (goal in ('fat_loss','muscle_gain','maintain','recomp')),
  target_calories int not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  protein_factor numeric not null default 1.8,
  fat_factor numeric not null default 0.8,
  pace text,
  updated_at timestamptz not null default now()
);

-- ---------- 4. foods ----------
create table if not exists public.foods (
  id text primary key default gen_random_text(),
  user_id text references public.users(id) on delete cascade, -- null = 系统预置
  name text not null,
  category text not null,
  brand text,
  calories_per_100g numeric not null,
  protein_per_100g numeric not null default 0,
  carbs_per_100g numeric not null default 0,
  fat_per_100g numeric not null default 0,
  fiber_per_100g numeric not null default 0,
  serving_size numeric not null default 100,
  source text not null default '',
  is_custom boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- 5. daily_food_logs ----------
create table if not exists public.daily_food_logs (
  id text primary key default gen_random_text(),
  user_id text not null references public.users(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ---------- 6. food_log_items ----------
create table if not exists public.food_log_items (
  id text primary key default gen_random_text(),
  log_id text not null references public.daily_food_logs(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  food_id text not null references public.foods(id),
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  grams numeric not null,
  created_at timestamptz not null default now()
);

-- ---------- 7. exercises ----------
create table if not exists public.exercises (
  id text primary key default gen_random_text(),
  name text not null,
  category text not null,
  primary_muscle text not null,
  secondary_muscle text,
  equipment text not null,
  difficulty text not null,
  instructions jsonb not null default '[]',
  tips jsonb not null default '[]',
  common_mistakes jsonb not null default '[]',
  recommended_sets int not null default 3,
  recommended_reps text not null default '10-12',
  recommended_rest_sec int not null default 90,
  image_url text,
  video_url text,
  created_at timestamptz not null default now()
);

-- ---------- 8. workout_plans ----------
create table if not exists public.workout_plans (
  id text primary key default gen_random_text(),
  user_id text references public.users(id) on delete cascade, -- null = 系统模板
  name text not null,
  level text not null,
  goal text not null,
  days_per_week int not null default 3,
  description text not null default '',
  is_custom boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- 9. workout_plan_exercises ----------
create table if not exists public.workout_plan_exercises (
  id text primary key default gen_random_text(),
  plan_id text not null references public.workout_plans(id) on delete cascade,
  day int not null,
  body_part text not null,
  exercise_id text not null references public.exercises(id),
  sets int not null default 3,
  reps text not null,
  rir text not null default '1-3',
  rest_sec int not null default 90,
  sort_order int not null default 0
);

-- ---------- 10. workout_sessions ----------
create table if not exists public.workout_sessions (
  id text primary key default gen_random_text(),
  user_id text not null references public.users(id) on delete cascade,
  date date not null,
  title text not null,
  body_parts text not null default '',
  duration_min int,
  notes text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- 11. workout_sets ----------
create table if not exists public.workout_sets (
  id text primary key default gen_random_text(),
  session_id text not null references public.workout_sessions(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  exercise_id text not null references public.exercises(id),
  exercise_name text not null,
  set_number int not null,
  weight_kg numeric not null,
  reps int not null,
  rpe numeric,
  rir numeric,
  target_sets int not null,
  target_reps text not null,
  created_at timestamptz not null default now()
);

-- ---------- 12. body_records ----------
create table if not exists public.body_records (
  id text primary key default gen_random_text(),
  user_id text not null references public.users(id) on delete cascade,
  date date not null,
  weight_kg numeric not null,
  body_fat_pct numeric,
  waist_cm numeric,
  chest_cm numeric,
  hip_cm numeric,
  thigh_cm numeric,
  arm_cm numeric,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ---------- 13. daily_calories ----------
create table if not exists public.daily_calories (
  id text primary key default gen_random_text(),
  user_id text not null references public.users(id) on delete cascade,
  date date not null,
  strength_min int not null default 0,
  cardio_min int not null default 0,
  exercise_burn_est numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- ============================================================
-- 索引
-- ============================================================
create index if not exists idx_profiles_user on public.profiles(user_id);
create index if not exists idx_goals_user on public.goals(user_id);
create index if not exists idx_foods_user on public.foods(user_id);
create index if not exists idx_food_logs_user_date on public.daily_food_logs(user_id, date);
create index if not exists idx_food_items_log on public.food_log_items(log_id);
create index if not exists idx_food_items_user on public.food_log_items(user_id);
create index if not exists idx_plan_exercises_plan on public.workout_plan_exercises(plan_id);
create index if not exists idx_sessions_user_date on public.workout_sessions(user_id, date);
create index if not exists idx_sets_session on public.workout_sets(session_id);
create index if not exists idx_sets_user on public.workout_sets(user_id);
create index if not exists idx_body_records_user_date on public.body_records(user_id, date);
create index if not exists idx_daily_calories_user_date on public.daily_calories(user_id, date);

-- ============================================================
-- Row Level Security（数据按用户隔离，一个用户看不到另一个用户的数据）
-- 系统预置数据（user_id IS NULL）：已登录用户可读，不可改。
-- 用户自己的数据：仅本人可增删改查。
-- ============================================================
alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.foods enable row level security;
alter table public.daily_food_logs enable row level security;
alter table public.food_log_items enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_plan_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;
alter table public.body_records enable row level security;
alter table public.daily_calories enable row level security;

-- users：仅本人可见（通过 auth.uid() 关联）
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own" on public.users for select using (id = auth.uid()::text);
drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own" on public.users for insert with check (id = auth.uid()::text);
drop policy if exists "users_update_own" on public.users;
create policy "users_update_own" on public.users for update using (id = auth.uid()::text);

-- 用户数据表通用策略：user_id = auth.uid()::text（本地生成的 text 字符串与 auth uid 一致）
do $$
declare t text;
begin
  foreach t in array array['profiles','goals','daily_food_logs','food_log_items','workout_sessions','workout_sets','body_records','daily_calories']
  loop
    execute format('drop policy if exists "own_select_%s" on public.%I', t, t);
    execute format('create policy "own_select_%s" on public.%I for select using (user_id = auth.uid()::text)', t, t);
    execute format('drop policy if exists "own_insert_%s" on public.%I', t, t);
    execute format('create policy "own_insert_%s" on public.%I for insert with check (user_id = auth.uid()::text)', t, t);
    execute format('drop policy if exists "own_update_%s" on public.%I', t, t);
    execute format('create policy "own_update_%s" on public.%I for update using (user_id = auth.uid()::text)', t, t);
    execute format('drop policy if exists "own_delete_%s" on public.%I', t, t);
    execute format('create policy "own_delete_%s" on public.%I for delete using (user_id = auth.uid()::text)', t, t);
  end loop;
end $$;

-- foods：系统预置可读，自定义仅本人可改
drop policy if exists "foods_read" on public.foods;
create policy "foods_read" on public.foods for select using (user_id is null or user_id = auth.uid()::text);
drop policy if exists "foods_insert_own" on public.foods;
create policy "foods_insert_own" on public.foods for insert with check (user_id = auth.uid()::text);
drop policy if exists "foods_update_own" on public.foods;
create policy "foods_update_own" on public.foods for update using (user_id = auth.uid()::text);
drop policy if exists "foods_delete_own" on public.foods;
create policy "foods_delete_own" on public.foods for delete using (user_id = auth.uid()::text);

-- exercises：全员可读（系统数据，无用户私有动作）
drop policy if exists "exercises_read_all" on public.exercises;
create policy "exercises_read_all" on public.exercises for select using (true);

-- workout_plans：系统模板可读，用户计划仅本人可改
drop policy if exists "plans_read" on public.workout_plans;
create policy "plans_read" on public.workout_plans for select using (user_id is null or user_id = auth.uid()::text);
drop policy if exists "plans_insert_own" on public.workout_plans;
create policy "plans_insert_own" on public.workout_plans for insert with check (user_id = auth.uid()::text);
drop policy if exists "plans_update_own" on public.workout_plans;
create policy "plans_update_own" on public.workout_plans for update using (user_id = auth.uid()::text);
drop policy if exists "plans_delete_own" on public.workout_plans;
create policy "plans_delete_own" on public.workout_plans for delete using (user_id = auth.uid()::text);

-- workout_plan_exercises：跟随计划（计划可读则该动作可读；用户计划动作仅本人可改）
drop policy if exists "plan_exercises_read" on public.workout_plan_exercises;
create policy "plan_exercises_read" on public.workout_plan_exercises
  for select using (
    exists (select 1 from public.workout_plans p where p.id = plan_id and (p.user_id is null or p.user_id = auth.uid()::text))
  );
drop policy if exists "plan_exercises_insert_own" on public.workout_plan_exercises;
create policy "plan_exercises_insert_own" on public.workout_plan_exercises
  for insert with check (
    exists (select 1 from public.workout_plans p where p.id = plan_id and p.user_id = auth.uid()::text)
  );
drop policy if exists "plan_exercises_update_own" on public.workout_plan_exercises;
create policy "plan_exercises_update_own" on public.workout_plan_exercises
  for update using (
    exists (select 1 from public.workout_plans p where p.id = plan_id and p.user_id = auth.uid()::text)
  );
drop policy if exists "plan_exercises_delete_own" on public.workout_plan_exercises;
create policy "plan_exercises_delete_own" on public.workout_plan_exercises
  for delete using (
    exists (select 1 from public.workout_plans p where p.id = plan_id and p.user_id = auth.uid()::text)
  );

-- ============================================================
-- updated_at 自动更新
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['users','profiles','goals','foods','daily_food_logs','daily_calories']
  loop
    execute format('drop trigger if exists trg_touch_%s on public.%I', t, t);
    execute format('create trigger trg_touch_%s before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;


