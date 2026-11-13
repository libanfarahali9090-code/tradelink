# TradeLink — B2B Food Wholesale Distribution Platform

TradeLink is a centrally operated B2B food trading, single-warehouse inventory, order fulfillment, and owner-commission platform built for **Malka Jabdu, Ethiopia**, with full **English**, **Somali**, and **Amharic** language support, light/dark themes, and Firebase Authentication + Cloud Firestore persistence.

## Public marketplace (no registration)
The app opens on a public marketplace. Customers browse food listings and contact the agent straight away by **WhatsApp**, **Telegram** or **phone call**. Each listing shows availability, collection location, last stock update and the agent. Prices read "Negotiable".
- Staff open the workspace at `/#staff`; the workspace links back with `/#market`.
- Agents live in the `agents` collection (`Agent` type). Telegram links need a **username** (no @); a phone number alone cannot open a Telegram chat.
- `stockUpdatedAt` is stamped on every stock movement, order reservation, release and product edit that changes quantity.
- **Public data is separate from private data.** Visitors read only `public_listings` (no cost price, supplier, selling price or minimum stock) and active `agents`. `products` is now readable by staff only. Every product save, stock movement, order reservation, cancellation and delete updates the matching listing in the same batch. On first sign-in by an owner or admin after upgrading, listings are backfilled from existing products.
- For a local demo without Firebase data, set `VITE_PUBLIC_DEMO_DATA=true` to show the built-in sample catalogue.
- Seed agent phone numbers and Telegram usernames are placeholders. Replace them before launch.

## Core Architecture
- **Single Central Warehouse**: All food inventory is tracked at the Malka Jabdu Central Warehouse across dedicated storage bays.
- **Food Products First**: 8 food categories (Rice, Flour, Sugar, Cooking Oil, Dates, Pasta, Beans, Other Food Products) with localized product titles.
- **Owner-Paid Commissions**: Platform fees are paid exclusively by the TradeLink Owner — buyers and suppliers are never charged.
- **Stack**: React 19, TypeScript, Vite, Tailwind CSS v4, Motion (`motion/react`), Lucide Icons, Firebase Auth & Cloud Firestore.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run TypeScript checks:
   ```bash
   npm run lint
   ```

3. Start the development server on port 3000:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Firebase Setup
- Ensure `firebase-applet-config.json` contains your Firebase project configuration (`apiKey`, `authDomain`, `projectId`, `firestoreDatabaseId`).
- Enable **Google Sign-In** in Firebase Authentication.
- Deploy `firestore.rules` to your Firestore database before running live writes.

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com/).
3. Vercel automatically detects `vercel.json` (`vite` framework preset, `npm run build`, output directory `dist`, SPA rewrite to `/index.html`).
4. Click **Deploy**.
