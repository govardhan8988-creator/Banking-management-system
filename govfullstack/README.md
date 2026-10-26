# Indian Banking Management System (Apex Bank)

A modern, full-stack Indian Banking Management System built with **Node.js, Express, Prisma ORM, PostgreSQL**, and **React + Vite**, designed natively for **Indian Rupees (INR - ₹)** and the Indian banking ecosystem.

---

## 🏛️ Project Overview

Apex Bank provides a comprehensive Indian personal banking portal that enables customers to:
- Register securely with encrypted passwords (bcryptjs) and log in with JWT authentication.
- Open bank accounts (**Savings Account**, **Current Account**) with automatically generated unique 10-digit Indian account numbers.
- Deposit money in **Indian Rupees (₹)** into any active bank account with atomic Prisma transaction guarantees.
- Withdraw money in **₹** with real-time balance validation and atomic debit operations.
- Transfer funds between accounts with full atomic rollback ensuring zero balance inconsistency.
- View real-time transaction statements with Indian currency formatting (`₹1,00,000.00`), type filtering, and chronological ordering.

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js (CommonJS)
- **Framework**: Express.js
- **Database ORM**: Prisma ORM (v6.19.3)
- **Database**: PostgreSQL (`banking_management`)
- **Authentication**: JSON Web Tokens (jsonwebtoken) & bcryptjs
- **Cross-Origin**: CORS enabled for `http://localhost:5173`
- **Environment**: dotenv

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Styling**: Modern responsive CSS with card elevation, accessible modals, and micro-interactions

---

## 📂 Project Architecture

```
BANKING-MANAGEMENT-SYSTEM-FINAL/
│
├── BACKEND/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── routes/
│   │   ├── customerRoutes.js
│   │   └── accountRoutes.js
│   ├── middleware/
│   │   └── auth.js
│   ├── src/
│   │   └── prisma/
│   │       └── client.js
│   ├── utils/
│   │   ├── accountNumberGenerator.js
│   │   └── formatters.js
│   ├── verify-api.js
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── FRONTEND/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── CreateAccountModal.jsx
│   │   │   ├── DepositModal.jsx
│   │   │   ├── WithdrawModal.jsx
│   │   │   ├── TransferModal.jsx
│   │   │   └── TransactionHistory.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── DashboardPage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── .gitignore
├── README.md
├── START-BANKING.bat
└── START-BANKING.ps1
```

---

## 🚀 Quick Start (One-Click)

### Windows Quick Launch
Simply double-click:
```bat
START-BANKING.bat
```
*or in PowerShell:*
```powershell
.\START-BANKING.ps1
```

The script will automatically:
1. Verify Node.js and npm versions.
2. Check PostgreSQL availability on port 5432.
3. Start the Backend API at `http://localhost:5000`.
4. Start the Frontend Application at `http://localhost:5173`.
5. Open your default web browser to the Banking portal.

---

## ⚙️ Manual Setup & Execution

### 1. Backend Setup

```powershell
cd BACKEND

# Install dependencies
npm install

# Validate & generate Prisma client
npx prisma validate
npx prisma generate

# Apply migrations
npx prisma migrate dev --name init

# Start API server
npm start
```
*Backend runs on:* `http://localhost:5000`

### 2. Frontend Setup

```powershell
cd FRONTEND

# Install dependencies
npm install

# Start development server
npm run dev
```
*Frontend runs on:* `http://localhost:5173`

---

## 🔒 Environment Configuration

### Backend (`BACKEND/.env`)
```ini
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/banking_management?schema=public"
JWT_SECRET="banking-management-secret-2026"
PORT=5000
```

### Frontend (`FRONTEND/.env`)
```ini
VITE_API_URL=http://localhost:5000
```

---

## 📡 API Endpoints

### 🩺 Health Check
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health verification (`{ "status": "ok" }`) |

### 👤 Customers
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/customers/register` | Register new customer (hashed password) |
| `POST` | `/api/customers/login` | Login and receive JWT token |
| `GET` | `/api/customers/me` | Fetch authenticated customer profile |

### 💳 Accounts & Banking Operations
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/accounts` | Open a new bank account with unique account number |
| `GET` | `/api/accounts` | List accounts (supports `?customerId=...`) |
| `GET` | `/api/accounts/:id` | Fetch specific account details |
| `POST` | `/api/accounts/:id/deposit` | Deposit funds (atomic Prisma transaction) |
| `POST` | `/api/accounts/:id/withdraw` | Withdraw funds (balance validation & atomic transaction) |
| `POST` | `/api/accounts/transfer` | Atomic fund transfer between accounts |
| `GET` | `/api/accounts/:id/transactions` | Fetch account transaction history (newest first) |

---

## 🧪 Automated Testing

To run the complete automated API test suite:
```powershell
cd BACKEND
node verify-api.js
```
This tests registration, login, JWT validation, duplicate detection, account opening, deposits, withdrawals, overdraft rejections, atomic transfers, same-account rejections, and transaction statement verification.
