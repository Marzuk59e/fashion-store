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

Copy `.env.example` to `.env` and set:

- `VITE_OTP_SEND_ENDPOINT`: POST endpoint to send a 6-digit email OTP.
- `VITE_OTP_VERIFY_ENDPOINT`: POST endpoint to verify OTP before account creation.

Expected JSON contracts:

- OTP send request: `{ "email": "user@example.com", "purpose": "register" }`
- OTP verify request: `{ "email": "user@example.com", "code": "123456", "purpose": "register" }`

## Firebase Functions setup

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


