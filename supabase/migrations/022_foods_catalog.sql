-- ============================================
-- Foods catalog (per user, scalable to thousands of rows)
-- meal_logs: optional food_id + macro snapshot for diary
-- ============================================

create table if not exists public.foods (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  name                    text not null,
  brand                   text,
  barcode                 text,
  kcal_100g               numeric(12, 2),
  protein_g_100g          numeric(12, 3),
  carbs_g_100g            numeric(12, 3),
  fat_g_100g              numeric(12, 3),
  default_serving_grams   numeric(12, 3),
  source                  text not null
    check (source in ('manual', 'voice', 'barcode', 'openfoodfacts', 'import')),
  openfoodfacts_code      text,
  voice_transcript        text,
  created_at              timestamptz default now() not null,
  updated_at              timestamptz default now() not null
);

comment on table public.foods is 'User food library; macros per 100g unless default_serving_grams defines a typical portion.';
comment on column public.foods.source is 'How the row was created: manual form, voice transcript, barcode scan, OFF API, or bulk import.';
comment on column public.foods.openfoodfacts_code is 'ODbL: attribute Open Food Facts in UI when set.';

create unique index if not exists foods_user_barcode_unique
  on public.foods (user_id, barcode)
  where barcode is not null;

create index if not exists idx_foods_user_created
  on public.foods (user_id, created_at desc);

create index if not exists idx_foods_user_name
  on public.foods (user_id, lower(name));

alter table public.foods enable row level security;

create policy "foods: select own"
  on public.foods for select using (auth.uid() = user_id);
create policy "foods: insert own"
  on public.foods for insert with check (auth.uid() = user_id);
create policy "foods: update own"
  on public.foods for update using (auth.uid() = user_id);
create policy "foods: delete own"
  on public.foods for delete using (auth.uid() = user_id);

drop trigger if exists on_foods_updated on public.foods;
create trigger on_foods_updated
  before update on public.foods
  for each row execute function public.handle_updated_at();

-- Link diary lines to catalog entries
alter table public.meal_logs
  add column if not exists food_id uuid references public.foods(id) on delete set null;

create index if not exists idx_meal_logs_food
  on public.meal_logs(user_id, food_id)
  where food_id is not null;

-- Widen macro_source for voice/barcode/catalog
alter table public.meal_logs drop constraint if exists meal_logs_macro_source_check;
alter table public.meal_logs
  add constraint meal_logs_macro_source_check
  check (
    macro_source is null
    or macro_source in (
      'openfoodfacts',
      'manual',
      'user_food',
      'catalog',
      'voice',
      'barcode'
    )
  );

-- Migrate legacy user_custom_foods -> foods (preserve ids for FK stability)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'user_custom_foods'
  ) then
    insert into public.foods (
      id, user_id, name, brand, barcode,
      kcal_100g, protein_g_100g, carbs_g_100g, fat_g_100g,
      default_serving_grams, source, openfoodfacts_code, voice_transcript,
      created_at, updated_at
    )
    select
      uc.id,
      uc.user_id,
      uc.name,
      null,
      null,
      uc.kcal_100g,
      uc.protein_g_100g,
      uc.carbs_g_100g,
      uc.fat_g_100g,
      null,
      'manual',
      null,
      null,
      uc.created_at,
      uc.updated_at
    from public.user_custom_foods uc
    on conflict (id) do nothing;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'meal_logs' and column_name = 'user_food_id'
    ) then
      update public.meal_logs ml
      set food_id = ml.user_food_id
      where ml.user_food_id is not null
        and ml.food_id is null;
    end if;
  end if;
end $$;
