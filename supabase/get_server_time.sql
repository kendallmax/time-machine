create or replace function public.get_server_time()
returns timestamptz
language sql
security definer
set search_path = public
as $$
  select now();
$$;

grant execute on function public.get_server_time() to anon;
grant execute on function public.get_server_time() to authenticated;
