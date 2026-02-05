-- Create a secure function to check if the current user is an admin
-- SECURITY DEFINER means it runs with the privileges of the creator (postgres/superuser), bypassing RLS
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

-- Drop problematic policies
drop policy if exists "Admins can view all suggestions" on public.video_suggestions;
drop policy if exists "Admins can update suggestions" on public.video_suggestions;
drop policy if exists "Admins can see all profiles" on public.profiles;

-- Re-create policies using the safe function
create policy "Admins can view all suggestions"
  on public.video_suggestions for select
  using ( is_admin() );

create policy "Admins can update suggestions"
  on public.video_suggestions for update
  using ( is_admin() );

create policy "Admins can see all profiles"
  on public.profiles for select
  using ( is_admin() );
