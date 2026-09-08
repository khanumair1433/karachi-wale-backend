# Karachi Wale

A WhatsApp-style messenger: register with your name and mobile number, add
contacts by their number, and chat in real time. Two parts:

- **`backend/`** — Node.js + Express + Socket.IO server. Handles phone
  verification (OTP), the contacts directory, and real-time message delivery.
  Data is stored in a local JSON file (via `lowdb`) so it runs with zero
  external database setup — good for getting started, swap for Postgres/Mongo
  before you have real users.
- **`app/`** — Expo (React Native) app. This is what becomes your Android app.

This has been tested end-to-end on the backend (OTP → login → contacts →
message history all verified working). The Android build itself needs to run
on your own machine or in Expo's cloud build service, since it requires the
Android SDK — that tooling doesn't exist in this chat environment.

---

## 1. Run the backend

```bash
cd backend
cp .env.example .env      # edit JWT_SECRET to something random
npm install
npm start
```

You should see `Karachi Wale server running on http://localhost:4000`.

By default, OTP codes are printed to the server console instead of sent as a
real text message — open `backend/src/routes/auth.js` and look for the
`TODO: SEND REAL SMS` comment to wire up a provider like Twilio or Msg91
before real users rely on this.

## 2. Run the app in development

```bash
cd app
npm install
npx expo start
```

This opens Expo's dev tools. Install the **Expo Go** app on your Android
phone from the Play Store, then scan the QR code — the app will load
directly on your phone for testing, no build required.

**Important:** `app/app.json` points `extra.apiUrl` at `http://10.0.2.2:4000`,
which is a special address that only works from the Android *emulator*
reaching a server on the same computer. For a real phone, change it to your
computer's LAN IP (e.g. `http://192.168.1.42:4000`) so your phone can reach
it over WiFi, or to your deployed server's real address once you host the
backend somewhere (Render, Railway, Fly.io all have free tiers).

## 3. Build a real, installable Android app

Once you're happy with it in Expo Go, turn it into an actual APK/AAB:

```bash
cd app
npm install -g eas-cli
eas login          # free Expo account
eas build:configure
eas build -p android --profile preview   # builds an installable APK
```

This runs the Android build in Expo's cloud — you don't need Android Studio
installed. When it finishes you get a download link for a real `.apk` file
you can install directly on your phone (enable "Install from unknown
sources"), or share with your Karachi relatives to sideload.

To publish it properly on the **Play Store** instead, use
`eas build -p android --profile production` and follow Expo's submission
docs (`eas submit -p android`) — you'll need a $25 one-time Google Play
developer account.

Alternatively, if you'd rather build locally with Android Studio directly
(more control, no Expo cloud dependency): `npx expo prebuild` generates a
native `android/` folder you can open in Android Studio and build normally.

---

## What's genuinely production-ready vs. what to change before real users

**Solid to keep:**
- Auth flow (phone + OTP + JWT), contacts, and Socket.IO message delivery —
  all tested and working.
- Data model (users / contacts / conversations) is simple to migrate to a
  real database later.

**Needs work before this handles real strangers' data:**
- **Real SMS delivery** — currently OTPs only print to the server console.
- **A real database** — the JSON file (`lowdb`) works for dozens of users,
  not thousands; move to Postgres or MongoDB before wider release.
- **Push notifications** — messages only arrive while the app is open and
  connected. Add Expo push notifications (`expo-notifications` + Firebase
  Cloud Messaging) so people get notified when the app is closed.
- **Rate limiting** on `/auth/request-otp` so it can't be spammed.
- **HTTPS** — deploy the backend behind TLS, not plain HTTP, before phones
  send real tokens over the network.
