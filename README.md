# Mini ERP + CRM Operations Portal

A full-stack ERP/CRM system for wholesale/distribution companies — featuring Customer Management, Product & Inventory Tracking, Sales Challan generation, Role-based Access Control, Stock Movement Audit Trail, and PDF Export.

---

## 📐 Architecture Overview

```
Assignment/
├── client/          # React + Vite + Tailwind CSS v4 (Frontend)
│   └── src/
│       ├── api/         # Axios instance with JWT interceptor
│       ├── components/  # Layout, ConfirmDialog
│       ├── context/     # AuthContext, ToastContext
│       ├── pages/       # Dashboard, Customers, Products, Challans, Users
│       └── utils/       # permissions.js (role-based access helper)
└── server/          # Node.js + Express (Backend)
    ├── models/      # Mongoose schemas: User, Customer, Product, StockMovement, Challan
    ├── routes/      # auth.js, customers.js, products.js, challans.js, users.js
    ├── middleware/  # authMiddleware.js (JWT verify + role authorize)
    ├── seed.js      # Auto-seeds default users + sample data on first run
    └── index.js     # Express app entry point
```

**Data Flow:**  
`React UI → Axios (JWT header) → Express API → Mongoose → MongoDB Atlas`

**Key Design Decisions:**
- JWT tokens stored in `localStorage`, attached via Axios request interceptor
- Stock is deducted atomically only when Challan status is `Confirmed`
- Challan stores a **product snapshot** (name, SKU, unitPrice at time of creation), so historical data stays accurate even if product prices change later
- Cancelling a `Confirmed` challan restores stock and logs a reverse movement
- Backend uses `authorize()` middleware to enforce role permissions per route

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4, React Router DOM v6, React Hook Form, Lucide Icons |
| Backend | Node.js, Express.js, Mongoose ODM |
| Database | MongoDB (Atlas) |
| Auth | JSON Web Tokens (JWT) + bcryptjs |
| PDF Export | jsPDF + jspdf-autotable |

> **Note on stack deviation:** The assignment specified TypeScript and PostgreSQL/MySQL. Per explicit user instruction JavaScript + MongoDB were used instead. All architectural patterns (REST APIs, role-based auth, validation, pagination) are identical.

---

## 🔑 Test Credentials (All Roles)

| Role | Username | Password | Permissions |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | Full access to all modules |
| **Sales** | `sales1` | `sales123` | Customers + Challans (create/edit) |
| **Warehouse** | `warehouse1` | `warehouse123` | Products + Stock adjustment |
| **Accounts** | `accounts1` | `accounts123` | Read-only view of all modules |

---

## 🚀 Local Setup Instructions

### Prerequisites
- Node.js v18+
- A MongoDB Atlas URI (or local MongoDB on port 27017)

### 1. Clone the Repository
```bash
git clone <repo-url>
cd Assignment
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory (a pre-configured `.env` is already provided with a live MongoDB Atlas URI for zero-config out-of-the-box execution):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/mini-erp-crm
JWT_SECRET=your_strong_secret_here
```

Start the backend:
```bash
npm run dev
```

> **Zero-Config Local Testing Note:** The repository's `server/.env` is pre-configured with a live, dedicated MongoDB Atlas connection string. You can instantly run `npm run dev` in both the server and client directories to start testing without setting up a local database database or editing environment variables.

> On **first run**, the seed script auto-creates all 4 users, 15 customers, 20 products, and 8 sample challans. No manual seeding needed.

### 3. Frontend Setup
Open a **new terminal**:
```bash
cd client
npm install
npm run dev
```

The app is available at **http://localhost:5173**

The Vite dev server proxies all `/api` requests to `http://localhost:5000`.

---

## 🌐 Deployment Guide

### Frontend → Vercel / Netlify
1. Push repository to GitHub
2. Connect GitHub repo to [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
3. Set **Root Directory** to `client`
4. Build command: `npm run build`
5. Output directory: `dist`
6. Set environment variable: `VITE_API_URL=https://<your-backend-url>`

### Backend → Render / Railway
1. Connect the repository to [Render](https://render.com) (Web Service)
2. Set **Root Directory** to `server`
3. Build command: `npm install`
4. Start command: `node index.js`
5. Add environment variables:
   - `MONGODB_URI` → your Atlas connection string
   - `JWT_SECRET` → a strong random secret
   - `PORT` → `5000` (or leave blank, Render sets it automatically)

### Database → MongoDB Atlas
1. Create a free M0 cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user and whitelist `0.0.0.0/0` (all IPs) for cloud deployment
3. Copy the connection string and set it as `MONGODB_URI`

---

## 📦 Environment Variables

| Variable | Where | Description |
|---|---|---|
| `MONGODB_URI` | server/.env | Full MongoDB connection string |
| `JWT_SECRET` | server/.env | Secret key for signing JWT tokens |
| `PORT` | server/.env | Port for the Express server (default: 5000) |

---

## 📮 API Documentation

A full Postman collection is included: **`Mini-ERP-CRM.postman_collection.json`**

Import it into Postman, set the `baseUrl` collection variable to `http://localhost:5000/api`, run the **Login** request, and the `token` variable will be set automatically for all subsequent requests.

### Key Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | None | Login, returns JWT |
| GET | `/api/customers` | Any role | List customers (search, status, type, page) |
| POST | `/api/customers` | Admin/Sales | Create customer |
| PUT | `/api/customers/:id` | Admin/Sales | Update customer |
| POST | `/api/customers/:id/notes` | Admin/Sales | Add follow-up note |
| GET | `/api/products` | Any role | List products (search, category, page) |
| POST | `/api/products` | Admin/Warehouse | Add product |
| POST | `/api/products/:id/stock` | Admin/Warehouse | Adjust stock IN/OUT |
| GET | `/api/products/:id/movements` | Any role | Stock movement log |
| GET | `/api/challans` | Any role | List challans (status filter, page) |
| POST | `/api/challans` | Admin/Sales | Create challan (Draft or Confirmed) |
| PATCH | `/api/challans/:id/cancel` | Admin/Sales | Cancel challan (restores stock) |
| GET | `/api/users` | Admin | List all users |
| POST | `/api/users` | Admin | Create user |
| DELETE | `/api/users/:id` | Admin | Delete user |

---

## ✅ Features Implemented

- [x] JWT Authentication with 4 roles (Admin, Sales, Warehouse, Accounts)
- [x] Role-based access on both backend (middleware) and frontend (UI gates)
- [x] Customer CRM — all fields, add/edit, search (name/mobile/business), status/type filter, detail page, follow-up notes with history
- [x] Product & Inventory — all fields, add/edit, category filter, stock movement log with timestamps
- [x] Product Image Upload — Local image upload via FileReader saved directly in MongoDB as a Base64 string with category-coloured gradient placeholders when no image is provided.
- [x] Sales Challan — auto-generated challan number, multi-product, Draft/Confirmed/Cancelled, stock deduction, negative-stock guard, product snapshot
- [x] Cancel Challan — restores stock + logs reverse movement
- [x] Dashboard — live stats, recent challans, low-stock widget, upcoming follow-ups
- [x] PDF Export of Challans (jsPDF + autoTable)
- [x] Server-side search, filter, and pagination on all list endpoints
- [x] Input validation with proper HTTP status codes and error messages
- [x] Toast notifications, loading states, confirm dialogs throughout

---

## ⚠️ Known Limitations & Assumptions

1. **Tech Stack Deviation** — Used JavaScript + MongoDB instead of TypeScript + PostgreSQL as instructed by the user to match existing LineOps stack
2. **No purchase order module** — The PDF listed POs in business context only, not in core modules
3. **No invoice module** — Same as above; challans serve as the primary sales document
4. **AWS S3 image upload replaced with Base64 database storage** — Instead of configuring S3 bucket configurations which requires environment-specific IAM credentials, product images are encoded to Base64 strings and stored directly in MongoDB (capped at 1MB to prevent BSON limits).
5. **No Docker / GitHub Actions** — Bonus features not implemented
6. **JWT stored in localStorage** — Acceptable for this scope; production systems should use httpOnly cookies
7. **No email notifications** — Follow-up dates are shown but no email reminders are sent
