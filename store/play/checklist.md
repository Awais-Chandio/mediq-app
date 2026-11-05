# MediQ on Google Play — checklist

Package `com.mediq.app`, app name MediQ. Build: `release/android-1.0`.

## 0. Before the first upload (one time)

- [ ] Firebase: add the Android app `com.mediq.app` to project `queueless-c57ab`,
      download the new `google-services.json`, and give Claude its path.
- [ ] Back up `~/mediq-keys/mediq-upload.jks` **and** the four `MEDIQ_UPLOAD_*`
      lines of `~/.gradle/gradle.properties` to two places off this Mac (for
      example a password manager plus an encrypted USB drive). Without this key
      and password you can't upload updates until Google resets the upload key,
      which takes days.
- [ ] `SENTRY_DSN` in `.env` (from sentry.io → Project → Client Keys), or ship without crash reports.
- [ ] Set the support WhatsApp in /admin, and `NEXT_PUBLIC_SUPPORT_EMAIL` in Vercel. The legal pages show them.
- [ ] Merge and deploy `legal-pages` (mediq-web), then check that `/privacy`, `/terms` and `/delete-account` open on the live site.
- [ ] Add an in-app "Delete account" link to the profile screens. It can just open
      `/delete-account`. Play requires an in-app path as well as the web URL.
- [ ] Create a reviewer account on MediQ Demo Clinic (doctor + receptionist).

## 1. Play Console account

- [ ] Sign up at play.google.com/console ($25 one-time fee). Pick **Personal** or **Organization**.
      An Organization account needs a D-U-N-S number but skips the 12-tester rule below.
- [ ] Verify identity (CNIC/passport), address and a phone number. Verification can take a few days.
- [ ] Set the public developer name and contact email. Both appear on the store page.
- [ ] Payments profile: only needed for paid apps. MediQ is free to download, so skip it.

## 2. Create the app

- [ ] Create app → name **MediQ**, default language **English (United States) – en-US**, App, Free.
- [ ] Add the translation **Urdu – ur**.
- [ ] **App content:** fill in every section from `store/play/data-safety.md`.
- [ ] **Main store listing**, per language, from `store/play/listing.md` and:
  - App icon: `store/play/icon-512.png`
  - Feature graphic: `store/play/<en|ur>/feature-graphic-1024x500.png`
  - Phone screenshots: `store/play/<en|ur>/phone/1…6-*.png`
- [ ] Setup → **App signing**: keep "Google-generated key" (Play App Signing). Upload with our upload key.
- [ ] After the first upload, copy the **app signing key** SHA-1/SHA-256 from Setup → App signing
      into Firebase (Project settings → com.mediq.app → Add fingerprint). Do this before you turn phone sign-in back on.

## 3. Internal testing (optional, same day)

- [ ] Testing → Internal testing → Create release → upload `app-release.aab` → add your own email.
- [ ] Install from the opt-in link and run the smoke test: sign in, Today's Queue, call next, push.

## 4. Closed testing: 12 testers for 14 days (new personal accounts)

- [ ] Testing → Closed testing → create a track → upload the same AAB.
- [ ] Testers: a Google Group or an email list of **at least 12** people with Android phones
      (doctors and receptionists at the pilot clinics are ideal).
- [ ] Send them the opt-in link. Each tester must **opt in and install**.
- [ ] Keep **at least 12 opted-in testers for 14 days in a row**. The clock restarts if you drop below 12.
- [ ] Ask testers to actually use the app and leave feedback. Google asks about this when you apply for production.
- [ ] Ship fixes as new closed-test releases (versionCode 2, 3, …). That doesn't restart the 14 days.
- [ ] Day 15 or later: Dashboard → **Apply for production**. Answer the questions about testers,
      feedback and changes. The review takes up to about 7 days.

## 5. Production

- [ ] Production → Create release → promote the tested AAB (or upload a new versionCode).
- [ ] Countries: Pakistan (add more later).
- [ ] Staged rollout: 20% → 50% → 100% while you watch Sentry and Play vitals.
- [ ] First review of a health-related app can take several days. Respond to any policy email quickly.

## Every later release

- [ ] Bump `versionCode` (+1) and `versionName` in `android/app/build.gradle`.
- [ ] `cd android && ./gradlew bundleRelease`, then upload `app/build/outputs/bundle/release/app-release.aab`.
- [ ] Update Data Safety if data collection changes (location, analytics, new SDKs).
