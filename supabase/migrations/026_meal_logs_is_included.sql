-- meal_logs: allow keeping items visible but excluded from macro/kcal totals
alter table public.meal_logs
  add column if not exists is_included boolean not null default true;

comment on column public.meal_logs.is_included is
  'If false, the log remains in Plan but is excluded from kcal/macros totals.';

create index if not exists idx_meal_logs_included
  on public.meal_logs (user_id, date desc, is_included);
