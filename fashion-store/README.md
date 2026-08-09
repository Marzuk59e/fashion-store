# sanjiiiii · Fashion Store

A full-stack fashion e-commerce storefront with a separate admin panel, built with **React 19**, **Firebase**, and **Vite**. Includes Google & email-OTP authentication, real-time Firestore catalog, order management, and a dark-themed admin dashboard — ready to deploy on Vercel or Firebase Hosting.

---

## ✨ Features

### Storefront

- 🛍️ Product catalog with category filters, search, and size selection
- 🛒 Shopping bag (cart) with quantity management
- ❤️ Wishlist
- 👤 Customer accounts — Google sign-in or email + OTP registration
- 📦 Order placement and order history
- 🍪 GDPR-ready cookie consent (Necessary / Analytics / Marketing)
- 📱 Fully responsive — mobile, tablet, desktop
- ✨ Smooth animations, custom scrollbar, lazy image loading

### Admin Panel (`/admin`)

- 📊 Dashboard — overview of products, orders, customers
- 🗂️ Product management — add, edit, delete, bulk upload via Excel (.xlsx)
- 📋 Order management — view all orders, update status (pending → shipped → delivered)
- 👥 Customer list — view registered users and order counts
- 🔒 Role-based access — only verified admin UIDs can log in
- 🌙 Dark-themed UI

---

## 🗂️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8 |
| Auth | Firebase Authentication (Google + Email OTP) |
| Database | Cloud Firestore |
| Storage | Firebase Storage |
| Email OTP | Nodemailer via Vercel Serverless / Firebase Functions |
| Deployment | Vercel (recommended) or Firebase Hosting |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd fashion-store
npm install
```

### 2. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Enable **Authentication** → Sign-in methods: **Google** and **Email/Password**.
3. Enable **Firestore Database** (production mode).
4. Enable **Storage**.
5. Go to **Project Settings → General** and copy your web app config.

### 3. Set Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# Optional: only needed if you self-host the OTP API outside Vercel
VITE_OTP_SEND_ENDPOINT=
VITE_OTP_VERIFY_ENDPOINT=
```

For the OTP email system, set these in **Vercel → Project → Settings → Environment Variables**:

| Variable | Description |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON from Firebase Console → Project Settings → Service Accounts → Generate new private key |
| `OTP_HASH_SECRET` | Any long random string |
| `SMTP_HOST` | e.g. `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your sender Gmail address |
| `SMTP_PASS` | Gmail **App Password** (not your normal password) |
| `OTP_FROM_EMAIL` | Same as `SMTP_USER` |
| `OTP_FROM_NAME` | Your store name |

> **Gmail tip:** Enable 2-Step Verification, then create an App Password under Google Account → Security → App Passwords.

### 4. Deploy Firestore & Storage Rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project
firebase deploy --only firestore:rules,storage
```

### 5. Create Your First Admin Account

1. Run the app locally (`npm run dev`) and go to `/admin`.
2. Create an account with your email and the admin secret key.
3. In Firebase Console → Firestore, open the `admins` collection and set `active: true` for your UID.

> The admin secret key is set in `src/AdminApp.jsx` — **change it before going live**.

### 6. Run Locally

```bash
npm run dev
```

- Storefront: `http://localhost:5173`
- Admin panel: `http://localhost:5173/admin`

### 7. Build & Deploy to Vercel

```bash
npm run build
```

Or push to GitHub and connect the repo to [Vercel](https://vercel.com). The build outputs two entry points (`index.html` and `admin.html`) — Vite handles both automatically.

---

## 📁 Project Structure

```
fashion-store/
├── src/
│   ├── App.jsx              # Main storefront
│   ├── AdminApp.jsx         # Admin panel
│   ├── AdminLogin.jsx       # Admin login screen
│   ├── firebase.js          # Firebase init (storefront + admin instances)
│   ├── main.jsx             # Storefront entry
│   ├── admin-main.jsx       # Admin entry
│   ├── components/          # Shared UI components
│   ├── data/                # Product catalog & image helpers
│   ├── lib/                 # OTP auth utilities
│   └── styles/              # Additional CSS
├── api/                     # Vercel serverless OTP functions
├── functions/               # Firebase Cloud Functions (OTP alternative)
├── firestore.rules          # Firestore security rules
├── storage.rules            # Storage security rules
├── firebase.json            # Firebase project config
├── vite.config.js           # Dual entry-point build
├── sample-products.xlsx     # Example catalog for bulk upload
└── .env.example             # Environment variable template
```

---

## 📦 Bulk Product Upload

The admin panel supports uploading products from an Excel file.

Use `sample-products.xlsx` as a template. Required columns:

| Column | Type | Example |
|---|---|---|
| `id` | number | `1` |
| `name` | string | `Silk Wrap Dress` |
| `brand` | string | `Sanjiiiii` |
| `price` | number | `129` |
| `category` | string | `Women` |
| `sizes` | comma-separated | `XS,S,M,L` |
| `image` | URL | `https://...` |
| `bg` | 2 hex colors | `#F5EEE6,#EDE4D8` |
| `desc` | string | `Lightweight silk...` |
| `badge` *(optional)* | string | `New` |
| `compareAt` *(optional)* | number | `159` |

---

## 🔒 Security Notes

- Firestore and Storage rules enforce role-based access — only authenticated admins can write to the catalog or read all orders.
- The admin panel uses a **separate Firebase Auth instance** (`browserSessionPersistence`) so admin sessions are isolated from storefront customer sessions.
- Before going live, move `ADMIN_SECRET_KEY` in `AdminApp.jsx` to an environment variable.

---

## 📜 License

MIT — free to use, modify, and sell.
