# MediQ 1.0 — Play Console answers

These answers describe build 1.0.0 (versionCode 1) on `release/android-1.0`.
They depend on three facts. If one changes, revisit the answers:

1. **No location.** The manifest strips the location permissions, because
   Nearby clinics and the Map sit behind `PATIENT_MARKETPLACE_ENABLED = false`.
2. **Firebase Analytics is in the build** (`firebase-analytics` in
   android/app/build.gradle). It collects app interactions and an app instance
   ID automatically. If you remove that dependency, drop "App interactions" and
   every "Analytics" purpose below.
3. **Sentry runs only when `SENTRY_DSN` is set** in `.env`. Without a DSN,
   remove "Crash logs" and "Diagnostics".

Phone (OTP) sign-in is off (`PHONE_LOGIN_ENABLED = false`), so Firebase Auth
receives no phone numbers.

## Data safety → Data collection and security

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS only, Supabase/Firebase/Sentry) |
| Which account creation methods does your app support? | **Username and password** (email), **OAuth** (Sign in with Google) |
| Delete account URL | `https://mediq-web-ruddy.vercel.app/delete-account` |
| Can users request deletion of some data without deleting the account? | **No** (they can edit or remove their profile photo and name in the app) |

## Data types

"Shared" is **No** everywhere: Supabase, Firebase and Sentry are service
providers that process data for MediQ, and the clinic is the party the user is
using the app with. "Processed ephemerally" is **No** everywhere.

| Category → type | Collected | Required or optional | Purposes |
|---|---|---|---|
| Personal info → **Name** | Yes | Required | App functionality, Account management |
| Personal info → **Email address** | Yes | Required | App functionality, Account management |
| Personal info → **User IDs** | Yes | Required | App functionality, Account management |
| Personal info → **Phone number** | Yes | Optional | App functionality |
| Financial info → **Other financial info** (fee amount, cash/Easypaisa/JazzCash/bank, transaction ID) | Yes | Optional | App functionality |
| Health and fitness → **Health info** (diagnosis, notes, prescriptions) | Yes | Optional | App functionality |
| Photos and videos → **Photos** (profile photo) | Yes | Optional | App functionality |
| App activity → **App interactions** (Firebase Analytics) | Yes | Required | Analytics |
| App info and performance → **Crash logs** (Sentry) | Yes | Required | App functionality, Analytics |
| App info and performance → **Diagnostics** (Sentry, Firebase) | Yes | Required | App functionality, Analytics |
| Device or other IDs → **Device or other IDs** (FCM token, Firebase instance ID) | Yes | Required | App functionality, Analytics |

**Not collected:** location (approximate or precise), address, race/ethnicity,
political or religious beliefs, sexual orientation, other personal info, user
payment info (card or bank numbers), purchase history, credit score, fitness
info, videos, audio, files and docs, calendar, contacts, messages (email, SMS,
in-app), web browsing history, installed apps, in-app search history, other
user-generated content, other actions.

Camera: QR scans are processed on the device and never uploaded, so the camera
itself is not a collected data type.

## Other declarations in App content

| Section | Answer |
|---|---|
| Privacy policy | `https://mediq-web-ruddy.vercel.app/privacy` |
| App access | **All or some functionality is restricted.** Give a reviewer login: a demo doctor and a demo receptionist on **MediQ Demo Clinic** (email + password), with steps "Sign in → Today's Queue". Never use a real clinic's account. |
| Ads | **No**, the app contains no ads |
| Content rating | Category **Utility, Productivity, Communication or Other**; no violence, sexual content, gambling or drugs; users interact? **No** (no user-to-user chat); shares location? **No**; digital purchases? **No** |
| Target audience | **18 and over** only. Not designed for children. |
| News app | No |
| COVID-19 contact tracing / status | No |
| Data safety | As above |
| Government app | No |
| Financial features | **My app doesn't provide any financial features** (fees are paid to clinics outside the app; MediQ moves no money) |
| Health apps | Select the clinic/healthcare-provider workflow features (patient queue and appointment management, clinical notes/prescriptions for providers). It is **not** a medical device and does **not** diagnose or treat. |
| Advertising ID | **No** (the app doesn't use the advertising ID). If Play's pre-launch report flags `AD_ID` from Firebase Analytics, add `<uses-permission android:name="com.google.android.gms.permission.AD_ID" tools:node="remove"/>` to the manifest |
