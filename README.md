# KisanConnect

**A farmer-to-consumer marketplace prototype for discovering local produce and buying directly from growers.**

KisanConnect brings together a React frontend and an Express API backed by MongoDB. The demo includes consumer, farmer, and administrator workspaces, sample marketplace data, and English/Hindi interface text.

## Features

- Browse and search produce listings by category and farmer.
- View farmer profiles, favorites, ratings, and reviews.
- Add produce from multiple farmers to a cart and place demo orders.
- Track order status and view simulated payment history.
- Manage listings and orders from a farmer dashboard.
- Review sample farmer-verification applications, reviews, and disputes from an administrator dashboard.
- Switch between English and Hindi.

## Technology

- **Frontend:** React, Vite, React Router
- **API:** Node.js, Express
- **Database:** MongoDB, Mongoose
- **Authentication:** demo OTP flow with signed JWT sessions
- **Deployment:** GitHub Pages frontend workflow and Render API Blueprint

## Run locally

### Requirements

- Node.js 20 or newer and npm
- Docker Compose, or a MongoDB instance

### Setup

```bash
git clone https://github.com/r3con-ng/KisanConnect.git
cd KisanConnect
npm ci
cp .env.example .env
docker compose up -d mongodb
```

Set a private local value for `JWT_SECRET` in `.env`. The default MongoDB URI connects to the local database started by Docker Compose. If you use another MongoDB instance, update `MONGODB_URI` accordingly.

Load the synthetic demo records, then start the API and frontend:

```bash
npm run seed
npm run dev
```

Open the frontend at <http://localhost:5173>. The API listens at <http://localhost:5000>; Vite forwards `/api` requests to it. Check the database connection at <http://localhost:5000/api/health>.

The seed command only populates an empty database. If the database already contains users, it skips seeding.

### Environment variables

| Variable | Purpose | Example |
| --- | --- | --- |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/kisanconnect` |
| `JWT_SECRET` | Secret used to sign API sessions | Set a private random value |
| `PORT` | API port; defaults to `5000` | `5000` |
| `CLIENT_ORIGIN` | Comma-separated browser origins allowed by CORS | `http://localhost:5173` |

Keep `.env` and production credentials out of version control. `.env.example` contains local development defaults only.

## Demo accounts

Use OTP `123456` with the sample mobile numbers below:

| Role | Mobile |
| --- | --- |
| Consumer | `9999999999` |
| Farmer | `9876543210` |
| Administrator | `8888888888` |

The seed data includes additional farmer accounts. Any other valid 10-digit number creates a consumer demo account.

## API

All API routes use the `/api` prefix. The health endpoint reports API and database status:

```http
GET /api/health
```

The API also provides demo login, product and farmer listings, favorites, checkout, order tracking, reviews, farmer verification, and administrator review tools.

## Deployment

### API and database

The root [`render.yaml`](render.yaml) defines a Render web service. Create a MongoDB Atlas cluster and a database user with read/write access to the `kisanconnect` database, then create the Render Blueprint from this repository.

Provide the Atlas connection string as the Render `MONGODB_URI` environment value. Configure the Atlas IP access list with the outbound IP ranges shown for the Render service. Avoid opening database access to all IP addresses. The Blueprint generates `JWT_SECRET` and sets `CLIENT_ORIGIN` for the GitHub Pages site.

After deployment, check `https://<api-host>/api/health`. A healthy response includes `"database":"connected"`.

### Frontend on GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) builds the React frontend and deploys it to GitHub Pages.

1. In repository **Settings → Pages**, set the publishing source to **GitHub Actions**.
2. Under **Settings → Secrets and variables → Actions → Variables**, add `VITE_API_BASE_URL` with the API origin, such as `https://your-api-host`. Use the origin only—do not add a trailing slash or `/api`.
3. Push to `main`, or run **Deploy frontend to GitHub Pages** from the Actions tab.

The build uses the repository path for GitHub Pages and requires `VITE_API_BASE_URL` to be set. The frontend uses hash-based routing so in-app routes work when hosted under a repository path.

## Prototype scope

Authentication uses a fixed demo OTP and does not send SMS. Payments are simulated. Farmer verification stores sample form fields and checklist status; it does not verify identities or store documents. Seeded profiles and marketplace activity are synthetic.

This project is for demonstration and development, not production use. Do not enter real identity, payment, or personal information. A production deployment needs real authentication, payment processing, verification, rate limiting, and operational safeguards.

## Project structure

```text
src/                    React application
server/                 Express API, Mongoose models, and demo seed script
.github/workflows/       GitHub Pages deployment workflow
render.yaml              Render API service definition
docker-compose.yml       Local MongoDB service
```
