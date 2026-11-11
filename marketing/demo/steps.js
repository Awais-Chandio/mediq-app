// The MediQ product story, shared by the interactive demo (demo/index.html) and
// the video (video/video.html). Images are in demo/img/ (made from
// screenshots/ by tools/build.sh). Hotspots are the button the next step
// clicks, in % of the image: web ones come from screenshots/web/hotspots.json.
window.MEDIQ = {
  brand: {
    name: 'MediQ',
    tagline: 'Clinic queues without the crowded waiting room',
    pitch: 'Patients scan a QR code, get a token on their phone and come in when it’s their turn. Reception, doctors and the clinic owner see the same live queue.',
    status: 'Coming soon',
    statusLine: 'Launching soon on Android, iOS and the web',
    credit: 'Designed & built by Muhammad Awais',
  },

  chapters: [
    { id: 'setup', title: 'Clinic setup', icon: '🏥' },
    { id: 'desk', title: 'Front desk', icon: '🧾' },
    { id: 'patient', title: 'Patient’s phone', icon: '📱' },
    { id: 'live', title: 'Live queue', icon: '📺' },
    { id: 'doctor', title: 'Doctor app', icon: '🩺' },
    { id: 'owner', title: 'Owner & reception app', icon: '📊' },
    { id: 'records', title: 'Records & plans', icon: '📈' },
  ],

  steps: [
    // Clinic setup (web)
    { ch: 'setup', frame: 'browser', url: '/onboarding', img: 'web-01-onboarding-1-account', hot: { x: 50, y: 64.8 },
      title: 'Create the owner account', body: 'A clinic signs up on its own. No sales call, nothing to install.' },
    { ch: 'setup', frame: 'browser', url: '/onboarding', img: 'web-02-onboarding-2-clinic', hot: { x: 70, y: 64.8 },
      title: 'Add the clinic', body: 'Name, city, address and opening hours.' },
    { ch: 'setup', frame: 'browser', url: '/onboarding', img: 'web-03-onboarding-3-doctors', hot: { x: 70, y: 92.1 },
      title: 'Add the doctors', body: 'Each doctor gets their own queue, room number and fee.' },
    { ch: 'setup', frame: 'browser', url: '/onboarding', img: 'web-04-onboarding-4-reception', hot: { x: 67.7, y: 50.1 },
      title: 'Invite the receptionist', body: 'Staff get an email invite and their own login.' },
    { ch: 'setup', frame: 'browser', url: '/onboarding', img: 'web-05-onboarding-5-qr-poster', hot: { x: 30.4, y: 28.4 }, tall: true,
      title: 'Print the QR poster', body: 'One poster at the door. Patients scan it to join the line, in Urdu or English.' },
    { ch: 'setup', frame: 'browser', url: '/settings', img: 'web-07-settings-fees', hot: { x: 4.9, y: 96.8 }, tall: true,
      title: 'Set fees and payment details', body: 'Fees per doctor, plus Easypaisa, bank and Raast details for online payment.' },

    // Front desk (web)
    { ch: 'desk', frame: 'browser', url: '/reception', img: 'web-08-reception-new-walk-in', hot: { x: 85.7, y: 87.1 },
      title: 'Walk-ins get a token', body: 'Reception types a name, takes the fee and issues a token. Press W for a new walk-in.' },
    { ch: 'desk', frame: 'browser', url: '/reception', img: 'web-09-reception-queue', hot: { x: 45.6, y: 50 },
      title: 'One queue per doctor', body: 'Everyone waiting, who has paid and how. Press N to call the next patient.' },
    { ch: 'desk', frame: 'browser', url: '/reception', img: 'web-10-reception-now-serving',
      title: 'Call the next patient', body: 'The TV, the patient’s phone and the doctor’s app update at the same moment.' },

    // Patient's phone (web, no app needed)
    { ch: 'patient', frame: 'phone', url: '/c/city-care-clinic', img: 'web-11-patient-join-urdu', hot: { x: 50, y: 88.8 }, tall: true,
      title: 'Scan the QR, get a token', body: 'No app to install. The page opens in Urdu by default, English is one tap away.' },
    { ch: 'patient', frame: 'phone', url: '/t/…', img: 'web-13-patient-pay-fee', hot: { x: 73.7, y: 38.4 },
      title: 'Pay the fee first', body: 'The clinic can ask QR patients to pay before they join the line: cash at the counter or online.' },
    { ch: 'patient', frame: 'phone', url: '/t/…', img: 'web-14-patient-pay-online', hot: { x: 50, y: 69.8 }, tall: true,
      title: 'Pay with Easypaisa or bank', body: 'The clinic’s account details, a copy button for each, and the transaction ID.' },
    { ch: 'patient', frame: 'phone', url: '/t/…', img: 'web-15-patient-payment-checking',
      title: 'Reception checks the payment', body: 'The patient sees their token straight away and waits for confirmation.' },
    { ch: 'patient', frame: 'browser', url: '/reception', img: 'web-16-reception-verify-payment', hot: { x: 83.9, y: 25.6 },
      title: 'Verify in one click', body: 'Online payments land in “Fee pending” with the method and transaction ID.' },
    { ch: 'patient', frame: 'phone', url: '/t/…', img: 'web-17-patient-in-line', tall: true,
      title: 'In the line, from anywhere', body: 'People ahead, estimated wait and who is with the doctor now. The page updates by itself.' },

    // Live queue
    { ch: 'live', frame: 'tv', img: 'web-19-tv-display',
      title: 'TV in the waiting room', body: 'Now serving and next up for every doctor, with a chime. No patient names on screen.' },
    { ch: 'live', frame: 'phone', url: '/t/…', img: 'web-20-patient-almost-turn',
      title: '“You’re next”', body: 'The patient can wait outside, at the pharmacy or at home, and walk in on time.' },
    { ch: 'live', frame: 'phone', url: '/t/…', img: 'web-21-patient-your-turn',
      title: '“It’s your turn”', body: 'A clear call to go to the doctor’s room now.' },
    { ch: 'live', frame: 'browser', url: '/reception', img: 'web-22-reception-busy',
      title: 'A calm front desk', body: 'Both doctors seeing patients, nobody crowding the counter.' },

    // Doctor app (Android)
    { ch: 'doctor', frame: 'phone', img: 'app-12-doctor-dashboard', hot: { x: 50, y: 42.5 },
      title: 'The doctor’s day at a glance', body: 'Who is waiting, who is done and the fees received today.' },
    { ch: 'doctor', frame: 'phone', img: 'app-13-doctor-queue', hot: { x: 50, y: 52.9 },
      title: 'Today’s queue', body: 'Waiting, done and missed patients, with who is up next.' },
    { ch: 'doctor', frame: 'phone', img: 'app-14-doctor-now-serving', hot: { x: 50, y: 49.1 },
      title: 'Call in, complete, repeat', body: 'Call again, skip or mark a no-show without leaving the room.' },
    { ch: 'doctor', frame: 'phone', img: 'app-15-doctor-prescription',
      title: 'Notes and prescription', body: 'Diagnosis, medicines with dose, frequency and duration, and a follow-up date.' },
    { ch: 'doctor', frame: 'phone', img: 'app-16-doctor-schedule',
      title: 'Schedule and time off', body: 'Weekly hours, leave days and the next two weeks of bookings.' },

    // Owner & reception app (Android)
    { ch: 'owner', frame: 'phone', img: 'app-05-owner-today', hot: { x: 73.2, y: 96.4 },
      title: 'Owner: today’s numbers', body: 'Patients and money in, split by cash and online, and by receptionist.' },
    { ch: 'owner', frame: 'phone', img: 'app-07-reception-now-serving', hot: { x: 50, y: 85.1 },
      title: 'The desk on a phone', body: 'Small clinics run reception from a phone. Same live queue as the web desk.' },
    { ch: 'owner', frame: 'phone', img: 'app-08-walk-in-token', hot: { x: 50, y: 83 },
      title: 'Walk-in with the fee', body: 'Cash, Easypaisa, JazzCash, bank or card, recorded with the token.' },
    { ch: 'owner', frame: 'phone', img: 'app-09-token-issued', hot: { x: 50, y: 55.3 },
      title: 'Token issued', body: 'The patient gets an SMS link to follow their turn.' },
    { ch: 'owner', frame: 'phone', img: 'app-11-late-or-break',
      title: 'Doctor running late?', body: 'One tap tells every waiting patient, on the TV and on their phone.' },

    // Records & plans (web)
    { ch: 'records', frame: 'browser', url: '/hisaab', img: 'web-23-records', tall: true,
      title: 'Records', body: 'Every visit and payment for the day, week or month, with a cash closing for each receptionist.' },
    { ch: 'records', frame: 'browser', url: '/settings/plan', img: 'web-24-plans', tall: true,
      title: 'Simple plans', body: 'A free trial, then a monthly plan per clinic.' },
    { ch: 'records', frame: 'browser', url: '/reception', img: 'web-25-reception-urdu',
      title: 'Urdu and English', body: 'The whole staff side also works in Urdu, right to left.' },
  ],
};
