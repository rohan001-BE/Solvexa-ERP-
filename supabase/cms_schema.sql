-- ==============================================================================
-- CMS SCHEMA & INITIAL POSTS DATA
-- Run this script in your Supabase Dashboard: SQL Editor -> New query -> Run
-- ==============================================================================

create table if not exists cms_content (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title text,
  subtitle text,
  content_body text,
  image_url text,
  badge text,
  button_text text,
  button_url text,
  display_order int not null default 0,
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- RLS Policies
alter table cms_content enable row level security;

-- Allow public read access (for public home page and storefront visitors)
drop policy if exists "Allow public read access on cms_content" on cms_content;
create policy "Allow public read access on cms_content"
  on cms_content for select
  using (true);

-- Allow authenticated users to insert/update/delete
drop policy if exists "Allow authenticated full access on cms_content" on cms_content;
create policy "Allow authenticated full access on cms_content"
  on cms_content for all
  to authenticated
  using (true)
  with check (true);

-- Seed Rich Default CMS Posts
insert into cms_content (section_key, title, subtitle, content_body, image_url, badge, button_text, button_url, display_order, is_active) values 
(
  'hero',
  'Fresh Groceries Delivered Daily to Your Doorstep',
  'Solvexa Supermarket & Grocery ERP',
  'Explore high quality organic farm produce, fresh dairy, bakery goods, and everyday household essentials at wholesale prices with instant express checkout.',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
  '100% Organic & Farm Fresh',
  'Browse Catalog',
  '/products',
  1,
  true
),
(
  'promo_banner',
  'Ramadan & Weekly Mega Savings Discount',
  'Save up to 30% on All Pantry Essentials',
  'Stock up on premium Basmati rice, cold-pressed cooking oils, farm fresh eggs, and golden bakery biscuits. Limited time discounts applied across all store aisles.',
  'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=1200&auto=format&fit=crop&q=80',
  'Flash Deal',
  'Shop Deals',
  '/products',
  2,
  true
),
(
  'feature_fresh',
  'Guaranteed 100% Farm Fresh Harvest',
  'Handpicked Daily from Local Farmers',
  'Our fruits and vegetables are sourced early every morning from certified pesticide-free farms to ensure unbeatable nutrition, crispness, and rich natural taste.',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
  'Direct Farm Supply',
  'View Fresh Items',
  '/products',
  3,
  true
),
(
  'about',
  'Solving Grocery Logistics & Modern Retail Management',
  'Built with Royal Purple Heritage & Golden Margins',
  'Solvexa Grocery ERP is an enterprise-grade retail platform engineered for high-volume inventory management, double-entry financial ledger accounting, and rapid barcode POS checkout.',
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1200&auto=format&fit=crop&q=80',
  'Our Mission',
  'Learn More',
  '/about',
  4,
  true
),
(
  'contact',
  'Store Location, Helpline & Customer Support Desk',
  'We are Available 7 Days a Week (8:00 AM - 11:00 PM)',
  'Visit our flagship supermarket store or contact our centralized billing desk for bulk institutional orders and wholesale supply contracts.',
  'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=800&auto=format&fit=crop&q=80',
  'Support Center',
  'Contact Us',
  '/about',
  5,
  true
)
on conflict (section_key) do update set 
  title = excluded.title,
  subtitle = excluded.subtitle,
  content_body = excluded.content_body,
  image_url = excluded.image_url,
  badge = excluded.badge,
  button_text = excluded.button_text,
  button_url = excluded.button_url,
  display_order = excluded.display_order,
  is_active = excluded.is_active;

-- Update existing sample products with beautiful internet images if they lack an image_url
update products set image_url = case
  when lower(name) like '%milk%' or lower(name) like '%dairy%' then 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80'
  when lower(name) like '%egg%' then 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=600&auto=format&fit=crop&q=80'
  when lower(name) like '%apple%' or lower(name) like '%fruit%' then 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80'
  when lower(name) like '%banana%' then 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80'
  when lower(name) like '%bread%' or lower(name) like '%bakery%' then 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80'
  when lower(name) like '%rice%' or lower(name) like '%grain%' or lower(name) like '%flour%' then 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80'
  when lower(name) like '%oil%' or lower(name) like '%ghee%' then 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80'
  when lower(name) like '%tomato%' or lower(name) like '%veg%' then 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'
  when lower(name) like '%tea%' or lower(name) like '%chai%' then 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80'
  when lower(name) like '%coffee%' then 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&auto=format&fit=crop&q=80'
  when lower(name) like '%juice%' or lower(name) like '%drink%' or lower(name) like '%beverage%' then 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=600&auto=format&fit=crop&q=80'
  when lower(name) like '%chip%' or lower(name) like '%snack%' then 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80'
  when lower(name) like '%soap%' or lower(name) like '%clean%' or lower(name) like '%detergent%' then 'https://images.unsplash.com/photo-1585421514738-01798e348b17?w=600&auto=format&fit=crop&q=80'
  when lower(name) like '%cheese%' or lower(name) like '%butter%' then 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=600&auto=format&fit=crop&q=80'
  when lower(name) like '%chicken%' or lower(name) like '%meat%' then 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=600&auto=format&fit=crop&q=80'
  else 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&auto=format&fit=crop&q=80'
end
where image_url is null or image_url = '';
