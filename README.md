# KisanConnect

**A bilingual farmer-to-consumer marketplace prototype for the BGI Hackathon 2026 (BT3P2).**

KisanConnect helps farmers showcase produce directly to consumers. The prototype includes role-based demo flows, marketplace simulations, farmer verification, order tracking, and English/Hindi interface text.

## Features

- Consumer marketplace with search, categories, farmer profiles, favorites, cart, checkout, and order history.
- Farmer dashboard for listings, incoming orders, earnings, price guidance, and verification status.
- Five-step sample farmer verification flow with simulated Aadhaar/Kisan ID checks and document uploads.
- Admin dashboard for sample verification decisions, order monitoring, dispute resolution, and review moderation.
- Reviews with star ratings, trust scores, helpful votes, and farmer performance indicators.
- Simulated UPI, wallet, cash-on-delivery, and bank-transfer payments.
- Order tracking with a five-step delivery timeline.
- English/Hindi toggle and browser text-to-speech guidance.
- Responsive layouts with desktop sidebars and mobile navigation.

## Run the prototype

### Requirements

- Node.js 20 or newer
- npm

### Start locally

```bash
git clone https://github.com/r3con-ng/KisanConnect.git
cd KisanConnect
npm ci
npm run dev
```

Open <http://localhost:5173>. The React app renders the original prototype flows and uses browser `localStorage` for demo sessions, cart, favorites, listings, and simulations. MongoDB is not required to run the frontend. Data saved in `localStorage` stays in that browser profile and is not shared across devices.

To reset the local demo, clear this site's storage in your browser's developer tools.

## Demo accounts

Use OTP `123456` with one of the seeded mobile numbers:

| Role | Mobile |
| --- | --- |
| Farmer | `9876543210` |
| Consumer | `9999999999` |
| Admin | `8888888888` |

Other valid 10-digit numbers are assigned a consumer demo profile. The dataset and fixed OTP are for demonstration only.

## Technology

- React and React Router
- Tailwind CSS utilities with the original KisanConnect stylesheet
- JavaScript and Vite
- Browser `localStorage` for client-side demo state

## Deploy to GitHub Pages

The frontend is built and published by [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

1. In repository **Settings → Pages**, set the publishing source to **GitHub Actions**.
2. Push to the `main` branch, or run **Deploy frontend to GitHub Pages** from the Actions tab.

The workflow builds the static frontend with the repository path configured for GitHub Pages. No API URL or database credentials are required for the local-first frontend.

## Optional API service

The repository also contains an Express/Mongoose API under `server/` and a Render Blueprint in [`render.yaml`](render.yaml). This API is separate from the default localStorage prototype and is not required by the GitHub Pages frontend.

To run the API locally with MongoDB, start the included database container, configure `.env` from `.env.example`, and run `npm run dev:api`:

```bash
cp .env.example .env
docker compose up -d mongodb
npm run dev:api
```

The API health endpoint is <http://localhost:5000/api/health>. Keep `.env` and production credentials out of version control.

## Demo scope

The OTP, identity checks, document uploads, payments, price guidance, demand insights, delivery progress, and seeded marketplace activity are simulations. No SMS, payment gateway, government database, or document storage is connected. Do not enter real identity, payment, or personal information. This prototype is not production authentication or verification.

## Project structure

```text
src/                    React application and route renderer
src/legacy/             Original landing-page template
css/                    Original responsive visual system
js/                     Prototype interactions and simulations
data/                    Demo records and English/Hindi translations
server/                 Optional Express API and Mongoose models
.github/workflows/       GitHub Pages deployment workflow
render.yaml              Optional Render API service definition
docker-compose.yml       Local MongoDB service for the optional API
```
