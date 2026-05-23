# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Production wiring (OTP)

Sign-up sends a 6-digit code by email. The live site (Vercel) calls **`/api/send-registration-otp`** and **`/api/verify-registration-otp`** automatically — you do not need `VITE_OTP_*` unless you override the URLs.

### Vercel (recommended)

1. Deploy the site to Vercel (push to `main`).
2. In **Vercel → Project → Settings → Environment Variables**, add:

| Variable | Example |
|----------|---------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Full JSON from Firebase Console → Project settings → Service accounts → Generate new private key (paste as one line) |
| `OTP_HASH_SECRET` | Any long random string |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Gmail **App Password** (not your normal password) |
| `OTP_FROM_EMAIL` | Same as `SMTP_USER` |
| `OTP_FROM_NAME` | `sanjiiiii` |

1. Redeploy after saving variables.

**Gmail:** turn on 2-Step Verification, then create an App Password under Google Account → Security.

Optional overrides in `.env` (see `.env.example`):

- `VITE_OTP_SEND_ENDPOINT` / `VITE_OTP_VERIFY_ENDPOINT`

Expected JSON contracts:

- OTP send: `{ "email": "user@example.com", "purpose": "register" }`
- OTP verify: `{ "email": "user@example.com", "code": "123456", "purpose": "register" }`

## Firebase Functions setup (alternative)

Functions were added in `functions/`:

- `sendRegistrationOtp`
- `verifyRegistrationOtp`

### 1) Set required secrets

```bash
firebase functions:secrets:set OTP_HASH_SECRET
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_PORT
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
firebase functions:secrets:set OTP_FROM_EMAIL
firebase functions:secrets:set OTP_FROM_NAME
```

### 2) Deploy functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

### 3) Set frontend `.env`

Replace `<project-id>` with your Firebase project id:

```env
VITE_OTP_SEND_ENDPOINT=https://us-central1-<project-id>.cloudfunctions.net/sendRegistrationOtp
VITE_OTP_VERIFY_ENDPOINT=https://us-central1-<project-id>.cloudfunctions.net/verifyRegistrationOtp
```

## Vercel push-to-live troubleshooting

If `git push` succeeds but the production site does not update immediately, follow:

- [docs/vercel-deploy-runbook.md](docs/vercel-deploy-runbook.md)

Quick checks:

1. Confirm latest Vercel deployment commit hash equals your pushed commit hash.
2. If hash matches, validate cache with:
   - hard reload (`Ctrl+Shift+R`)
   - incognito window
   - versioned URL (`?v=<short-commit>`)
3. For urgent production fixes only, use manual fallback:

```bash
npx vercel --prod
```
