# Solvexa Grocery ERP — Frontend Build Guide
## Next.js Workflow Specification for Antigravity

**Companion to:** `Solvexa_Grocery_ERP_Antigravity_Guide.md` (backend/schema spec)
**Scope:** Frontend only — how to actually build the Next.js UI, screen by screen, in the right order
**Stack:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + React Hook Form + Zod + TanStack Query + Recharts
**Rule:** No POS/checkout UI. Every screen here is an admin/back-office screen.

---

# 1. How to Use This Guide

The backend guide tells Antigravity *what* to build (schema, RLS, RPC). This guide tells Antigravity *how* to build the frontend and *in what order*, screen by screen, so nothing gets built on top of a missing piece.

Golden rule for every screen: **List → Detail/Form → Empty/Loading/Error states → Permission guard**, in that order. Don't start the next screen until this loop is done for the current one.

---

# 2. Global Frontend Architecture

## 2.1 Data flow pattern

```text
Page (Server Component)
  → fetches initial data directly via Supabase server client
  → passes to Client Component

Client Component
  → uses TanStack Query for refetching/mutations
  → calls a service function (services/*.service.ts)
  → service function calls supabase.rpc(...) or supabase.from(...)
```

Never call `supabase.from(...)` directly inside a component. Always go through a `services/*.service.ts` function so business logic and query shape live in one place and are reusable/testable.

## 2.2 Folder responsibilities (frontend-relevant subset)

```text
app/(dashboard)/<module>/page.tsx        → list view (Server Component, fetches page 1)
app/(dashboard)/<module>/[id]/page.tsx   → detail view
app/(dashboard)/<module>/new/page.tsx    → create form
app/(dashboard)/<module>/[id]/edit/page.tsx → edit form

components/<module>/
  ├── <module>-table.tsx        → the data table (client)
  ├── <module>-form.tsx         → shared create/edit form (client)
  ├── <module>-filters.tsx      → search/filter bar (client)
  └── <module>-detail.tsx       → detail page content (client)

services/<module>.service.ts   → all Supabase calls for this module
lib/validations/<module>.ts    → Zod schema for this module's form
types/database.types.ts        → generated Supabase types (source of truth)
```

## 2.3 One shared table component

Build **one** reusable `<DataTable>` component (wrapping shadcn/ui `Table` + TanStack Table) that every module reuses: columns, pagination, sorting, and a search slot are passed as props. Do not build a bespoke table per module — this is the single biggest win for build speed and consistency.

## 2.4 One shared form pattern

Every create/edit form follows the same shape:

```text
<Form> (React Hook Form + zodResolver)
  → Field group 1 (basic info)
  → Field group 2 (module-specific)
  → Footer: Cancel | Save (loading state on Save while mutating)
```

Reuse the **same** form component for both create and edit — pass `defaultValues` when editing, and branch only on which service function gets called on submit (`create()` vs `update()`).

## 2.5 Line-item forms (Purchases & Sales)

Purchases and Sales both need a repeatable line-items table inside the form (product picker, quantity, price, discount, tax, computed line total, running subtotal/tax/total footer). Build **one** shared `<InvoiceLineItems>` component used by both the Purchase form and the Sales form — they are structurally identical, just with `unit_cost` vs `unit_price` labels.

---

# 3. Design System Basics

Keep this simple and consistent — this is an internal admin tool, not a marketing site.

```text
Layout:      Fixed left sidebar (collapsible) + top bar (user menu, notifications) + content area
Typography:  One sans font, 2–3 weights max
Color:       Neutral base (white/slate backgrounds), one brand accent color for primary actions
Status:      Consistent badge colors — green = paid/in stock, amber = partial/low stock,
             red = unpaid/out of stock/overdue, gray = draft/cancelled/inactive
Spacing:     Consistent card padding (p-6), consistent gap between form fields (gap-4)
Icons:       lucide-react throughout, same size per context (16px inline, 20px nav)
```

Every list page: page title + short description → filter/search bar → data table → pagination.
Every form page: page title → breadcrumb back to list → form card → sticky/bottom action bar.

---

# 4. Frontend Build Order (Workflow)

Follow this exact order. Each phase assumes the backend pieces for that module already exist (schema + RLS + RPC from the backend guide).

## Phase F1 — Shell & Auth

```text
1. app/layout.tsx — root layout, fonts, Tailwind, providers (TanStack Query provider)
2. app/(auth)/login/page.tsx — login form (email, password, submit → Supabase Auth)
3. app/(auth)/forgot-password/page.tsx — email → send reset link
4. middleware.ts — refresh session, redirect unauthenticated users to /login
5. app/(dashboard)/layout.tsx — sidebar + topbar shell, wraps all dashboard routes
6. components/layout/sidebar.tsx — nav links, filtered by the logged-in user's permissions
7. components/layout/topbar.tsx — user avatar, name, role, logout
```

**Checkpoint:** you can log in, land on an empty dashboard shell with a working sidebar/logout, and get redirected to `/login` when signed out.

## Phase F2 — Permission Plumbing

```text
1. lib/permissions/use-permissions.ts — hook that loads the current user's permission codes
2. lib/permissions/can.ts — can(permissionCode) helper for conditional rendering
3. components/layout/protected-route.tsx — wraps a page, redirects/shows "Not authorized"
   if the user lacks the required permission
```

**Checkpoint:** a Cashier-role test account cannot see the "Employees" nav item, and hitting `/employees` directly shows "Not authorized" instead of the page.

## Phase F3 — Dashboard

```text
1. Stat cards: Today's Sales, Today's Purchases, Total Products, Low Stock Items,
   Outstanding Receivables, Outstanding Payables
2. Monthly Sales Trend chart (Recharts line/bar chart)
3. Recent Sales table (last 5–10)
4. Recent Purchases table (last 5–10)
```

Fetch all dashboard numbers through one `services/dashboard.service.ts` function that calls a single Postgres view/RPC (`get_dashboard_summary()`) rather than five separate round trips.

## Phase F4 — Categories & Units

```text
1. List page with search + active/inactive filter
2. Create/Edit dialog (use a Dialog/Sheet, not a full page — these are simple enough)
3. Deactivate action with confirmation dialog
```

**Checkpoint:** this phase proves out the shared `<DataTable>` and a simple dialog-form pattern before Products (which is more complex) begins.

## Phase F5 — Products

```text
1. List page: search, category filter, status filter, columns (Name, SKU, Category, Price, Stock)
2. Create/Edit page (full page, not dialog — has an image upload):
   Name, SKU, Barcode, Category (select), Brand, Unit (select),
   Purchase Price, Sale Price, Tax Rate, Minimum Stock, Image (Supabase Storage upload), Active
3. Product detail page: info panel + current stock + recent movements for this product
4. Deactivate action with confirmation dialog
```

**Checkpoint:** products exist and are ready to be purchased/sold — Inventory rows are auto-created via the backend when a product is first purchased (per the backend RPC), so Inventory will be empty until Phase F7 (Purchases) runs.

## Phase F6 — Inventory (read + adjust)

```text
1. List page: Product, Category, On Hand, Reserved, Available, Minimum Stock, Status badge
2. "Adjust Stock" dialog (Admin/Inventory only): quantity, direction (in/out), reason note
   → calls adjust_inventory() RPC
3. Movements tab/drawer per product: full inventory_movements history, filterable by type
```

## Phase F7 — Suppliers

```text
1. List page with search + active/inactive filter
2. Create/Edit form: Name, Company Name, Phone, Email, Address, Opening Balance
3. Detail page: Total Purchases, Total Paid, Outstanding Payable, Purchase History tab,
   Payment History tab
```

## Phase F8 — Purchases

```text
1. List page: Invoice #, Supplier, Total, Paid, Due, Payment Status badge, Status badge, Date
2. Create Purchase page:
   - Supplier select
   - Invoice number (auto-suggested, editable)
   - <InvoiceLineItems> (product picker, qty, unit cost, discount, tax → line total)
   - Footer: Subtotal / Discount / Tax / Total (computed live)
   - Amount Paid, Payment Method
   - Submit → services/purchases.service.ts → create_purchase() RPC
3. Purchase detail page: full invoice view, items table, payment history, "Create Return" button
```

## Phase F9 — Purchase Returns

```text
1. From a Purchase detail page: "Create Return" opens a form pre-filled with that purchase's
   items; user selects which items/quantities to return and a reason
2. Submit → create_purchase_return() RPC
3. List page for all purchase returns, linkable back to the original purchase
```

## Phase F10 — Customers

```text
1. List page with search + active/inactive filter
2. Create/Edit form: Name, Phone, Email, Address, Credit Limit, Opening Balance
3. Detail page: Total Sales, Total Paid, Outstanding Balance, Sales History tab,
   Payment History tab
4. Ensure a default "Walk-in Customer" exists and is selectable from Sales without
   requiring a full profile
```

## Phase F11 — Sales (Invoicing)

```text
1. List page: Invoice #, Customer, Total, Paid, Due, Payment Status badge, Status, Date
2. Create Sale page — same shape as Create Purchase:
   - Customer select (defaults to Walk-in)
   - Invoice number (auto-suggested, editable)
   - <InvoiceLineItems> (product picker, qty, unit price, discount, tax → line total)
     — product picker should show available stock next to each product and block/warn
       when requested quantity exceeds it, before the user even submits
   - Footer: Subtotal / Discount / Tax / Total (computed live)
   - Amount Paid, Payment Method
   - Submit → services/sales.service.ts → create_sale() RPC
3. Sale detail / invoice view page: printable layout, items table, payment history,
   "Create Return" button
```

Remember: this is a form the staff fills out to generate an invoice — not a live checkout screen. No barcode-scan input, no cart animation, no cash-drawer UI.

## Phase F12 — Sales Returns

```text
1. From a Sale detail page: "Create Return" opens a form pre-filled with that sale's items
2. Submit → create_sales_return() RPC
3. List page for all sales returns, linkable back to the original sale
```

## Phase F13 — Payments Ledger

```text
1. List page: Date, Direction (In/Out badge), Customer/Supplier, Amount, Method, Reference
2. Filters: direction, customer, supplier, method, date range
3. "Record Payment" form (for standalone payments not tied to a new invoice) → record_payment() RPC
```

## Phase F14 — Expenses

```text
1. Expense Categories: simple list + create/edit dialog
2. Expenses list: Date, Category, Amount, Method, Note
3. Create/Edit Expense form
```

## Phase F15 — Reports

```text
1. Report picker (tabs or side nav): Sales, Purchases, Inventory, Profit, Receivables, Payables, Expenses
2. Each report: date-range picker + relevant filters (product/customer/supplier/category)
3. Summary cards at top, detail table below, one chart where it adds value
   (e.g. sales trend line, top products bar chart)
4. Export to CSV button on every report table
```

All numbers come from server-side aggregation (SQL views/RPC) — the page just renders what the query returns.

## Phase F16 — Audit Logs

```text
1. List page: Date, Actor, Action, Entity Type, Entity ID (linkable), Before/After diff on expand
2. Filters: actor, entity type, date range
```

## Phase F17 — Employees (Admin only)

```text
1. List page: Name, Email, Role, Status
2. Create/Edit form: Full Name, Email, Phone, Role (select), Active toggle
   (creating an employee triggers a Supabase Auth invite — server action, not client-side)
3. Role assignment change should be confirmed with a dialog (sensitive action)
```

## Phase F18 — Settings (Admin only)

```text
1. Single form: Store Name, Address, Phone, Currency, Default Tax Rate,
   Low Stock Alert toggle
2. Save → updates the single settings row
```

## Phase F19 — Polish Pass

```text
1. Walk every screen and confirm: loading skeleton, empty state illustration/message,
   error state with retry, success toast on every mutation
2. Confirm every destructive/financial action has a confirmation dialog
3. Confirm every nav item and page respects permissions for every role
4. Responsive check at tablet width (min supported width) for every screen
5. Print/PDF layout check for the Sale invoice detail page
```

---

# 5. Per-Screen Checklist (use for every module above)

Copy this checklist for each module before calling it done:

```text
[ ] List page: search + relevant filters wired to the query
[ ] List page: pagination works, sort works on key columns
[ ] List page: loading skeleton, empty state, error state
[ ] Create form: Zod validation matches DB constraints (uniqueness, min/max, required)
[ ] Create form: submit button shows loading state, disabled while submitting
[ ] Create form: success → toast + redirect to detail or back to list
[ ] Create form: error → friendly toast message, form stays filled (no data loss)
[ ] Edit form: pre-fills correctly, same validation as create
[ ] Detail page: shows all relevant related data (history/linked records)
[ ] Destructive/financial actions: confirmation dialog before calling the service
[ ] Nav item + route both respect the required permission
[ ] Mobile/tablet layout doesn't break (table scrolls horizontally if needed)
```

---

# 6. State & Data-Fetching Conventions

```text
Server Components  → initial page load data (fast first paint, SEO not relevant here but
                      speed matters for an internal tool)
TanStack Query      → all client-side refetching, mutations, and cache invalidation
React Hook Form      → all form state
Zod                  → single source of truth for validation, shared between form and
                       (ideally) the service layer's pre-submit check
```

Mutation pattern for every create/edit action:

```text
1. Validate with Zod (client)
2. Call service function
3. On success: invalidate the relevant TanStack Query key(s), show success toast,
   navigate if appropriate
4. On error: show friendly toast (map known Postgres error codes to friendly text
   in the service layer, not in the component)
```

---

# 7. Definition of Done — Frontend

The frontend build is not done until, for every module in Phases F3–F18:

```text
[ ] The Per-Screen Checklist (Section 5) passes
[ ] The module works correctly for every role that should have access, and is hidden/blocked
    for every role that shouldn't
[ ] No component calls supabase.from()/.rpc() directly — always through a service function
[ ] No duplicated table or form logic — shared <DataTable>, shared form patterns, shared
    <InvoiceLineItems> are actually reused, not copy-pasted
[ ] Section 4's Polish Pass has been completed
```

---

# END OF SOLVEXA ERP FRONTEND WORKFLOW GUIDE
