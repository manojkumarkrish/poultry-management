# Poultry Farm Management System — 100,000 Birds Commercial Complex

A production-oriented, full-stack **Poultry Farm Management System** engineered for commercial egg and bird production operations managing approximately **100,000 birds** across multiple physical sheds.

---

## 1. Farm Structure & Physical Shed Layout

The system models **8 physical sheds** with individual capacity configurations and occupancy tracking:

| Shed Code | Shed Name | Shed Type | Capacity | Default Flock Breed | Operating Role |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **L1** | Layer Shed 1 | Layer | 18,000 | BV300 White Leghorn | Commercial Table Eggs |
| **L2** | Layer Shed 2 | Layer | 18,000 | BV300 White Leghorn | Commercial Table Eggs |
| **L3** | Layer Shed 3 | Layer | 18,000 | BV300 White Leghorn | Commercial Table Eggs |
| **L4** | Layer Shed 4 | Layer | 18,000 | Lohmann Brown Classic | Brown Table Eggs |
| **L5** | Layer Shed 5 | Layer | 18,000 | BV300 White Leghorn | Commercial Table Eggs |
| **G1** | Grower Shed 1 | Grower | 6,000 | BV300 White Leghorn | Rearing Pullets (8–18 Wks) |
| **G2** | Grower Shed 2 | Grower | 4,000 | BV300 White Leghorn | Pre-lay Conditioning |
| **C1** | Chick Brooder | Chick | 3,000 | BV300 Day-Old Chicks | Brooding & Heat Canopies (0–8 Wks) |
| **Total** | **8 Physical Sheds** | | **103,000** | **~99,850 Active Birds** | **Target: ~100,000 Birds** |

*Note: Capacities are independently configurable per shed in the Shed Management module.*

---

## 2. Core Architectural Philosophy: ONE UNIFIED DASHBOARD

In strict adherence to requirements, this system maintains **one unified dashboard and one shared navigation layout** for both Owner/Admin and Managers.

- **No Duplicated Dashboards:** Both roles access the same dashboard, same navigation paths, and shared data-entry forms.
- **Permission-Gated Widgets:** The available KPI cards, financial widgets, buttons, actions, and tabs are dynamically determined by server-enforced role permissions and Admin visibility switches.
- **Immediate Role Testing:** A persistent role switcher is built directly into the UI footer/header so operators and reviewers can test between "Owner/Admin" and "Manager" perspectives in real time.
- **Hard Security:** Row-Level Security (RLS) in PostgreSQL and backend authorization checks protect financial records, audit logs, and settings from direct URL/API manipulation.

---

## 3. Technology Stack

- **Frontend & Server Framework:** Next.js 14+ (App Router) with TypeScript
- **Styling:** Tailwind CSS with responsive layout and poultry-specific color palettes
- **Database:** Supabase PostgreSQL with normalized schema, constraints, and Row Level Security (RLS)
- **Data Visualization:** Recharts (Shed counts, lay rate %, feed intake, mortality trends, monthly revenue vs expenses)
- **Icons:** Lucide React
- **Validation & Forms:** React Hook Form & Zod schemas
- **Storage & State:** Dual-engine architecture supporting Supabase PostgreSQL and a persistent local/hybrid database provider for immediate operation and testing.

---

## 4. Key Poultry Calculations & Business Rules

### 1. Flock Reconciliation (Closing Bird Calculation)
Silently overwriting past bird counts is strictly prohibited. Closing birds is computed with the formula:
$$\text{Closing Birds} = \text{Opening} + \text{Received} + \text{Transfers In} - \text{Transfers Out} - \text{Deaths} - \text{Culls} - \text{Bird Sales} - \text{Other Removals}$$
- The system enforces non-negative bird counts and blocks transfers exceeding available birds.

### 2. Egg Tray Conversion
The exact egg count is the single source of truth:
- Conversion factor: **30 eggs per tray**
- $\text{Full Trays} = \lfloor \text{Good Eggs} / 30 \rfloor$
- $\text{Loose Eggs} = \text{Good Eggs} \pmod{30}$
- *Example:* 3,125 eggs = 104 full trays and 5 loose eggs.

### 3. Egg Production Percentage
Computed strictly on the collection day's opening live layer bird count:
$$\text{Egg Production \%} = \frac{\text{Total Eggs Collected}}{\text{Live Layer Birds at Start of Day}} \times 100$$
- Non-layer sheds (C1 chick and G1–G2 grower) display **N/A** (not 0%) to prevent skewing lay performance averages.

### 4. Feed Production & Atomic Deduction
- Recipe formulations must total **100.0%**.
- Production runs atomically deduct raw ingredient stocks (Maize, Soya DOC, DORB, Premix, etc.) and add finished mash bags to godown inventory while computing actual cost per kilogram.

### 5. Accrual vs. Cash Accounting (No Double Counting)
- A purchase bill recorded in Accounts Payable and its subsequent payment are not counted as two separate expenses.
- Unsold eggs and birds are counted as inventory valuation, not sales revenue.

---

## 5. Main Application Modules (21 Sections)

1. **Dashboard:** Consolidated KPIs, live bird census, egg trays, mortality, and permission-gated commercial margin charts.
2. **Shed Management:** Full CRUD operations for L1–L5, G1–G2, and C1 with capacity warnings.
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
17. **Reports & Analytics:** 23 comprehensive poultry reports with CSV export and print view.
18. **Alerts & Notifications:** Threshold-driven biosecurity alerts, reorder triggers, and vaccine due notices.
19. **User Management (Admin Only):** Provision manager accounts and assign specific shed responsibilities.
20. **Permissions & Settings (Admin Only):** 10 independent switches controlling Manager visibility and permissions.
21. **Audit Logs (Admin Only):** Immutable mutation history and approval requests for record corrections.

---

## 6. Setup & Deployment Instructions

### Prerequisites
- Node.js 18+ or 20+
- npm 9+
- A Supabase project (optional for remote cloud PostgreSQL; built-in persistent hybrid provider runs immediately out of the box)

### Quick Start (Local Development)
```bash
# 1. Clone or open the repository
cd "poultry farm manager"

# 2. Install dependencies
npm install

# 3. Copy environment variables template
cp .env.example .env.local

# 4. Run automated calculation test suite
node test/business-calculations.test.mjs

# 5. Start the development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Supabase Database Migration Guide
To connect to your remote Supabase PostgreSQL database:

1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in the Supabase dashboard.
3. Open and run the migration file:
   [`supabase/migrations/20261016_initial_schema.sql`](file:///c:/Users/manoj/OneDrive/Documents/poultry%20farm%20manager/supabase/migrations/20261016_initial_schema.sql)
4. Run the seed data script:
   [`supabase/seed.sql`](file:///c:/Users/manoj/OneDrive/Documents/poultry%20farm%20manager/supabase/seed.sql)
5. Copy your Project URL and Anon Key from **Project Settings → API** into your `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
6. Build and launch for production:
   ```bash
   npm run build
   npm start
   ```

---

## 7. Testing & Verification

Run the automated business logic test suite:
```bash
node test/business-calculations.test.mjs
```

### Verified Test Cases:
- [x] 30 eggs per tray calculation (e.g. 3,125 eggs = 104 trays + 5 loose eggs)
- [x] Flock closing count reconciliation formula with additions and removals
- [x] Egg laying rate % calculated against opening layer birds
- [x] Feed recipe percentage summation strictly equaling 100%
- [x] Daily feed per bird calculation (grams per bird per day)
- [x] Partial payment allocations and customer balance updates
- [x] Next.js production build (`npm run build`) passing with all static routes generated
