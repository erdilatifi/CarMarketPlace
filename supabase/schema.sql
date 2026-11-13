-- AutoSphere database schema (Supabase / PostgreSQL)
-- Run this in the Supabase SQL editor before starting the app.

create table public.cars (
  id               uuid primary key default gen_random_uuid(),
  brand            text not null,
  model            text not null,
  year             int,
  price            numeric,
  mileage          int,
  gearbox          text,
  fuel_type        text,
  description      text,
  location_lat     double precision,
  location_lng     double precision,
  seller_id        uuid not null references auth.users (id) on delete cascade,
  seller_username  text,
  seller_phone     text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create table public.favorites (
  user_id     uuid not null references auth.users (id) on delete cascade,
  car_id      uuid not null references public.cars (id) on delete cascade,
  created_at  timestamptz default now(),
  primary key (user_id, car_id)
);

create table public.car_images (
  id          bigserial primary key,
  car_id      uuid not null references public.cars (id) on delete cascade,
  path        text not null,
  created_at  timestamptz default now()
);

-- Images are stored in a Supabase Storage bucket named "car-images".
