-- ============================================
-- Nutrition: Open Food Facts alignment + custom foods
-- ============================================
-- Open Food Facts (OFF) publishes products with:
--   - code: barcode (EAN/UPC) as string
--   - product_name, brands, quantity
--   - nutriments: energy-kcal_100g, proteins_100g, fat_100g, carbohydrates_100g
--     (and *_serving when nutrition_data_per is "serving")
-- We do NOT mirror the full OFF document in Postgres; the app calls the OFF API
-- and stores a per-log snapshot on meal_logs (energy for the portion logged).
--
-- License: OFF database is ODbL — attribute "Open Food Facts" in the UI where
-- product data is shown; images are CC BY-SA. See https://wiki.openfoodfacts.org/ODBL_License
-- ============================================

-- Per-user reusable foods (manual macros, no barcode)
create table if not exists public.user_custom_foods (
  id          uuid default gen_random_uuid() primary key,
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  -- Values per 100 g (same basis as OFF nutriments_*_100g); user can edit anytime
  kcal_100g       numeric(12, 2),
  protein_g_100g  numeric(12, 3),
  carbs_g_100g    numeric(12, 3),
  fat_g_100g      numeric(12, 3),
  notes       text,
  created_at  timestamptz default now() not null,
  updated_at  timestamptz default now() not null
);

create index if not exists idx_user_custom_foods_user
  on public.user_custom_foods(user_id);

alter table public.user_custom_foods enable row level security;

create policy "user_custom_foods: select own"
  on public.user_custom_foods for select using (auth.uid() = user_id);
create policy "user_custom_foods: insert own"
  on public.user_custom_foods for insert with check (auth.uid() = user_id);
create policy "user_custom_foods: update own"
  on public.user_custom_foods for update using (auth.uid() = user_id);
create policy "user_custom_foods: delete own"
  on public.user_custom_foods for delete using (auth.uid() = user_id);

drop trigger if exists on_user_custom_foods_updated on public.user_custom_foods;
create trigger on_user_custom_foods_updated
  before update on public.user_custom_foods
  for each row execute function public.handle_updated_at();

-- meal_logs: link to OFF barcode + macro snapshot for this log line (totals for the portion)
alter table public.meal_logs
  add column if not exists openfoodfacts_code text,
  add column if not exists product_display_name text,
  add column if not exists macro_source text
    check (macro_source is null or macro_source in ('openfoodfacts', 'manual', 'user_food')),
  add column if not exists user_food_id uuid references public.user_custom_foods(id) on delete set null,
  add column if not exists portion_grams numeric(12, 3),
  add column if not exists energy_kcal numeric(12, 2),
  add column if not exists protein_g numeric(12, 3),
  add column if not exists carbs_g numeric(12, 3),
  add column if not exists fat_g numeric(12, 3);

comment on column public.meal_logs.openfoodfacts_code is 'Barcode from Open Food Facts product.code; ODbL attribution required in UI.';
comment on column public.meal_logs.product_display_name is 'Snapshot: OFF product_name or custom title at log time.';
comment on column public.meal_logs.macro_source is 'openfoodfacts | manual | user_food; null = legacy rows before macros.';
comment on column public.meal_logs.portion_grams is 'Grams consumed when macros were computed from per-100g values.';
comment on column public.meal_logs.energy_kcal is 'Total kcal for this log line (portion), not per 100g.';
comment on column public.user_custom_foods.kcal_100g is 'Per 100g, comparable to OFF nutriments energy-kcal_100g.';

create index if not exists idx_meal_logs_off_code
  on public.meal_logs(user_id, openfoodfacts_code)
  where openfoodfacts_code is not null;
