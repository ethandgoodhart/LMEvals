-- Users table (Supabase Auth manages this, but reference for foreign keys)
-- create table if not exists auth.users (
--   id uuid primary key,
--   email text
-- );

create table if not exists evals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  prompt text not null,
  eval_prompt text not null,
  models jsonb not null,
  created_at timestamp with time zone default now(),
  title text,
  author text,
  best_model text,
  best_model_icon text,
  best_model_score float,
  is_public boolean not null default false
);

create table if not exists eval_results (
  id uuid primary key default gen_random_uuid(),
  eval_id uuid references evals(id) on delete cascade,
  model text not null,
  score float,
  trials int,
  completions jsonb, -- array of { answer, score }
  created_at timestamp with time zone default now()
);

create table if not exists eval_upvotes (
  id uuid primary key default gen_random_uuid(),
  eval_id uuid references evals(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique (eval_id, user_id)
);

-- Index for search
create index if not exists evals_prompt_idx on evals using gin (to_tsvector('english', prompt)); 