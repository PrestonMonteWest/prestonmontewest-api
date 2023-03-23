create table post (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  summary text not null,
  content text not null,
  image_url text not null,
  category post_category not null,
  created_by text not null,
  publish_time timestamptz not null default now(),
  view_count integer not null default 0
);
