# Kasthuri Poultry Farm (KPF) Management System

A production-oriented, full-stack **Commercial Poultry Farm Management System** engineered for multi-shed layer and pullet operations, daily flock lifecycle tracking, feed formulation, egg production, and real-time financial ledgers.

---

## 1. System Overview & Multi-Shed Architecture

The system provides end-to-end management for modern poultry operations across configurable physical sheds (Layer, Grower, and Chick Brooder units):

- **Dynamic Shed Modeling:** Sheds, stages, capacities, and assigned flock breeds are fully configurable per farm.
- **Configurable Operating Roles:**
  - **Layer Sheds:** Commercial table egg production and daily tray packing.
  - **Grower Sheds:** Pullet rearing, body weight tracking, and pre-lay conditioning (8–18 weeks).
  - **Chick Brooders:** Day-old chick brooding and temperature/feed monitoring (0–8 weeks).
- **Flock Occupancy & Reconciliation:** Real-time bird counts, mortality, culls, transfers, and sales tracked per shed without hardcoded target assumptions.

---

## 2. Core Architectural Philosophy: Unified Dashboard & Role Security

In strict adherence to enterprise design principles, this system maintains **one unified dashboard and shared layout** for both Owner/Admin and Farm Managers:

- **No Duplicated Dashboards:** Both roles access the same responsive dashboard shell, same navigation paths, and shared data-entry forms.
- **Permission-Gated Widgets:** The available KPI cards, financial charts, action buttons, and tabs are dynamically determined by server-enforced role permissions and Admin visibility settings.
- **Strict Role-Based Access Control (RBAC):** Next.js middleware and signed session tokens protect administrative endpoints (`/users`, `/audit-logs`, `/api/admin/*`) from unauthorized access.
- **Hydration & SSR Stability:** Guaranteed identical server-rendered HTML and client hydration with zero layout flickering or mismatch errors.
- **Settings Tab Isolation:** Individual settings sub-views (`Billing & Farm Header`, `Manage Permissions`, `Data Management`) render strictly in isolation without cross-tab leakage.

---

## 3. Technology Stack

- **Frontend & Server Framework:** Next.js 14+ (App Router) with TypeScript
- **Styling:** Tailwind CSS with high-contrast, clean print styles (`@media print`)
- **Database & Storage:** Supabase PostgreSQL with normalized schema, constraints, and Row Level Security (RLS), alongside a built-in persistent local/hybrid provider for immediate operation.
- **Data Visualization:** Recharts (Live bird census, lay rate %, feed intake, mortality curves, revenue vs expenses)
- **Icons & UI:** Lucide React icons with mobile-first responsive bottom navigation
- **Validation:** React Hook Form & Zod schemas
- **Localization:** Indian number formatting (`en-IN` numbering system: Lakhs and Crores, `₹` currency formatting)

---

## 4. Simple, Clean & Neat Bill Printing (No GST Clutter)

All commercial bills and invoices in the system feature a clean, simple, and neat print format optimized for A4 paper and PDF export:

### Header Structure
1. **Company Name:** Prominent, uppercase header (e.g., `KASTHURI POULTRY FARM`)
2. **Address:** Clean farm address, phone number, and email contact
3. **Date & Time:** Precise timestamp (e.g., `28/10/2026 at 03:45 PM`)
4. **Bill Requirements & Details:**
   - **Bill Type:** Clear categorization (`EGG SALE BILL`, `LIVE BIRD SALE BILL`, `PURCHASE BILL`, `PAYMENT RECEIPT`)
   - **Bill No:** Sequential invoice or voucher reference number
   - **Party Details:** Billed To / Supplier name, phone, and delivery address
   - **Itemized Table:** Description, exact quantities, 30-egg tray conversion, weights, rates, and totals
   - **Financial Summary:** Subtotal, discount/transport additions, net total amount, and amount paid/due
   - **Amount in Words:** Formal Indian Rupee words conversion
   - **Signatures:** Customer/Receiver acknowledgment and Authorized Farm Signatory
   - **Clean & Tax-Free:** Zero GST, GSTIN, or legal jargon clutter on printed bills

---

## 5. Key Poultry Calculations & Business Rules

### 1. Flock Reconciliation (Closing Bird Calculation)
Silently overwriting past bird counts is strictly prohibited. Closing birds is computed with the formula:
$$\text{Closing Birds} = \text{Opening} + \text{Received} + \text{Transfers In} - \text{Transfers Out} - \text{Deaths} - \text{Culls} - \text{Bird Sales} - \text{Other Removals}$$
- The system enforces non-negative bird counts and blocks transfers exceeding available birds.

### 2. Egg Tray Conversion
The exact egg count is the single source of truth:
- Conversion factor: **30 eggs per standard tray**
- $\text{Full Trays} = \lfloor \text{Good Eggs} / 30 \rfloor$
- $\text{Loose Eggs} = \text{Good Eggs} \pmod{30}$
- *Example:* 3,125 eggs = 104 full trays and 5 loose eggs.

### 3. Egg Laying Rate Percentage
Computed strictly on the collection day's opening live layer bird count:
$$\text{Egg Laying Rate \%} = \frac{\text{Total Eggs Collected}}{\text{Live Layer Birds at Start of Day}} \times 100$$
- Non-layer sheds (chick and grower) display **N/A** (not 0%) to prevent skewing lay performance averages.

### 4. Feed Formulation & Atomic Inventory Deduction
- Recipe formulations must strictly sum to **100.0%**.
- Production runs atomically deduct raw ingredient stocks (Maize, Soya DOC, DORB, Premix, etc.) and add finished mash bags to godown inventory while calculating actual cost per kilogram.

### 5. Accrual vs. Cash Accounting (No Double Counting)
- Purchase bills in Accounts Payable and subsequent payment vouchers are reconciled without duplicating expenses.
- Unsold eggs and birds are counted as inventory valuation, not sales revenue.

---

## 6. Main Application Modules (21 Sections)

1. **Dashboard:** Consolidated KPIs, live bird census, egg trays, mortality, and permission-gated commercial margin charts.
2. **Shed Management:** Full CRUD operations for farm sheds with dynamic capacity tracking and manager assignments.
3. **Bird & Batch Management:** Chick → Grower → Layer lifecycle tracking with inter-shed transfer workflows.
4. **Daily Farm Entry:** Mobile-friendly quick entry for daily opening/closing counts, mortality, feed intake, and egg counts.
5. **Feed Management:** Ingredients stock, formulations (100% check), milling production, and shed distribution slips.
6. **Godown & Inventory:** Multi-location tracking for raw materials, finished feed, egg cold rooms, vaccines, and packaging.
7. **Egg Production:** Daily collection logging for layer sheds with 30-egg tray derivation.
8. **Egg Stock & Sales:** Wholesale buyer dispatch, invoices, cold room stock deductions, and receivables tracking.
9. **Bird Sales:** Culls and spent hens sales with automatic live bird deduction from sheds and batches.
10. **Health & Vaccination:** Vaccine scheduling with automatic reminders (7 days before, due today, overdue) and veterinary diagnoses.
11. **Weight Monitoring:** Sample body weight audits vs standard breed curves and flock uniformity metrics.
12. **Suppliers & Purchases:** Raw material vendor accounts, purchase bills, and disbursement tracking.
13. **Customers & Accounts:** Buyer credit limits, sales invoices, collections, and outstanding receivable ledgers.
14. **Expenses & Operating Costs:** Categorized overheads, electricity, labour wages, and shed cost allocations.
15. **Electricity & Labour:** Power meter readings, units consumed (kWh), workforce assignments, and monthly payroll.
16. **Payments & Balances:** Transaction movement ledger (customer receipts and supplier payments).
17. **Reports & Analytics:** 23 comprehensive poultry reports with CSV export and clean print views.
18. **Alerts & Notifications:** Threshold-driven biosecurity alerts, reorder triggers, and vaccine due notices.
19. **User Management (Admin Only):** Provision manager accounts and assign specific shed responsibilities.
20. **Permissions & Settings (Admin Only):** 10 independent switches controlling Manager visibility and permissions.
21. **Audit Logs & Reset Data (Admin Only):** Immutable mutation history and secure two-step operational data reset.

---

## 7. Operational Data Reset & Safety Protocol

The system provides a dedicated **Reset Operational Data** capability in **Settings → Data Management** (Admin Only):

- **Two-Step Verification:** Requires entering Admin password and typing `"RESET KPF DATA"` in uppercase.
- **Cleaned Data:** Wipes operational batches, daily egg records, feed issues, sales invoices, supplier bills, expenses, and inventory ledgers.
- **Strictly Preserved Data:**
  - Owner and Manager user accounts & passwords
  - Authentication sessions & cookies
  - Farm legal profile (Name, address, contact details)
  - Physical shed definitions & configured capacities
  - Feed recipes & ingredient formulations
  - Manager permission switches & immutable system audit log

---

## 8. Setup & Development Instructions

### Prerequisites
- Node.js 18+ or 20+
- npm 9+

### Quick Start
```bash
# 1. Clone or navigate to the project directory
cd "poultry farm manager"

# 2. Install dependencies
npm install

# 3. Copy environment variables template
cp .env.example .env.local

# 4. Run automated test suites
node test/business-calculations.test.mjs

# 5. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 9. Automated Test Suites & Quality Verification

Run all test suites across authentication, RBAC, calculations, and layout hydration:

```bash
node --test test/business-calculations.test.mjs \
            test/test-indian-number-formatting.mjs \
            test/test-auth-pwa.mjs \
            test/test-reset-data.mjs \
            test/test-reset-zero-state.mjs \
            test/test-hydration-applayout.mjs \
            test/test-full-audit.mjs \
            test/test-settings-tabs-login-redirect.mjs \
            test/test-rbac-safeguards.mjs
```

### Verified Test Status:
```text
# tests 56
# suites 4
# pass 56
# fail 0
```
- **Flock & Egg Math:** 30-egg tray conversions, opening bird lay rates, 100% recipe sums.
- **Indian Numbering:** Correct comma placement (`1,00,000`, `₹16,875.00`) and currency symbols.
- **SSR & Hydration:** Zero React hydration errors on `/login`, `/`, `/settings`, and operational subpages.
- **RBAC & Security:** Strict middleware redirects for protected administrative pages.
- **Zero-State Verification:** Accurate empty states across all tables post data reset.
- **Clean Bill Printouts:** A4-ready layouts without GST, tax, or legal clutter.
