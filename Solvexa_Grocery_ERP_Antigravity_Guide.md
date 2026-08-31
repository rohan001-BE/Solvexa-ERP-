# Solvexa Grocery ERP
## Complete Build Specification for Antigravity

**Project:** Solvexa Grocery ERP
**Business Type:** Grocery Store
**Scope:** ERP only — **no POS / checkout terminal module**
**Frontend:** Next.js (App Router) + TypeScript — single stack, no other frontend framework
**Backend/Data:** Supabase (PostgreSQL, Auth, Storage, RLS)
**UI:** Modern, responsive, professional admin dashboard
**Primary Goal:** Build a production-ready Grocery ERP that lets the owner run purchasing, inventory, sales/invoicing, customers, suppliers, expenses, and reporting from one system.

---

# 1. Project Objective

Build a complete **ERP (Enterprise Resource Planning)** system for **Solvexa Grocery Store**.

This is explicitly **not** a point-of-sale checkout app. There is no barcode-scanning checkout screen, no cash-drawer terminal UI, and no "add to cart → pay → print receipt" retail counter flow. Instead, **Sales** is a back-office invoicing module: staff create a sales invoice for a customer, it deducts inventory and records payment/credit, exactly like a purchase invoice does in reverse.

The system must manage:

- Employees, authentication, roles and permissions
- Dashboard (business overview)
- Products, categories, units
- Inventory and inventory movement history
- Suppliers and purchases (incl. purchase returns)
- Customers and sales invoicing (incl. sales returns)
- Payments (received and paid), customer credit, supplier payables
- Expenses
- Reports
- Audit logs
- Settings

The application must let the business be operated end-to-end — buying stock, tracking inventory, invoicing customers, tracking money owed and owing — from one central system.

---

# 2. Core Business Flow

```text
Supplier
   ↓
Purchase Invoice
   ↓
Inventory Increases
   ↓
Products Available in Stock
   ↓
Sales Invoice (to a Customer)
   ↓
Inventory Decreases
   ↓
Payment Recorded (full / partial / credit)
   ↓
Reports Updated
```

Customer credit flow:

```text
Sales Invoice
   ↓
Partial or No Payment
   ↓
Customer Balance Increases
   ↓
Later Payment Received
   ↓
Customer Balance Reduced
```

Sales return flow:

```text
Customer Returns Product
   ↓
Sales Return Created (linked to original sale)
   ↓
Inventory Increases
   ↓
Refund or Customer Credit Adjustment
```

Purchase return flow:

```text
Defective / Excess Stock
   ↓
Purchase Return Created (linked to original purchase)
   ↓
Inventory Decreases
   ↓
Supplier Balance Updated
```

---

# 3. Important Development Rules

Antigravity must follow these rules:

1. Do not build everything in one huge component.
2. Use reusable components.
3. Keep business logic separate from UI (services layer).
4. Use TypeScript strictly; avoid `any` unless truly unavoidable.
5. Validate all user input (client with Zod, and again server-side).
6. Never trust frontend permission checks alone — enforce everything in Postgres via RLS.
7. Never expose Supabase secret/service-role keys in browser code.
8. Use database transactions/RPC functions for any operation that touches multiple related tables (e.g., a sale that creates a sale record, sale items, a payment, and an inventory movement).
9. Maintain a full inventory movement history — never silently change stock without a movement row.
10. Use soft deletion (`is_active` / `deleted_at`) for records with transaction history; never hard-delete.
11. Every screen needs loading, empty, error, and success states.
12. Make the application fully responsive (desktop-first admin panel, usable on tablet).
13. Use confirmation dialogs for destructive or financially significant actions.
14. Keep audit logs for administrative and financial changes.
15. Do not over-engineer version 1 — build the MVP first, then layer on advanced modules.
16. **Do not build a POS/checkout screen, cash-register session module, or barcode-scan-to-cart flow.** Sales is a standard invoice form, not a retail terminal.

---

# 4. Technology Stack

## Frontend — Next.js only

- Next.js (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui for components
- React Hook Form + Zod for forms/validation
- TanStack Query for data fetching/caching where useful
- Recharts for dashboard/report charts

No other frontend framework, meta-framework, or UI kit should be introduced. Everything client-side lives inside the Next.js app.

## Backend / Database — Supabase only

- Supabase Postgres as the single source of truth
- Supabase Auth (email + password) for authentication
- Supabase Storage for product images and file attachments
- Postgres functions (RPC) for atomic multi-table business operations
- Row Level Security (RLS) on every table

## Authentication

```text
Email
Password
Session
Logout
Password Reset
```

Do not build a custom/parallel auth system. Passwords are managed entirely by Supabase Auth.

## Deployment

- Frontend: any Next.js-compatible host (e.g. Vercel).
- Backend: Supabase project hosts Postgres, Auth, Storage, and the auto-generated/RPC APIs.

---

# 5. Application Structure

```text
solvexa-erp/
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── forgot-password/
│   │       └── page.tsx
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── products/
│   │   ├── categories/
│   │   ├── units/
│   │   ├── inventory/
│   │   ├── suppliers/
│   │   ├── purchases/
│   │   ├── purchase-returns/
│   │   ├── customers/
│   │   ├── sales/
│   │   ├── sales-returns/
│   │   ├── payments/
│   │   ├── expenses/
│   │   ├── employees/
│   │   ├── reports/
│   │   ├── audit-logs/
│   │   └── settings/
│   │
│   ├── api/
│   │   └── (route handlers only where server-side logic beyond RPC is needed)
│   │
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── layout/              # sidebar, topbar, shell
│   ├── dashboard/
│   ├── products/
│   ├── inventory/
│   ├── suppliers/
│   ├── purchases/
│   ├── customers/
│   ├── sales/
│   ├── payments/
│   ├── expenses/
│   ├── employees/
│   └── reports/
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # browser client
│   │   ├── server.ts        # server component / server action client
│   │   └── middleware.ts    # session refresh
│   ├── validations/         # Zod schemas
│   ├── permissions/         # permission-check helpers
│   └── utils/
│
├── services/
│   ├── products.service.ts
│   ├── inventory.service.ts
│   ├── purchases.service.ts
│   ├── sales.service.ts
│   ├── payments.service.ts
│   ├── expenses.service.ts
│   └── reports.service.ts
│
├── types/
│   └── database.types.ts    # generated from Supabase schema
│
├── hooks/
├── constants/
└── middleware.ts
```

---

# 6. Authentication

Use Supabase Auth with email and password only.

## Login

```text
Email
Password
Remember session
Login
```

## Forgot Password

```text
Email
Send Reset Link
```

## Logout

Users must be able to securely log out, clearing the Supabase session.

## Flow

```text
Login
 ↓
Supabase Auth
 ↓
Session
 ↓
Load Profile
 ↓
Load Role + Permissions
 ↓
Dashboard
```

`middleware.ts` should refresh the Supabase session on every request and redirect unauthenticated users away from `(dashboard)` routes to `/login`.

---

# 7. Roles & Permissions Model

## Roles

```text
Admin
Manager
Purchasing Staff
Inventory Staff
Sales Staff
Accountant
Staff (custom/limited)
```

## Permission examples

```text
view_dashboard

view_products        create_products        edit_products        delete_products
view_categories       create_categories      edit_categories
view_units             create_units           edit_units

view_inventory        adjust_inventory

view_suppliers        create_suppliers        edit_suppliers
view_purchases         create_purchases        edit_purchases        return_purchases

view_customers        create_customers        edit_customers
view_sales             create_sales            edit_sales            return_sales

view_payments          create_payments

view_expenses          create_expenses          edit_expenses

view_employees         create_employees         edit_employees

view_reports
view_audit_logs

manage_roles
manage_settings
```

## Default role access

| Module | Admin | Manager | Purchasing | Inventory | Sales | Accountant |
|---|---|---|---|---|---|---|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Products / Categories / Units | ✅ | ✅ | View | ✅ | View | View |
| Inventory | ✅ | ✅ | View | ✅ | View | View |
| Suppliers / Purchases | ✅ | ✅ | ✅ | View | ❌ | View |
| Customers / Sales | ✅ | ✅ | ❌ | View | ✅ | View |
| Payments | ✅ | ✅ | View | ❌ | View | ✅ |
| Expenses | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ |
| Employees | ✅ | View | ❌ | ❌ | ❌ | ❌ |
| Reports | ✅ | ✅ | View | View | View | ✅ |
| Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

This table is the starting seed for `role_permissions` — never hard-code it only in the frontend.

---

# 8. Supabase Database Schema (SQL)

Run this as your initial migration. All monetary/quantity columns use `NUMERIC` to avoid floating-point rounding errors. Every table has `created_at`, and mutable tables have `updated_at`.

```sql
-- =========================================================
-- EXTENSIONS
-- =========================================================
create extension if not exists "pgcrypto";

-- =========================================================
-- PROFILES  (linked 1:1 to auth.users)
-- =========================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role_id uuid,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- ROLES & PERMISSIONS
-- =========================================================
create table roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint profiles_role_fk foreign key (role_id) references roles(id);

create table permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,        -- e.g. 'create_products'
  description text
);

create table role_permissions (
  role_id uuid not null references roles(id) on delete cascade,
  permission_id uuid not null references permissions(id) on delete cascade,
  primary key (role_id, permission_id)
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

-- =========================================================
-- CATEGORIES & UNITS
-- =========================================================
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table units (
  id uuid primary key default gen_random_uuid(),
  name text not null,          -- e.g. Kilogram
  symbol text not null,        -- e.g. kg
  is_active boolean not null default true
);

-- =========================================================
-- PRODUCTS
-- =========================================================
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text unique,
  barcode text unique,
  category_id uuid references categories(id),
  unit_id uuid references units(id),
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

-- =========================================================
-- INVENTORY  (1 row per product = current stock snapshot)
-- =========================================================
create table inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique references products(id) on delete cascade,
  quantity numeric(14,2) not null default 0 check (quantity >= 0),
  reserved_quantity numeric(14,2) not null default 0 check (reserved_quantity >= 0),
  minimum_stock numeric(12,2) not null default 0,
  updated_at timestamptz not null default now()
);

-- =========================================================
-- INVENTORY MOVEMENTS  (audit trail — never write to inventory without this)
-- =========================================================
create type movement_type as enum (
  'OPENING_STOCK', 'PURCHASE', 'SALE', 'SALES_RETURN',
  'PURCHASE_RETURN', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT'
);

create table inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id),
  type movement_type not null,
  quantity numeric(14,2) not null,      -- positive = in, negative = out
  reference_type text,                  -- 'purchase' | 'sale' | 'purchase_return' | 'sales_return' | 'adjustment'
  reference_id uuid,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- SUPPLIERS & CUSTOMERS
-- =========================================================
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  phone text,
  email text,
  address text,
  opening_balance numeric(14,2) not null default 0,
  current_balance numeric(14,2) not null default 0,  -- amount WE owe the supplier
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Walk-in Customer',
  phone text,
  email text,
  address text,
  credit_limit numeric(14,2) not null default 0,
  current_balance numeric(14,2) not null default 0,  -- amount CUSTOMER owes us
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- PURCHASES
-- =========================================================
create type purchase_status as enum ('DRAFT', 'RECEIVED', 'CANCELLED');
create type payment_status as enum ('UNPAID', 'PARTIAL', 'PAID');

create table purchases (
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
  status purchase_status not null default 'DRAFT',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric(14,2) not null check (quantity > 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0),
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(14,2) not null
);

-- =========================================================
-- PURCHASE RETURNS
-- =========================================================
create table purchase_returns (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchases(id),
  supplier_id uuid not null references suppliers(id),
  return_number text unique not null,
  reason text,
  total numeric(14,2) not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table purchase_return_items (
  id uuid primary key default gen_random_uuid(),
  purchase_return_id uuid not null references purchase_returns(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric(14,2) not null check (quantity > 0),
  unit_cost numeric(12,2) not null,
  total numeric(14,2) not null
);

-- =========================================================
-- SALES (INVOICING — not a POS terminal)
-- =========================================================
create type sale_status as enum ('CONFIRMED', 'CANCELLED');

create table sales (
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

create table sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric(14,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  discount numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(14,2) not null
);

-- =========================================================
-- SALES RETURNS
-- =========================================================
create table sales_returns (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references sales(id),
  customer_id uuid references customers(id),
  return_number text unique not null,
  reason text,
  total numeric(14,2) not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table sales_return_items (
  id uuid primary key default gen_random_uuid(),
  sales_return_id uuid not null references sales_returns(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric(14,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null,
  total numeric(14,2) not null
);

-- =========================================================
-- PAYMENTS (money in from customers, money out to suppliers)
-- =========================================================
create type payment_method as enum (
  'CASH', 'BANK_TRANSFER', 'CARD', 'JAZZCASH', 'EASYPAISA', 'OTHER'
);
create type payment_direction as enum ('IN', 'OUT');

create table payments (
  id uuid primary key default gen_random_uuid(),
  direction payment_direction not null,   -- IN = from customer, OUT = to supplier
  sale_id uuid references sales(id),
  purchase_id uuid references purchases(id),
  customer_id uuid references customers(id),
  supplier_id uuid references suppliers(id),
  amount numeric(14,2) not null check (amount > 0),
  method payment_method not null,
  reference text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- EXPENSES
-- =========================================================
create table expense_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  expense_category_id uuid references expense_categories(id),
  amount numeric(14,2) not null check (amount > 0),
  method payment_method not null default 'CASH',
  note text,
  expense_date date not null default current_date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- AUDIT LOGS
-- =========================================================
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null,          -- e.g. 'product.update', 'role.assign'
  entity_type text not null,     -- e.g. 'products'
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================
-- SETTINGS (single-row store config)
-- =========================================================
create table settings (
  id boolean primary key default true check (id),  -- enforces a single row
  store_name text not null default 'Solvexa Grocery',
  store_address text,
  store_phone text,
  currency text not null default 'PKR',
  default_tax_rate numeric(5,2) not null default 0,
  low_stock_alert_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);
insert into settings (id) values (true);

-- =========================================================
-- USEFUL INDEXES
-- =========================================================
create index idx_products_category on products(category_id);
create index idx_inventory_movements_product on inventory_movements(product_id);
create index idx_purchases_supplier on purchases(supplier_id);
create index idx_purchase_items_purchase on purchase_items(purchase_id);
create index idx_sales_customer on sales(customer_id);
create index idx_sale_items_sale on sale_items(sale_id);
create index idx_payments_customer on payments(customer_id);
create index idx_payments_supplier on payments(supplier_id);
create index idx_expenses_date on expenses(expense_date);
create index idx_audit_logs_entity on audit_logs(entity_type, entity_id);
```

---

# 9. Row Level Security (RLS)

Enable RLS on every table and default-deny. Grant access through explicit policies keyed off `has_permission()` / `is_admin()`.

```sql
-- Enable RLS everywhere
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

-- PROFILES: users can read all active profiles, but only Admin can edit others
create policy profiles_select on profiles for select
  using (auth.uid() is not null);

create policy profiles_update_self on profiles for update
  using (auth.uid() = id);

create policy profiles_admin_all on profiles for all
  using (is_admin());

-- Generic pattern example — PRODUCTS
create policy products_select on products for select
  using (has_permission('view_products') or is_admin());

create policy products_insert on products for insert
  with check (has_permission('create_products') or is_admin());

create policy products_update on products for update
  using (has_permission('edit_products') or is_admin());

create policy products_delete on products for delete
  using (is_admin());

-- Repeat the same select/insert/update/delete pattern for:
--   categories        (view_categories / create_categories / edit_categories)
--   units              (view_units / create_units / edit_units)
--   suppliers          (view_suppliers / create_suppliers / edit_suppliers)
--   customers          (view_customers / create_customers / edit_customers)
--   purchases + items  (view_purchases / create_purchases / edit_purchases)
--   purchase_returns   (view_purchases / return_purchases)
--   sales + items      (view_sales / create_sales / edit_sales)
--   sales_returns      (view_sales / return_sales)
--   payments           (view_payments / create_payments)
--   expenses           (view_expenses / create_expenses / edit_expenses)

-- INVENTORY & MOVEMENTS: read via view_inventory; writes only via RPC (security definer),
-- direct table writes blocked for normal roles
create policy inventory_select on inventory for select
  using (has_permission('view_inventory') or is_admin());

create policy inventory_movements_select on inventory_movements for select
  using (has_permission('view_inventory') or is_admin());

-- AUDIT LOGS: read-only, Admin + explicit permission
create policy audit_logs_select on audit_logs for select
  using (has_permission('view_audit_logs') or is_admin());

-- SETTINGS: everyone signed in can read, only Admin can write
create policy settings_select on settings for select
  using (auth.uid() is not null);

create policy settings_update on settings for update
  using (is_admin());
```

**Rule:** any table that is only ever mutated through a `security definer` RPC function (like `inventory`, `inventory_movements`, and the balance columns on `customers`/`suppliers`) should have **no direct insert/update policy for normal users** — only the RPC function (running as the function owner) can write to it. This prevents a client from bypassing business logic and writing stock/balances directly.

---

# 10. Business Logic — Postgres RPC Functions

Every multi-table business operation must be a single Postgres function called via `supabase.rpc(...)`, wrapped in an implicit transaction so it's all-or-nothing.

## 10.1 Create Purchase (receive stock)

```sql
create or replace function create_purchase(
  p_supplier_id uuid,
  p_invoice_number text,
  p_items jsonb,              -- [{product_id, quantity, unit_cost, discount, tax}]
  p_paid_amount numeric,
  p_payment_method payment_method
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
    raise exception 'Permission denied';
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

    -- increase inventory
    insert into inventory (product_id, quantity)
    values ((v_item->>'product_id')::uuid, (v_item->>'quantity')::numeric)
    on conflict (product_id)
    do update set quantity = inventory.quantity + excluded.quantity,
                  updated_at = now();

    -- record movement
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
  values (auth.uid(), 'purchase.create', 'purchases', v_purchase_id, jsonb_build_object('total', v_total));

  return v_purchase_id;
end;
$$;
```

## 10.2 Create Sale (invoice a customer)

```sql
create or replace function create_sale(
  p_customer_id uuid,
  p_invoice_number text,
  p_items jsonb,               -- [{product_id, quantity, unit_price, discount, tax}]
  p_paid_amount numeric,
  p_payment_method payment_method
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
    raise exception 'Permission denied';
  end if;

  -- validate stock for every line before writing anything
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select (quantity - reserved_quantity) into v_available
    from inventory where product_id = (v_item->>'product_id')::uuid;

    if v_available is null or v_available < (v_item->>'quantity')::numeric then
      raise exception 'Insufficient stock for product %', (v_item->>'product_id');
    end if;
  end loop;

  insert into sales (customer_id, invoice_number, status, created_by)
  values (p_customer_id, p_invoice_number, 'CONFIRMED', auth.uid())
  returning id into v_sale_id;

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
  values (auth.uid(), 'sale.create', 'sales', v_sale_id, jsonb_build_object('total', v_total));

  return v_sale_id;
end;
$$;
```

## 10.3 Other required RPC functions (same pattern)

Build these following the same "validate → write header → write items → write inventory movement → update balances → audit log" pattern used above:

```text
create_purchase_return(purchase_id, items[])
   → decreases inventory, decreases supplier balance

create_sales_return(sale_id, items[])
   → increases inventory, decreases customer balance (or triggers refund payment)

record_payment(direction, sale_id | purchase_id, amount, method)
   → inserts into payments, updates customer/supplier balance

adjust_inventory(product_id, quantity, direction, note)
   → ADMIN/INVENTORY only, writes ADJUSTMENT_IN / ADJUSTMENT_OUT movement
```

Never let the frontend write directly to `inventory`, `inventory_movements`, `customers.current_balance`, or `suppliers.current_balance` — always go through these functions.

---

# 11. Module-by-Module Functional Spec

## 11.1 Dashboard

Cards:

```text
Today's Sales
Today's Purchases
Total Products
Low Stock Items
Outstanding Receivables (customers owe us)
Outstanding Payables (we owe suppliers)
Monthly Sales Trend (chart)
Recent Sales
Recent Purchases
```

## 11.2 Categories & Units

Simple CRUD screens: list, create, edit, activate/deactivate. Never hard-delete a category/unit referenced by a product.

## 11.3 Products

List view with search, category filter, status filter. Form fields:

```text
Name, SKU, Barcode, Category, Brand, Unit
Purchase Price, Sale Price, Tax Rate
Minimum Stock, Product Image
Active
```

Rules: unique SKU, unique barcode (when provided), no negative prices, soft-deactivate instead of delete once the product has transaction history.

## 11.4 Inventory

Read-mostly screen showing current stock per product, with:

```text
Product | Category | On Hand | Reserved | Available | Minimum Stock | Status
```

Status badge: `In Stock`, `Low Stock` (below minimum), `Out of Stock`. A "Stock Movements" tab per product shows the full `inventory_movements` history. Manual adjustments go through `adjust_inventory()` and require a reason note.

## 11.5 Suppliers

CRUD + a supplier detail page showing:

```text
Total Purchases
Total Paid
Outstanding Payable (current_balance)
Purchase History
Payment History
```

## 11.6 Purchases

List with status/payment filters. Create-purchase form:

```text
Supplier
Invoice Number
Line items: Product, Quantity, Unit Cost, Discount, Tax → Line Total
Subtotal / Discount / Tax / Total (auto-calculated)
Amount Paid, Payment Method
```

Submitting calls `create_purchase()`. Only `RECEIVED` purchases affect inventory — if you support drafts, don't touch stock until confirmed.

## 11.7 Purchase Returns

Select an existing purchase, pick items/quantities to return, add a reason. Calls `create_purchase_return()`.

## 11.8 Customers

CRUD + customer detail page showing:

```text
Total Sales
Total Paid
Outstanding Balance (current_balance)
Credit Limit
Sales History
Payment History
```

Support a default "Walk-in Customer" record for sales that aren't tied to a specific registered customer — it should not require full contact details.

## 11.9 Sales (Invoicing)

This replaces the POS. It is a standard invoice-creation form, not a checkout terminal:

```text
Customer (or Walk-in)
Invoice Number (auto-generated, editable)
Line items: Product, Quantity, Unit Price, Discount, Tax → Line Total
Subtotal / Discount / Tax / Total (auto-calculated)
Amount Paid, Payment Method
Create Invoice
```

Submitting calls `create_sale()`, which validates stock, writes the invoice, deducts inventory, records payment, and updates the customer balance if partially/unpaid. A "View Invoice" page should be printable/downloadable as a simple document, but there is no cash-drawer, no keyboard-shortcut checkout flow, and no barcode-scan-to-cart UI.

## 11.10 Sales Returns

Select an existing sale, pick items/quantities to return, add a reason. Calls `create_sales_return()`.

## 11.11 Payments

A ledger view of all money in/out, filterable by customer, supplier, method, and date range. New standalone payments (e.g., a customer paying down an old balance with no new sale) go through `record_payment()`.

## 11.12 Expenses

CRUD for expense categories, and an expense log:

```text
Category, Amount, Method, Date, Note
```

## 11.13 Employees

Admin-only screen to manage `profiles` + assign `role_id`. Deactivating a user should set `is_active = false`, not delete the row (their history must remain intact).

## 11.14 Reports

```text
Sales Report        — by date range, by product, by customer
Purchases Report     — by date range, by supplier
Inventory Report      — current stock, low stock, valuation
Profit Report          — (sales - cost of goods sold - expenses)
Receivables Report    — customers with outstanding balances
Payables Report        — suppliers with outstanding balances
Expense Report         — by category, by date range
```

All aggregation happens server-side (SQL views or RPC functions) — never pull raw rows to the client and sum in JavaScript for large datasets.

## 11.15 Audit Logs

Read-only table view of `audit_logs`, filterable by actor, entity type, and date range. Populated automatically by the RPC functions above (and any other function that performs a sensitive administrative change, e.g. role assignment).

## 11.16 Settings

Single-row form: store name, address, phone, currency, default tax rate, low-stock alert toggle. Admin-only write access (see RLS above).

---

# 12. Error Handling & Notifications

Never expose raw Postgres errors to the user.

```text
Bad:  "duplicate key value violates unique constraint products_sku_key"
Good: "A product with this SKU already exists."
```

Log the technical error server-side; show a friendly message client-side.

Toast examples:

```text
Success: "Product created successfully."
Success: "Sales invoice created successfully."
Success: "Purchase received successfully."
Success: "Payment recorded successfully."
Error:   "Insufficient stock for this product."
Error:   "You do not have permission to perform this action."
Error:   "Something went wrong. Please try again."
```

---

# 13. Testing Strategy

```text
Authentication: valid/invalid login, forgot password, logout, inactive account
Products: create, edit, deactivate, duplicate SKU, duplicate barcode, invalid price
Inventory: opening stock, purchase, sale, return, manual adjustment, low-stock flag
Purchases: draft (if used), receive, cancel, return, partial payment, full payment
Sales: single item, multiple items, insufficient stock, discount, tax, cash payment,
       credit sale, partial payment, return
Permissions: every role against every sensitive module and RPC function
```

**Critical concurrency test:**

```text
Product stock = 1
Two staff members create sales invoices for that product at the same time.

Expected: only one create_sale() call succeeds; the second gets
"Insufficient stock"; final stock = 0.
```

Because `create_sale()` reads and writes inventory inside a single Postgres function call, use `select ... for update` on the `inventory` row (or rely on the row-level check + update within the same statement/transaction) to guarantee this.

---

# 14. Performance Requirements

- Paginate all large tables (products, purchases, sales, movements).
- Use the indexes defined in Section 8.
- Avoid selecting unnecessary columns.
- Debounce product search inputs.
- Use server-side aggregation (SQL) for all reports — never sum thousands of rows in the browser.
- Avoid full-page reloads after create/update actions; refetch only the affected query.

---

# 15. Definition of Done (per module)

A module is not complete until:

```text
[ ] Database table(s) exist with correct constraints
[ ] Relationships/foreign keys are correct
[ ] RLS policies exist and were tested per role
[ ] Zod validation exists client + server side
[ ] UI exists: list, create, edit, detail views
[ ] Loading, empty, error, and success states exist
[ ] Destructive actions require confirmation
[ ] Permissions are enforced (frontend AND RLS)
[ ] Responsive on desktop and tablet
[ ] Relevant automated/manual tests pass
[ ] Business rules hold (stock never negative, balances reconcile)
[ ] Audit log entries are created where required
```

---

# 16. Build Order for Antigravity

Build incrementally. Do not generate the entire ERP in one uncontrolled step. After each phase: verify functionality, verify RLS, verify permissions, fix issues, then move on.

```text
Phase 1  — Next.js project setup, Tailwind, shadcn/ui, Supabase client wiring
Phase 2  — Full database schema + RLS policies (Sections 8–9)
Phase 3  — Authentication (login, forgot password, logout, protected middleware)
Phase 4  — Profiles, Roles, Permissions, role_permissions seed data
Phase 5  — Dashboard shell + sidebar navigation
Phase 6  — Categories & Units
Phase 7  — Products
Phase 8  — Inventory + Inventory Movements (read views + adjust_inventory RPC)
Phase 9  — Suppliers
Phase 10 — Purchases (create_purchase RPC) + Purchase Returns
Phase 11 — Customers
Phase 12 — Sales / Invoicing (create_sale RPC) + Sales Returns
Phase 13 — Payments ledger + record_payment RPC
Phase 14 — Expenses
Phase 15 — Reports
Phase 16 — Audit Logs
Phase 17 — Settings
Phase 18 — Employees management (Admin)
Phase 19 — Testing pass (Section 13) + concurrency test
Phase 20 — Performance review + production deployment
```

Do not replace a working Supabase implementation with mock data. Do not skip database constraints or RLS to "move faster." Do not add a POS/checkout screen at any point in this build.

---

# 17. First Task for Antigravity

Start only with the foundation:

```text
1. Initialize Next.js (App Router) + TypeScript + Tailwind + shadcn/ui
2. Wire up Supabase client (browser + server) and environment variables
3. Build the base app layout: sidebar + topbar shell
4. Build the login page and protected-route middleware
5. Apply the full SQL schema from Section 8 to a new Supabase project
6. Apply all RLS policies from Section 9
7. Seed roles, permissions, and role_permissions per the table in Section 7
```

Do not move on to advanced module UIs until the schema, RLS, and auth flow are verified end-to-end with a real login.

---

# 18. Success Criteria

The project is successful when a Solvexa employee can complete this full workflow with no manual spreadsheet work:

```text
Login
 ↓
Receive a Purchase (stock increases, supplier balance updates)
 ↓
Create a Sales Invoice for a customer (stock decreases, payment/credit recorded)
 ↓
Process a Sales Return if needed (stock increases back)
 ↓
Record a Payment against an outstanding customer or supplier balance
 ↓
Open Reports and see accurate Sales, Purchases, Inventory, Profit, Receivables, and Payables
```

The owner should be able to understand the current state of the grocery store — stock levels, money owed to suppliers, money owed by customers, and profitability — from the dashboard and reports, without doing any manual calculation.

---

# END OF SOLVEXA GROCERY ERP SPECIFICATION
