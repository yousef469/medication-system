-- Create Posts Table
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users(id) not null,
  user_name text not null,
  user_role text not null,
  content text not null,
  hospital_name text,
  likes integer default 0,
  category text default 'general' -- 'emergency', 'announcement', 'case_study'
);

-- Create Comments Table
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references auth.users(id) not null,
  user_name text not null,
  content text not null
);

-- RLS Policies (Simplified for Demo)
alter table posts enable row level security;
alter table comments enable row level security;

create policy "Public Read Posts" on posts for select using (true);
create policy "Authenticated Create Posts" on posts for insert with check (auth.role() = 'authenticated');

create policy "Public Read Comments" on comments for select using (true);
create policy "Authenticated Create Comments" on comments for insert with check (auth.role() = 'authenticated');
