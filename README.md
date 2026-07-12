# NearAppoint — landing + auth

Static. No build step. Deploy as-is.

## Files
```
index.html    landing page (salon-focused)
login.html    sign in — phone + WhatsApp/SMS OTP
verify.html   OTP entry (6 boxes, paste, resend, SMS fallback)
signup.html   salon signup
styles.css    shared brand tokens + components
assets/logo.svg   ← REPLACE THIS with your real logo
```

## Swap the logo
Drop your logo in as `assets/logo.svg` (or .png and update the `<img src>` in
all 4 HTML files). Keep it around 200x44. Sizing is handled in CSS (`.logo img`).

## Deploy
```bash
npx vercel --prod
```
Then point nearappoint.com at it in the Vercel dashboard.

## Before you send any traffic
The forms currently only confirm in the UI. Wire these up:

- `index.html`  → salon early-access form + customer waitlist
- `login.html`  → POST /auth/otp/request
- `verify.html` → POST /auth/otp/verify  (currently ALWAYS fails, on purpose, so you can see the error state)
- `signup.html` → POST /auth/otp/request, create business only AFTER verify

Quickest path: a Supabase table + `supabase-js`, or Formspree for a day-one hack.

## Rate limits (do this server-side, day one)
OTP request is the most abusable endpoint you will ever ship. Every abuse costs
you money in SMS. **3 per hour per number, 10 per hour per IP, 5 verify attempts
per code then burn it.**
