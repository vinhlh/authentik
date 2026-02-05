-- Add role to profiles
alter table public.profiles
add column if not exists role text default 'user' check (role in ('user', 'admin'));

-- Create video_suggestions table
create table public.video_suggestions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  youtube_url text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'processing', 'completed', 'rejected', 'failed')),
  result_collection_id uuid references public.collections(id) on delete set null,
  logs jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.video_suggestions enable row level security;

-- Policies
create policy "Users can view their own suggestions"
  on public.video_suggestions for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own suggestions"
  on public.video_suggestions for insert
  with check ( auth.uid() = user_id );

create policy "Admins can view all suggestions"
  on public.video_suggestions for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

create policy "Admins can update suggestions"
  on public.video_suggestions for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- Admin policy for profiles (to allow admins to see roles of others if needed, though usually they just need their own)
create policy "Admins can see all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );
