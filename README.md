# 🛒 Solvexa Store — Grocery & Retail ERP Platform

> Unified Enterprise Resource Planning (ERP) platform engineered for grocery stores, supermarkets, and wholesale retail operations. Built with **Next.js 16 (App Router + Turbopack)**, **Vanilla CSS Design Tokens**, **TypeScript**, and **Supabase PostgreSQL**.

---

## 🌟 Key Features & Operational Modules

- **🔐 3rd Generation Animated Auth & RBAC Portal:**
  - Role-based permissions matrix for Superadmin, Store Manager, Financial Accountant, Sales Staff, and Inventory Staff.
  - Pre-seeded employee accounts for instant testing.
- **📊 Executive Dashboard & Live Analytics:**
  - Role-tailored action shortcuts (`+ New Sale`, `Receive Stock`, `Log Expense`, `P&L Reports`).
  - Live weekly sales volume SVG bar charts, profit margin gauges, low-stock threshold warning pills.
- **📦 Master Product Catalog & SKUs:**
  - Multi-department category filtering (*Beverages, Dairy, Cooking Oils, Spices, Bakery, Household*).
  - Wholesale cost, retail pricing, barcode, unit symbols, minimum alert threshold configuration, and automatic gross margin % calculator.
- **🔄 Inventory & Stock Valuation:**
  - Real-time stock valuation (`Qty * Unit Cost`).
  - Immutable movement audit log (`ADJUSTMENT_IN`, `ADJUSTMENT_OUT`, `SALE`, `PURCHASE`).
  - Dedicated manual stock adjustment modal with audit reason tracking.
- **💳 POS Customer Sales & Invoicing:**
  - Multi-line item invoice builder with unit price lookups and live stock availability warnings.
  - Atomic stock deduction and customer debt balance updating via `create_sale` PostgreSQL procedure.
  - Official printable thermal bill receipt generator.
- **🚚 Supplier Purchasing & Accounts Payable:**
  - Inward stock batch receiving form via `create_purchase` procedure.
  - Supplier credit directory and accounts payable ledger tracking.
- **💰 Payments & Cashflow Ledger:**
  - Real-time cash inflow receipts (IN) and supplier payout settlements (OUT).
- **📋 Store Operating Expenses:**
  - Log overhead costs including store rent, commercial power, generator diesel fuel, payroll, and thermal receipt paper rolls.
- **📑 Financial Reports & Excel-Ready CSV Exports:**
  - Executive Profit & Loss statement (Gross Sales vs COGS vs Expenses vs Net Store Profit).
  - One-click CSV export formatted with UTF-8 Byte Order Mark (`\uFEFF`) for Microsoft Excel compatibility.

---

## 🔑 Pre-Configured Test Accounts (Password: `001001`)

| Role | Email Address | Password | Permissions Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `rohan@gmail.com` | `001001` | Full administrative control, employee account creation, settings |
| **Store Manager** | `manager@solvexa.com` | `001001` | Operations, stock adjustments, purchase receiving, sales, reports |
| **Accountant** | `accountant@solvexa.com` | `001001` | P&L reports, cash flow ledger, overhead operating expenses |
| **Sales Staff** | `sales@solvexa.com` | `001001` | Sales invoicing, customer accounts, thermal bills, sales returns |
| **Inventory Staff** | `inventory@solvexa.com` | `001001` | Product catalog, stock adjustments, supplier purchasing orders |

---

## 🛠️ Tech Stack & Architecture

- **Framework:** Next.js 16 (App Router + Turbopack)
- **Language:** TypeScript
- **Styling:** Vanilla CSS Custom Properties (Tokens) & Tailwind CSS
- **Database & Auth:** Supabase PostgreSQL, GoTrue Authentication, PostgreSQL Functions & RPCs
- **Export Engine:** RFC-4180 Standard CSV with UTF-8 BOM (`\uFEFF`)

---

## 🚀 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/rohan001-BE/Solvexa-ERP-.git
cd Solvexa-ERP-
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables Setup
Create `.env.local` in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_PROJECT_ID=
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
```

---

## 🧪 Testing & Verification
Refer to [`TESTING_REPORT.md`](./TESTING_REPORT.md) for full 8-step End-to-End automated testing details.

---

## 📄 License
© {new Date().getFullYear()} Solvexa Store. All rights reserved.
