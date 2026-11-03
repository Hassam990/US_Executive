begin;

do $$
declare
    policy_record record;
begin
    for policy_record in
        select policyname, tablename
        from pg_policies
        where schemaname = 'public'
          and tablename in ('bookings', 'drivers')
    loop
        execute format(
            'drop policy %I on public.%I',
            policy_record.policyname,
            policy_record.tablename
        );
    end loop;
end;
$$;

alter table public.bookings enable row level security;
alter table public.drivers enable row level security;

revoke all privileges on table public.bookings, public.drivers
    from public, anon, authenticated;

grant select, insert, update, delete on table public.bookings, public.drivers to service_role;

commit;
