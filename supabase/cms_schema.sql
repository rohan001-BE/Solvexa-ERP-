-- ==============================================================================
-- CMS SCHEMA ADDITION
-- Run this script in your Supabase Dashboard: SQL Editor -> New query -> Run
-- ==============================================================================

create table if not exists cms_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title text,
  subtitle text,
  content_body text,
  image_url text,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- RLS Policies
alter table cms_content enable row level security;

-- Allow public read access (for the public home page)
create policy "Allow public read access on cms_content"
  on cms_content for select
  using (is_active = true);

-- Allow authenticated users to update
create policy "Allow authenticated update on cms_content"
  on cms_content for all
  to authenticated
  using (true)
  with check (true);

-- Insert Default CMS Content
insert into cms_content (section_key, title, subtitle, content_body) values 
('hero', 'Fresh Groceries Delivered Daily', 'Shop the best quality organic produce and daily essentials from Solvexa Store.', 'Welcome to Solvexa Grocery Store.'),
('about', 'About Solvexa', 'Quality You Can Trust', 'Solvexa Grocery ERP is your one-stop solution for managing daily inventory, POS, and sales with ease and precision.'),
('contact', 'Get In Touch', 'We are here to help!', 'Email: support@solvexa.com | Phone: +92 300 1234567')
on conflict (section_key) do nothing;
