-- ==============================================================================
-- SOLVEXA GROCERY ERP - COMPLETE DATABASE SCHEMA & RPC MIGRATION
-- Run this script in your Supabase Dashboard: SQL Editor -> New query -> Run
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- 2. ROLES & PERMISSIONS
create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text
);

create table if not exists role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- 3. PROFILES (linked 1:1 to auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role_id uuid references roles(id),
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helper: does the current user have a given permission?
create or replace function has_permission(p_code text)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from profiles pr
    join role_permissions rp on rp.role_id = pr.role_id
    join permissions p on p.id = rp.permission_id
    where pr.id = auth.uid()
      and pr.is_active = true
      and p.code = p_code
  );
$$;

-- Helper: is the current user an Admin?
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from profiles pr
    join roles r on r.id = pr.role_id
    where pr.id = auth.uid() and r.name = 'Admin'
  );
$$;

-- 4. CATEGORIES & UNITS
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  symbol text not null,
  is_active boolean not null default true
);

-- 5. PRODUCTS
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  barcode text unique,
  category_id uuid references categories(id) on delete set null,
  unit_id uuid references units(id) on delete set null,
  brand text,
  purchase_price numeric(12,2) not null default 0 check (purchase_price >= 0),
  sale_price numeric(12,2) not null default 0 check (sale_price >= 0),
  tax_rate numeric(5,2) not null default 0 check (tax_rate >= 0),
  minimum_stock numeric(12,2) not null default 0 check (minimum_stock >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. INVENTORY
create table if not exists inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references products(id) on delete cascade,
  quantity numeric(14,2) not null default 0 check (quantity >= 0),
  reserved_quantity numeric(14,2) not null default 0 check (reserved_quantity >= 0),
  minimum_stock numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

-- 7. INVENTORY MOVEMENTS
do $$ begin
  create type movement_type as enum (
    'OPENING_STOCK', 'PURCHASE', 'SALE', 'SALES_RETURN',
    'PURCHASE_RETURN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  type movement_type not null,
  quantity numeric(14,2) not null,
  reference_type text,
  reference_id uuid,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- 8. SUPPLIERS & CUSTOMERS
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  phone text,
  email text,
  address text,
  opening_balance numeric(14,2) not null default 0,
  current_balance numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Walk-in Customer',
  phone text,
  email text,
  address text,
  credit_limit numeric(14,2) not null default 0,
  current_balance numeric(14,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. PURCHASES & PURCHASE RETURNS
do $$ begin
  create type purchase_status as enum ('DRAFT', 'RECEIVED', 'CANCELLED');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type payment_status as enum ('UNPAID', 'PARTIAL', 'PAID');
exception
  when duplicate_object then null;
end $$;

create table if not exists purchases (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references suppliers(id),
  invoice_number text unique not null,
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  due_amount numeric(14,2) not null default 0,
  payment_status payment_status not null default 'UNPAID',
  status purchase_status not null default 'RECEIVED',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric(14,2) not null check (quantity > 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0),
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(14,2) not null
);

create table if not exists purchase_returns (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id),
  supplier_id uuid not null references suppliers(id),
  return_number text unique not null,
  reason text,
  total numeric(14,2) not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists purchase_return_items (
  id uuid primary key default gen_random_uuid(),
  purchase_return_id uuid not null references purchase_returns(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric(14,2) not null check (quantity > 0),
  unit_cost numeric(12,2) not null,
  total numeric(14,2) not null
);

-- 10. SALES (INVOICING) & SALES RETURNS
do $$ begin
  create type sale_status as enum ('CONFIRMED', 'CANCELLED');
exception
  when duplicate_object then null;
end $$;

create table if not exists sales (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique not null,
  customer_id uuid references customers(id),
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  due_amount numeric(14,2) not null default 0,
  payment_status payment_status not null default 'UNPAID',
  status sale_status not null default 'CONFIRMED',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric(14,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(14,2) not null
);

create table if not exists sales_returns (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id),
  customer_id uuid references customers(id),
  return_number text unique not null,
  reason text,
  total numeric(14,2) not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists sales_return_items (
  id uuid primary key default gen_random_uuid(),
  sales_return_id uuid not null references sales_returns(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric(14,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  total numeric(14,2) not null
);

-- 11. PAYMENTS
do $$ begin
  create type payment_method as enum (
    'CASH', 'BANK_TRANSFER', 'CARD', 'JAZZCASH', 'EASYPAISA', 'OTHER'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type payment_direction as enum ('IN', 'OUT');
exception
  when duplicate_object then null;
end $$;

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  direction payment_direction not null,
  sale_id uuid references sales(id),
  purchase_id uuid references purchases(id),
  customer_id uuid references customers(id),
  supplier_id uuid references suppliers(id),
  amount numeric(14,2) not null check (amount > 0),
  method payment_method not null default 'CASH',
  reference text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- 12. EXPENSES
create table if not exists expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  expense_category_id uuid references expense_categories(id),
  amount numeric(14,2) not null check (amount > 0),
  method payment_method not null default 'CASH',
  note text,
  expense_date date not null default current_date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- 13. AUDIT LOGS
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

-- 14. SETTINGS
create table if not exists settings (
  id boolean primary key default true check (id),
  store_name text not null default 'Solvexa Grocery Store',
  store_address text default 'Solvexa Main Market, Pakistan',
  store_phone text default '+92 300 1234567',
  currency text not null default 'PKR',
  default_tax_rate numeric(5,2) not null default 0,
  low_stock_alert_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into settings (id, store_name, currency)
values (true, 'Solvexa Grocery Store', 'PKR')
on conflict (id) do nothing;

-- 15. INDEXES
create index if not exists idx_products_category on products(category_id);
create index if not exists idx_inventory_movements_product on inventory_movements(product_id);
create index if not exists idx_purchases_supplier on purchases(supplier_id);
create index if not exists idx_purchase_items_purchase on purchase_items(purchase_id);
create index if not exists idx_sales_customer on sales(customer_id);
create index if not exists idx_sale_items_sale on sale_items(sale_id);
create index if not exists idx_payments_customer on payments(customer_id);
create index if not exists idx_payments_supplier on payments(supplier_id);
create index if not exists idx_expenses_date on expenses(expense_date);
create index if not exists idx_audit_logs_entity on audit_logs(entity_type, entity_id);

-- 16. SEED ROLES & PERMISSIONS
insert into roles (name, description) values
  ('Admin', 'Full administrative access to all ERP modules, settings, and users'),
  ('Manager', 'Operational store manager with full business access excluding settings/employee modification'),
  ('Purchasing Staff', 'Manages suppliers, purchases, and purchase returns'),
  ('Inventory Staff', 'Manages products, categories, units, and inventory adjustments'),
  ('Sales Staff', 'Manages customers, sales invoices, and sales returns'),
  ('Accountant', 'Manages payments, expenses, customer/supplier balances, and financial reports')
on conflict (name) do nothing;

insert into permissions (code, description) values
  ('view_dashboard', 'View dashboard overview and KPI statistics'),
  ('view_products', 'View product catalog'),
  ('create_products', 'Add new products'),
  ('edit_products', 'Update existing products'),
  ('delete_products', 'Deactivate or delete products'),
  ('view_categories', 'View product categories'),
  ('create_categories', 'Create product categories'),
  ('edit_categories', 'Update product categories'),
  ('view_units', 'View product measurement units'),
  ('create_units', 'Create units'),
  ('edit_units', 'Update units'),
  ('view_inventory', 'View inventory and stock movements'),
  ('adjust_inventory', 'Perform manual inventory adjustments'),
  ('view_suppliers', 'View suppliers'),
  ('create_suppliers', 'Add new suppliers'),
  ('edit_suppliers', 'Update supplier details'),
  ('view_purchases', 'View purchases'),
  ('create_purchases', 'Create purchase invoices'),
  ('edit_purchases', 'Edit purchases'),
  ('return_purchases', 'Create purchase returns'),
  ('view_customers', 'View customer directory'),
  ('create_customers', 'Add new customers'),
  ('edit_customers', 'Update customer information'),
  ('view_sales', 'View sales invoices'),
  ('create_sales', 'Create sales invoices'),
  ('edit_sales', 'Edit sales invoices'),
  ('return_sales', 'Create sales returns'),
  ('view_payments', 'View payment transactions'),
  ('create_payments', 'Record payments received or paid'),
  ('view_expenses', 'View expense records'),
  ('create_expenses', 'Record new expenses'),
  ('edit_expenses', 'Update expenses'),
  ('view_employees', 'View employee profiles'),
  ('create_employees', 'Invite or create employee profiles'),
  ('edit_employees', 'Update employee permissions and status'),
  ('view_reports', 'Access business and financial reports'),
  ('view_audit_logs', 'View system audit trail'),
  ('manage_settings', 'Modify store settings and configuration')
on conflict (code) do nothing;

-- Assign Admin all permissions
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r cross join permissions p
where r.name = 'Admin'
on conflict do nothing;

-- Assign Manager permissions
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.name = 'Manager'
  and p.code not in ('manage_settings', 'edit_employees', 'create_employees')
on conflict do nothing;

-- Assign Purchasing Staff
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.name = 'Purchasing Staff'
  and p.code in ('view_dashboard', 'view_products', 'view_categories', 'view_units', 'view_inventory', 'view_suppliers', 'create_suppliers', 'edit_suppliers', 'view_purchases', 'create_purchases', 'return_purchases', 'view_payments', 'view_reports')
on conflict do nothing;

-- Assign Inventory Staff
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.name = 'Inventory Staff'
  and p.code in ('view_dashboard', 'view_products', 'create_products', 'edit_products', 'view_categories', 'create_categories', 'edit_categories', 'view_units', 'create_units', 'edit_units', 'view_inventory', 'adjust_inventory', 'view_suppliers', 'view_purchases', 'view_customers', 'view_sales', 'view_reports')
on conflict do nothing;

-- Assign Sales Staff
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.name = 'Sales Staff'
  and p.code in ('view_dashboard', 'view_products', 'view_categories', 'view_units', 'view_inventory', 'view_customers', 'create_customers', 'edit_customers', 'view_sales', 'create_sales', 'return_sales', 'view_payments', 'view_reports')
on conflict do nothing;

-- Assign Accountant
insert into role_permissions (role_id, permission_id)
select r.id, p.id
from roles r, permissions p
where r.name = 'Accountant'
  and p.code in ('view_dashboard', 'view_products', 'view_inventory', 'view_suppliers', 'view_purchases', 'view_customers', 'view_sales', 'view_payments', 'create_payments', 'view_expenses', 'create_expenses', 'edit_expenses', 'view_reports')
on conflict do nothing;

-- Default units & categories seed
insert into units (name, symbol) values
  ('Kilogram', 'kg'),
  ('Gram', 'g'),
  ('Liter', 'L'),
  ('Milliliter', 'mL'),
  ('Piece', 'pc'),
  ('Pack', 'pk'),
  ('Box', 'box'),
  ('Dozen', 'dz')
on conflict (name) do nothing;

insert into categories (name, description) values
  ('Dairy & Eggs', 'Milk, butter, cheeses, eggs and yogurts'),
  ('Fruits & Vegetables', 'Fresh produce, fruits, herbs and vegetables'),
  ('Bakery & Snacks', 'Bread, biscuits, chips, and snacks'),
  ('Beverages', 'Juices, sodas, water, tea and coffee'),
  ('Grains & Rice', 'Flour, rice, lentils, spices and pulses'),
  ('Personal Care & Cleaning', 'Soaps, detergents, toiletries and cleaning supplies')
on conflict (name) do nothing;

insert into expense_categories (name) values
  ('Rent & Utilities'),
  ('Employee Salaries'),
  ('Maintenance & Repairs'),
  ('Transport & Logistics'),
  ('Packaging & Supplies'),
  ('Miscellaneous')
on conflict (name) do nothing;

-- Seed default Walk-in Customer
insert into customers (name, phone, address, credit_limit)
values ('Walk-in Customer', '000-0000000', 'In-Store', 0)
on conflict do nothing;

-- 17. AUTOMATIC PROFILE CREATION TRIGGER
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_admin_role_id uuid;
  v_user_count int;
begin
  select count(*) into v_user_count from public.profiles;
  select id into v_admin_role_id from public.roles where name = 'Admin' limit 1;

  -- rohan@gmail.com or the very first user automatically becomes the Admin
  insert into public.profiles (id, full_name, email, role_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    case 
      when lower(new.email) in ('rohan@gmail.com', 'admin@solvexa.com', 'admin@solvexastore.com') then v_admin_role_id
      when v_user_count = 0 then v_admin_role_id 
      else (select id from public.roles where name = 'Manager' limit 1)
    end
  )
  on conflict (id) do update set
    role_id = case 
      when lower(excluded.email) in ('rohan@gmail.com', 'admin@solvexa.com', 'admin@solvexastore.com') then v_admin_role_id
      else profiles.role_id
    end;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Note: Sign up rohan@gmail.com using the signup screen to trigger automatic Admin role assignment.

-- ==============================================================================
-- 18. ATOMIC RPC BUSINESS FUNCTIONS
-- ==============================================================================

-- 18.1 CREATE PURCHASE (atomic multi-table stock & balance update)
create or replace function create_purchase(
  p_supplier_id uuid,
  p_invoice_number text,
  p_items jsonb,
  p_paid_amount numeric,
  p_payment_method payment_method default 'CASH'
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_purchase_id uuid;
  v_item jsonb;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_line_total numeric;
begin
  if not (has_permission('create_purchases') or is_admin()) then
    raise exception 'Permission denied: create_purchases required';
  end if;

  insert into purchases (supplier_id, invoice_number, status, created_by)
  values (p_supplier_id, p_invoice_number, 'RECEIVED', auth.uid())
  returning id into v_purchase_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_line_total := (v_item->>'quantity')::numeric * (v_item->>'unit_cost')::numeric
                     - coalesce((v_item->>'discount')::numeric, 0)
                     + coalesce((v_item->>'tax')::numeric, 0);

    insert into purchase_items (purchase_id, product_id, quantity, unit_cost, discount, tax, total)
    values (
      v_purchase_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::numeric,
      (v_item->>'unit_cost')::numeric,
      coalesce((v_item->>'discount')::numeric, 0),
      coalesce((v_item->>'tax')::numeric, 0),
      v_line_total
    );

    -- Increase inventory
    insert into inventory (product_id, quantity)
    values ((v_item->>'product_id')::uuid, (v_item->>'quantity')::numeric)
    on conflict (product_id)
    do update set quantity = inventory.quantity + excluded.quantity,
                  updated_at = now();

    -- Record movement
    insert into inventory_movements (product_id, type, quantity, reference_type, reference_id, created_by)
    values (
      (v_item->>'product_id')::uuid, 'PURCHASE',
      (v_item->>'quantity')::numeric, 'purchase', v_purchase_id, auth.uid()
    );

    v_subtotal := v_subtotal + ((v_item->>'quantity')::numeric * (v_item->>'unit_cost')::numeric);
    v_total := v_total + v_line_total;
  end loop;

  update purchases
  set subtotal = v_subtotal,
      total = v_total,
      paid_amount = p_paid_amount,
      due_amount = v_total - p_paid_amount,
      payment_status = case
        when p_paid_amount <= 0 then 'UNPAID'
        when p_paid_amount >= v_total then 'PAID'
        else 'PARTIAL'
      end
  where id = v_purchase_id;

  if p_paid_amount > 0 then
    insert into payments (direction, purchase_id, supplier_id, amount, method, created_by)
    values ('OUT', v_purchase_id, p_supplier_id, p_paid_amount, p_payment_method, auth.uid());
  end if;

  update suppliers
  set current_balance = current_balance + (v_total - p_paid_amount)
  where id = p_supplier_id;

  insert into audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'purchase.create', 'purchases', v_purchase_id, jsonb_build_object('invoice', p_invoice_number, 'total', v_total));

  return v_purchase_id;
end;
$$;

-- 18.2 CREATE SALE (atomic invoicing, stock reservation check, stock deduction & payment)
create or replace function create_sale(
  p_customer_id uuid,
  p_invoice_number text,
  p_items jsonb,
  p_paid_amount numeric,
  p_payment_method payment_method default 'CASH'
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_available numeric;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_line_total numeric;
begin
  if not (has_permission('create_sales') or is_admin()) then
    raise exception 'Permission denied: create_sales required';
  end if;

  -- 1. Validate stock for every item before executing
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select (quantity - reserved_quantity) into v_available
    from inventory where product_id = (v_item->>'product_id')::uuid
    for update;

    if v_available is null or v_available < (v_item->>'quantity')::numeric then
      raise exception 'Insufficient stock for product % (available: %, requested: %)',
        (v_item->>'product_id'), coalesce(v_available, 0), (v_item->>'quantity');
    end if;
  end loop;

  -- 2. Create Sale Header
  insert into sales (customer_id, invoice_number, status, created_by)
  values (p_customer_id, p_invoice_number, 'CONFIRMED', auth.uid())
  returning id into v_sale_id;

  -- 3. Insert Items, Deduct Inventory, Record Movements
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_line_total := (v_item->>'quantity')::numeric * (v_item->>'unit_price')::numeric
                     - coalesce((v_item->>'discount')::numeric, 0)
                     + coalesce((v_item->>'tax')::numeric, 0);

    insert into sale_items (sale_id, product_id, quantity, unit_price, discount, tax, total)
    values (
      v_sale_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::numeric,
      (v_item->>'unit_price')::numeric,
      coalesce((v_item->>'discount')::numeric, 0),
      coalesce((v_item->>'tax')::numeric, 0),
      v_line_total
    );

    update inventory
    set quantity = quantity - (v_item->>'quantity')::numeric,
        updated_at = now()
    where product_id = (v_item->>'product_id')::uuid;

    insert into inventory_movements (product_id, type, quantity, reference_type, reference_id, created_by)
    values (
      (v_item->>'product_id')::uuid, 'SALE',
      -1 * (v_item->>'quantity')::numeric, 'sale', v_sale_id, auth.uid()
    );

    v_subtotal := v_subtotal + ((v_item->>'quantity')::numeric * (v_item->>'unit_price')::numeric);
    v_total := v_total + v_line_total;
  end loop;

  update sales
  set subtotal = v_subtotal,
      total = v_total,
      paid_amount = p_paid_amount,
      due_amount = v_total - p_paid_amount,
      payment_status = case
        when p_paid_amount <= 0 then 'UNPAID'
        when p_paid_amount >= v_total then 'PAID'
        else 'PARTIAL'
      end
  where id = v_sale_id;

  if p_paid_amount > 0 then
    insert into payments (direction, sale_id, customer_id, amount, method, created_by)
    values ('IN', v_sale_id, p_customer_id, p_paid_amount, p_payment_method, auth.uid());
  end if;

  if p_customer_id is not null and v_total > p_paid_amount then
    update customers
    set current_balance = current_balance + (v_total - p_paid_amount)
    where id = p_customer_id;
  end if;

  insert into audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'sale.create', 'sales', v_sale_id, jsonb_build_object('invoice', p_invoice_number, 'total', v_total));

  return v_sale_id;
end;
$$;

-- 18.3 CREATE PURCHASE RETURN
create or replace function create_purchase_return(
  p_purchase_id uuid,
  p_return_number text,
  p_items jsonb,
  p_reason text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_return_id uuid;
  v_supplier_id uuid;
  v_item jsonb;
  v_total numeric := 0;
  v_line_total numeric;
begin
  if not (has_permission('return_purchases') or is_admin()) then
    raise exception 'Permission denied';
  end if;

  select supplier_id into v_supplier_id from purchases where id = p_purchase_id;

  insert into purchase_returns (purchase_id, supplier_id, return_number, reason, created_by)
  values (p_purchase_id, v_supplier_id, p_return_number, p_reason, auth.uid())
  returning id into v_return_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_line_total := (v_item->>'quantity')::numeric * (v_item->>'unit_cost')::numeric;

    insert into purchase_return_items (purchase_return_id, product_id, quantity, unit_cost, total)
    values (
      v_return_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::numeric,
      (v_item->>'unit_cost')::numeric,
      v_line_total
    );

    update inventory
    set quantity = quantity - (v_item->>'quantity')::numeric,
        updated_at = now()
    where product_id = (v_item->>'product_id')::uuid;

    insert into inventory_movements (product_id, type, quantity, reference_type, reference_id, note, created_by)
    values (
      (v_item->>'product_id')::uuid, 'PURCHASE_RETURN',
      -1 * (v_item->>'quantity')::numeric, 'purchase_return', v_return_id, p_reason, auth.uid()
    );

    v_total := v_total + v_line_total;
  end loop;

  update purchase_returns set total = v_total where id = v_return_id;

  -- Decrease balance owed to supplier
  update suppliers
  set current_balance = current_balance - v_total
  where id = v_supplier_id;

  insert into audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'purchase_return.create', 'purchase_returns', v_return_id, jsonb_build_object('total', v_total));

  return v_return_id;
end;
$$;

-- 18.4 CREATE SALES RETURN
create or replace function create_sales_return(
  p_sale_id uuid,
  p_return_number text,
  p_items jsonb,
  p_reason text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_return_id uuid;
  v_customer_id uuid;
  v_item jsonb;
  v_total numeric := 0;
  v_line_total numeric;
begin
  if not (has_permission('return_sales') or is_admin()) then
    raise exception 'Permission denied';
  end if;

  select customer_id into v_customer_id from sales where id = p_sale_id;

  insert into sales_returns (sale_id, customer_id, return_number, reason, created_by)
  values (p_sale_id, v_customer_id, p_return_number, p_reason, auth.uid())
  returning id into v_return_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_line_total := (v_item->>'quantity')::numeric * (v_item->>'unit_price')::numeric;

    insert into sales_return_items (sales_return_id, product_id, quantity, unit_price, total)
    values (
      v_return_id,
      (v_item->>'product_id')::uuid,
      (v_item->>'quantity')::numeric,
      (v_item->>'unit_price')::numeric,
      v_line_total
    );

    update inventory
    set quantity = quantity + (v_item->>'quantity')::numeric,
        updated_at = now()
    where product_id = (v_item->>'product_id')::uuid;

    insert into inventory_movements (product_id, type, quantity, reference_type, reference_id, note, created_by)
    values (
      (v_item->>'product_id')::uuid, 'SALES_RETURN',
      (v_item->>'quantity')::numeric, 'sales_return', v_return_id, p_reason, auth.uid()
    );

    v_total := v_total + v_line_total;
  end loop;

  update sales_returns set total = v_total where id = v_return_id;

  if v_customer_id is not null then
    update customers
    set current_balance = current_balance - v_total
    where id = v_customer_id;
  end if;

  insert into audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'sales_return.create', 'sales_returns', v_return_id, jsonb_build_object('total', v_total));

  return v_return_id;
end;
$$;

-- 18.5 RECORD PAYMENT (standalone customer collection or supplier payout)
create or replace function record_payment(
  p_direction payment_direction,
  p_customer_id uuid default null,
  p_supplier_id uuid default null,
  p_sale_id uuid default null,
  p_purchase_id uuid default null,
  p_amount numeric default 0,
  p_method payment_method default 'CASH',
  p_reference text default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_payment_id uuid;
begin
  if not (has_permission('create_payments') or is_admin()) then
    raise exception 'Permission denied';
  end if;

  if p_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  insert into payments (direction, customer_id, supplier_id, sale_id, purchase_id, amount, method, reference, notes, created_by)
  values (p_direction, p_customer_id, p_supplier_id, p_sale_id, p_purchase_id, p_amount, p_method, p_reference, p_notes, auth.uid())
  returning id into v_payment_id;

  if p_direction = 'IN' and p_customer_id is not null then
    update customers set current_balance = current_balance - p_amount where id = p_customer_id;
  elsif p_direction = 'OUT' and p_supplier_id is not null then
    update suppliers set current_balance = current_balance - p_amount where id = p_supplier_id;
  end if;

  insert into audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'payment.create', 'payments', v_payment_id, jsonb_build_object('amount', p_amount, 'direction', p_direction));

  return v_payment_id;
end;
$$;

-- 18.6 MANUAL INVENTORY ADJUSTMENT
create or replace function adjust_inventory(
  p_product_id uuid,
  p_quantity numeric,
  p_direction text, -- 'IN' or 'OUT'
  p_note text
)
returns void
language plpgsql
security definer
as $$
declare
  v_qty numeric;
  v_type movement_type;
begin
  if not (has_permission('adjust_inventory') or is_admin()) then
    raise exception 'Permission denied';
  end if;

  if p_direction = 'IN' then
    v_qty := abs(p_quantity);
    v_type := 'ADJUSTMENT_IN';
    update inventory set quantity = quantity + v_qty, updated_at = now() where product_id = p_product_id;
  else
    v_qty := -1 * abs(p_quantity);
    v_type := 'ADJUSTMENT_OUT';
    update inventory set quantity = quantity - abs(p_quantity), updated_at = now() where product_id = p_product_id;
  end if;

  insert into inventory_movements (product_id, type, quantity, reference_type, note, created_by)
  values (p_product_id, v_type, v_qty, 'adjustment', p_note, auth.uid());

  insert into audit_logs (actor_id, action, entity_type, entity_id, after_data)
  values (auth.uid(), 'inventory.adjust', 'inventory', p_product_id, jsonb_build_object('quantity', v_qty, 'note', p_note));
end;
$$;

-- 18.7 DASHBOARD METRICS SUMMARY RPC
create or replace function get_dashboard_metrics()
returns jsonb
language plpgsql
security definer
stable
as $$
declare
  v_today_sales numeric := 0;
  v_today_purchases numeric := 0;
  v_total_products int := 0;
  v_low_stock_count int := 0;
  v_total_receivables numeric := 0;
  v_total_payables numeric := 0;
begin
  select coalesce(sum(total), 0) into v_today_sales
  from sales
  where created_at::date = current_date and status = 'CONFIRMED';

  select coalesce(sum(total), 0) into v_today_purchases
  from purchases
  where created_at::date = current_date and status = 'RECEIVED';

  select count(*) into v_total_products from products where is_active = true;

  select count(*) into v_low_stock_count
  from inventory i
  join products p on p.id = i.product_id
  where i.quantity <= p.minimum_stock and p.is_active = true;

  select coalesce(sum(current_balance), 0) into v_total_receivables
  from customers where is_active = true;

  select coalesce(sum(current_balance), 0) into v_total_payables
  from suppliers where is_active = true;

  return jsonb_build_object(
    'today_sales', v_today_sales,
    'today_purchases', v_today_purchases,
    'total_products', v_total_products,
    'low_stock_count', v_low_stock_count,
    'total_receivables', v_total_receivables,
    'total_payables', v_total_payables
  );
end;
$$;

-- ==============================================================================
-- 19. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table profiles enable row level security;
alter table roles enable row level security;
alter table permissions enable row level security;
alter table role_permissions enable row level security;
alter table categories enable row level security;
alter table units enable row level security;
alter table products enable row level security;
alter table inventory enable row level security;
alter table inventory_movements enable row level security;
alter table suppliers enable row level security;
alter table customers enable row level security;
alter table purchases enable row level security;
alter table purchase_items enable row level security;
alter table purchase_returns enable row level security;
alter table purchase_return_items enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table sales_returns enable row level security;
alter table sales_return_items enable row level security;
alter table payments enable row level security;
alter table expense_categories enable row level security;
alter table expenses enable row level security;
alter table audit_logs enable row level security;
alter table settings enable row level security;

-- Profiles: Authenticated users can view; users can update self; admins can manage
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select using (auth.uid() is not null);

drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update using (auth.uid() = id or is_admin());

drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles for insert with check (auth.uid() = id or is_admin());

-- Roles & Permissions: Authenticated users can view
drop policy if exists roles_select on roles;
create policy roles_select on roles for select using (auth.uid() is not null);

drop policy if exists permissions_select on permissions;
create policy permissions_select on permissions for select using (auth.uid() is not null);

drop policy if exists role_permissions_select on role_permissions;
create policy role_permissions_select on role_permissions for select using (auth.uid() is not null);

-- Categories & Units
drop policy if exists categories_select on categories;
create policy categories_select on categories for select using (auth.uid() is not null);
drop policy if exists categories_all on categories;
create policy categories_all on categories for all using (has_permission('edit_categories') or is_admin());

drop policy if exists units_select on units;
create policy units_select on units for select using (auth.uid() is not null);
drop policy if exists units_all on units;
create policy units_all on units for all using (has_permission('edit_units') or is_admin());

-- Products
drop policy if exists products_select on products;
create policy products_select on products for select using (has_permission('view_products') or is_admin());
drop policy if exists products_insert on products;
create policy products_insert on products for insert with check (has_permission('create_products') or is_admin());
drop policy if exists products_update on products;
create policy products_update on products for update using (has_permission('edit_products') or is_admin());
drop policy if exists products_delete on products;
create policy products_delete on products for delete using (is_admin());

-- Inventory & Movements (Read only; mutates through RPC)
drop policy if exists inventory_select on inventory;
create policy inventory_select on inventory for select using (has_permission('view_inventory') or is_admin());

drop policy if exists movements_select on inventory_movements;
create policy movements_select on inventory_movements for select using (has_permission('view_inventory') or is_admin());

-- Suppliers & Purchases
drop policy if exists suppliers_select on suppliers;
create policy suppliers_select on suppliers for select using (has_permission('view_suppliers') or is_admin());
drop policy if exists suppliers_all on suppliers;
create policy suppliers_all on suppliers for all using (has_permission('edit_suppliers') or has_permission('create_suppliers') or is_admin());

drop policy if exists purchases_select on purchases;
create policy purchases_select on purchases for select using (has_permission('view_purchases') or is_admin());
drop policy if exists purchase_items_select on purchase_items;
create policy purchase_items_select on purchase_items for select using (has_permission('view_purchases') or is_admin());

drop policy if exists purchase_returns_select on purchase_returns;
create policy purchase_returns_select on purchase_returns for select using (has_permission('view_purchases') or is_admin());
drop policy if exists purchase_return_items_select on purchase_return_items;
create policy purchase_return_items_select on purchase_return_items for select using (has_permission('view_purchases') or is_admin());

-- Customers & Sales
drop policy if exists customers_select on customers;
create policy customers_select on customers for select using (has_permission('view_customers') or is_admin());
drop policy if exists customers_all on customers;
create policy customers_all on customers for all using (has_permission('edit_customers') or has_permission('create_customers') or is_admin());

drop policy if exists sales_select on sales;
create policy sales_select on sales for select using (has_permission('view_sales') or is_admin());
drop policy if exists sale_items_select on sale_items;
create policy sale_items_select on sale_items for select using (has_permission('view_sales') or is_admin());

drop policy if exists sales_returns_select on sales_returns;
create policy sales_returns_select on sales_returns for select using (has_permission('view_sales') or is_admin());
drop policy if exists sales_return_items_select on sales_return_items;
create policy sales_return_items_select on sales_return_items for select using (has_permission('view_sales') or is_admin());

-- Payments
drop policy if exists payments_select on payments;
create policy payments_select on payments for select using (has_permission('view_payments') or is_admin());

-- Expenses
drop policy if exists expenses_select on expenses;
create policy expenses_select on expenses for select using (has_permission('view_expenses') or is_admin());
drop policy if exists expense_categories_select on expense_categories;
create policy expense_categories_select on expense_categories for select using (has_permission('view_expenses') or is_admin());
drop policy if exists expenses_all on expenses;
create policy expenses_all on expenses for all using (has_permission('create_expenses') or is_admin());

-- Audit Logs & Settings
drop policy if exists audit_logs_select on audit_logs;
create policy audit_logs_select on audit_logs for select using (has_permission('view_audit_logs') or is_admin());

drop policy if exists settings_select on settings;
create policy settings_select on settings for select using (auth.uid() is not null);
drop policy if exists settings_update on settings;
create policy settings_update on settings for update using (is_admin());
