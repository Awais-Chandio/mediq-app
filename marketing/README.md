# MediQ portfolio kit

Screenshots, a demo video and an interactive click-through demo of MediQ, plus
images for social media pages. The app isn't on the Play Store or App Store yet,
so everything says **“Coming soon”** and nothing says “download”.

All names, clinics and numbers are demo data from the local stack (the seed's
real hospital names are renamed by `tools/demo-data.sql`).

## What's here

| Folder | What | Use it for |
|---|---|---|
| `screenshots/web/` | 26 screens of the web app at 2× (1440×900 desktop, 390×844 phone, 1920×1080 TV) | Portfolio case study, Behance/Dribbble |
| `screenshots/mobile/` | 18 screens of the Android app (Pixel 9 Pro, 1280×2856) | Same, and later the store listing |
| `video/mediq-demo-16x9.mp4` | ~85 s walkthrough, 1920×1080 | Portfolio, YouTube, LinkedIn, website |
| `video/mediq-demo-9x16.mp4` | Same story, 1080×1920 | Instagram/Facebook Reels, Stories, TikTok |
| `demo/index.html` | Interactive tour: 32 steps in 7 chapters, click the pulsing button to move on, autoplay, ← → keys | Portfolio link (open locally or the published link) |
| `social/` | Profile picture, covers and posts (sizes are in the file names) | Facebook, Instagram, LinkedIn, X, YouTube, WhatsApp |

The videos are silent on purpose. Add a track in CapCut or pick one in
Instagram/TikTok when posting.

### The flow shown

1. **Clinic setup** (web): owner account → clinic → doctors → receptionist invite → QR poster → fees and Easypaisa/bank details.
2. **Front desk** (web): walk-in tokens with the fee, one queue per doctor, call next.
3. **Patient's phone** (web, no app): scan the QR (Urdu by default) → pay the fee online → reception verifies → live position in the line.
4. **Live queue**: TV in the waiting room, “you're next”, “it's your turn”.
5. **Doctor app** (Android): dashboard, today's queue, now serving, notes and prescription, schedule.
6. **Owner & reception app** (Android): today's numbers, the desk on a phone, walk-in with fee, late/break.
7. **Records & plans** (web), and the staff side in Urdu.

### Social images

| File | Where |
|---|---|
| `profile-1080x1080.png` | Profile picture everywhere (shows as a circle) |
| `facebook-cover-1640x624.png` | Facebook page cover |
| `linkedin-banner-1584x396.png` | LinkedIn page banner |
| `x-header-1500x500.png` | X (Twitter) header |
| `youtube-banner-2560x1440.png` | YouTube channel art (text stays in the TV-safe middle) |
| `post-coming-soon-1080x1080.png`, `post-for-clinics-1080x1080.png` | Square posts |
| `post-how-it-works-1080x1350.png` | Instagram portrait post |
| `story-coming-soon-1080x1920.png` | Stories / WhatsApp status |
| `og-image-1200x630.png` | Link preview for the demo page |

## Changing the text

The story (titles, descriptions, which screen, where the hotspot is) is in
`demo/steps.js`; brand lines (“Coming soon”, tagline, your credit line) are at
the top of the same file. The demo page and the video both read it. Social
images are plain HTML in `social/social.html`.

After an edit, re-render (from this folder):

```sh
NODE_PATH=../../mediq-web/node_modules node video/render.js           # both videos (~5 min)
NODE_PATH=../../mediq-web/node_modules node video/render.js landscape --stills 5 20 40   # check frames first
NODE_PATH=../../mediq-web/node_modules node social/render.js
cp video/mediq-demo-16x9.mp4 demo/media/                               # the demo page's video button
```

`tools/build.sh` does all of it, and also rebuilds `demo/img/` from the screenshots.

## Taking the screenshots again

Everything runs against the **local** Supabase stack, never production.

```sh
# from the repo root
supabase start && supabase db reset
docker exec -i supabase_db_QueueLess psql -U postgres -d postgres < marketing/tools/demo-data.sql

# web: mediq-web on :3100 (next build && next start -p 3100 in ../mediq-web)
NODE_PATH=../mediq-web/node_modules node marketing/tools/capture-web.js
```

The script creates the clinic, walks the whole flow and writes
`screenshots/web/*.png` plus `hotspots.json` (where each clicked button is, for
the demo).

Android (emulator `Pixel_9_Pro`): build with the local stack,
`ENVFILE=.env.demo` (`SUPABASE_URL=http://10.0.2.2:54321` and the local anon
key), then drive it with `tools/droid.py` (tap by coordinates, type, screenshot,
clean demo status bar). Give the doctor a queue first with
`tools/seed-doctor-queue.js`. The owner screens use the clinic that
`capture-web.js` created. Two things that help: disable the on-screen keyboard
(`adb shell ime disable …LatinIME`, adb text input still works) so its toolbar
doesn't show in shots, and silence the dev warning toast with a temporary
`LogBox.ignoreAllLogs()`.
