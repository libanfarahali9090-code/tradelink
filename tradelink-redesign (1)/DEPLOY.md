# Putting this version live

Do these in order. Do not publish the rules before the code.

1. **Back up first.** In the Firebase console, open Firestore, then your database, and note the project and database ID. (Optional: export from Google Cloud if you have real orders.)
2. **Put this code live.** Replace your project files with the contents of this zip (GitHub upload, or AI Studio import). Keep your own `.env.local` or Vercel `VITE_FIREBASE_*` settings. In AI Studio, keep its `firebase-applet-config.json`; it is used automatically.
3. **Publish `firestore.rules`.** Firebase console, Firestore, the Security tab, paste the whole file, Publish.
4. **Sign in once as the owner** (`kaafiebirr95@gmail.com`). This creates the public listings and agents from your products.
5. **Test signed out** in a private tab: marketplace loads, contact buttons work, no cost price shown.
6. **Lock the API key** in Google Cloud Console, Credentials: Websites only, your site address.

Placeholder agent phone numbers and Telegram usernames must be replaced before launch.
