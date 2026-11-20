# KisanConnect

KisanConnect is a MERN marketplace prototype connecting farmers directly with consumers. The current app uses React, Vite, Express, Mongoose, and MongoDB. It is designed for local development and uses synthetic sample data.

## Requirements

- Node.js 18 or newer
- Docker with Compose (recommended) or MongoDB running locally (`mongodb://127.0.0.1:27017/kisanconnect`)

## Run locally

1. Copy `.env.example` to `.env` and update `JWT_SECRET` for your local environment.
2. Start MongoDB with `docker compose up -d mongodb` (or start your local MongoDB service).
3. Install dependencies with `npm install`.
4. Add the sample marketplace data with `npm run seed`.
5. Start the API and Vite frontend with `npm run dev`.
6. Open `http://localhost:5173`.

The API listens on `http://localhost:5000`; Vite proxies `/api` requests to it. The health endpoint is `/api/health`.

## GitHub Pages

GitHub Pages hosts only the static React frontend. The Express API and MongoDB must be deployed separately.

1. Deploy the API and MongoDB to a backend host, then confirm the API is reachable at `https://your-api-host/api/health`.
2. In the GitHub repository, add the repository variable `VITE_API_BASE_URL` with the API origin only, for example `https://your-api-host` (no trailing slash and no `/api`). On the backend host, set `CLIENT_ORIGIN=https://r3con-ng.github.io` to allow the Pages site to call the API.
3. In repository Settings → Pages, set the publishing source to **GitHub Actions**.
4. Push the changes to `main` or run the **Deploy frontend to GitHub Pages** workflow manually.

The Pages build intentionally stops if `VITE_API_BASE_URL` is missing, so the published app cannot silently point its API requests back at the static Pages host. The app uses hash-based routes for Pages refresh and deep-link support.

## Deploy the API

The root `render.yaml` describes the Express API as a Render web service. For this prototype, pair it with a MongoDB Atlas Free cluster. Atlas Free clusters are intended for small development workloads and have reduced features and resources. Render Free web services sleep after 15 minutes without incoming traffic, so the first request after idle can take about a minute.

1. Create an Atlas Free cluster in AWS Singapore if Atlas marks it as Free; otherwise choose an Atlas Free region near your users. The Render service is set to Singapore to keep the app and database close for this India-based prototype.
2. Create a database user with a strong password and a database named `kisanconnect`.
3. Add the Render web service from this repository using the Blueprint (`render.yaml`). It generates `JWT_SECRET` and sets the Pages origin for CORS.
4. In the Render service's Connect → Outbound panel, copy its outbound IP ranges. Add those ranges to the Atlas project's IP access list, then enter the Atlas connection string as Render's `MONGODB_URI`. Avoid `0.0.0.0/0`; Atlas warns that it allows connections from anywhere.
5. Once the service is live, confirm its `/api/health` response reports `"database":"connected"`.
6. Add the Render service origin to GitHub Actions repository variable `VITE_API_BASE_URL`, then enable GitHub Pages with GitHub Actions as the source.
7. To load synthetic sample accounts and produce into Atlas, set your local `.env` `MONGODB_URI` to the Atlas connection string and run `npm run seed` once.

## Demo accounts

Sign in with any listed mobile number and OTP `123456`.

| Role | Mobile |
| --- | --- |
| Farmer | `9876543210` |
| Consumer | `9999999999` |
| Admin | `8888888888` |

Other valid 10-digit numbers become consumer demo accounts.

## Included workflows

- Consumer marketplace search and category filters, farmer profiles, favorites, cart, multi-farmer checkout, order tracking, reviews, and payment history
- Farmer dashboard, produce listings, order status management, earnings, and sample KYC submission
- Admin statistics, farmer verification decisions, order status review, review moderation, and dispute management
- English/Hindi UI toggle and browser voice guidance

## Demo limitations

OTP `123456`, payment outcomes, KYC, document checklists, government price ranges, demand insights, and all seeded user and marketplace data are simulations. No SMS, payment gateway, government database, or document storage is connected. Use only synthetic identity values; never submit real Aadhaar numbers or documents. The “verified” state is an application review state in this prototype, not government verification.

The original standalone HTML pages and scripts are retained as reference material. The active application is the React app under `src/`, with its API and models under `server/`.
