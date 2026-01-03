-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO ADD SOUNDCLOUD SUPPORT

-- Add soundcloud_url column to posts table if it doesn't exist
alter table posts add column if not exists soundcloud_url text;
