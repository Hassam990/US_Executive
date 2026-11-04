begin;

alter table public.drivers
    add column if not exists application_data jsonb not null default '{}'::jsonb,
    add column if not exists application_status text not null default 'Application Received',
    add column if not exists status_updated_at timestamptz not null default now(),
    add column if not exists availability_status text not null default 'unavailable',
    add column if not exists availability_updated_at timestamptz,
    add column if not exists availability_history jsonb not null default '[]'::jsonb,
    add column if not exists vehicle_availability_status text not null default 'unavailable',
    add column if not exists vehicle_availability_updated_at timestamptz,
    add column if not exists vehicle_availability_history jsonb not null default '[]'::jsonb;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'drivers_application_status_check'
          and conrelid = 'public.drivers'::regclass
    ) then
        alter table public.drivers
            add constraint drivers_application_status_check
            check (application_status in (
                'Application Received',
                'Pending Licensing Approval',
                'Documents Pending',
                'Under Review',
                'Approved',
                'Active',
                'Rejected',
                'Suspended',
                'Inactive'
            ));
    end if;
end;
$$;

create index if not exists drivers_application_status_idx on public.drivers (application_status);
create index if not exists drivers_availability_status_idx on public.drivers (availability_status);

create table if not exists public.driver_expiry_reminders (
    driver_id text not null,
    document_key text not null,
    expiry_date date not null,
    days_before smallint not null check (days_before in (7, 30)),
    sent_at timestamptz not null default now(),
    primary key (driver_id, document_key, expiry_date, days_before)
);

alter table public.driver_expiry_reminders enable row level security;
revoke all privileges on table public.driver_expiry_reminders from public, anon, authenticated;
grant select, insert, update, delete on table public.driver_expiry_reminders to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'driver-application-documents',
    'driver-application-documents',
    false,
    8388608,
    array['application/pdf', 'image/jpeg', 'image/png']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Keep driver application documents private" on storage.objects;
create policy "Keep driver application documents private"
    on storage.objects
    as restrictive
    for all
    to anon, authenticated
    using (bucket_id <> 'driver-application-documents')
    with check (bucket_id <> 'driver-application-documents');

commit;
