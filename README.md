# KisanConnect 🌾

### Connecting farmers directly with consumers through a bilingual digital marketplace

KisanConnect is a farmer-to-consumer marketplace prototype developed for **BGI Hackathon 2026 (BT3P2)**. It explores how a simple digital platform can help farmers showcase their produce, reach consumers, and manage orders through one place.

The project brings together dedicated experiences for farmers, consumers, and administrators, with English and Hindi interface support.

<p align="center">
  <a href="https://r3con-ng.github.io/KisanConnect/"><strong>🌐 Live Demo</strong></a>
  &nbsp; • &nbsp;
  <a href="https://github.com/r3con-ng/KisanConnect"><strong>💻 Source Code</strong></a>
</p>

> **Prototype notice:** KisanConnect is a demonstration project. Authentication, identity checks, payments, delivery updates, and marketplace activity use sample data or simulated flows. It is not connected to Aadhaar, Kisan ID, government databases, SMS services, or live payment gateways.

---

## ✨ What you can explore

### 🛍️ Consumer experience
- Browse produce through a searchable marketplace and category filters.
- Explore farmer profiles and product information.
- Save favourites, add items to the cart, and follow a demo checkout flow.
- Review previous orders and view a sample delivery timeline.

### 👨‍🌾 Farmer dashboard
- Create and manage produce listings.
- View incoming orders and demo earnings.
- Explore price guidance and marketplace indicators.
- Follow a sample farmer onboarding and verification journey.

### 🛡️ Admin dashboard
- Review sample farmer verification submissions.
- Monitor demo orders and marketplace activity.
- Explore dispute handling and review moderation workflows.

### 🌐 Designed for accessibility
- English and Hindi interface toggle.
- Browser text-to-speech guidance.
- Responsive layouts for desktop and mobile screens.

---

## 🧪 Try the demo

Open the [KisanConnect live demo](https://r3con-ng.github.io/KisanConnect/) and choose a role from the sign-in experience.

Use the following demonstration OTP with the seeded mobile numbers:

| Demo role | Mobile number | OTP |
| --- | --- | --- |
| Farmer | `9876543210` | `123456` |
| Consumer | `9999999999` | `123456` |
| Admin | `8888888888` | `123456` |

These are public demo credentials, not secure accounts. Other valid 10-digit numbers may be assigned a consumer demo profile.

---

## 🧰 Built with

| Area | Technologies |
| --- | --- |
| Frontend | React, JavaScript, React Router |
| Styling | Tailwind CSS utilities, custom CSS |
| Build tooling | Vite |
| Demo state | Browser `localStorage` |
| Optional API | Node.js, Express, MongoDB, Mongoose |

The default frontend prototype runs locally without a database. Demo sessions, cart contents, favourites, listings, and other prototype state are stored in the browser's `localStorage`; they are not synchronized between devices.

---

## 🚀 Run locally

### Prerequisites
- Node.js 20 or newer
- npm

### Installation

```bash
git clone https://github.com/r3con-ng/KisanConnect.git
cd KisanConnect
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

To reset the local demo, clear the site's storage for the local development URL in your browser.

---

## ⚙️ Optional API service

An Express and Mongoose API is included separately under `server/`. It is not required for the default frontend demo.

To start the optional API with the included MongoDB container:

```bash
cp .env.example .env
docker compose up -d mongodb
npm run dev:api
```

The API health endpoint is available at [http://localhost:5000/api/health](http://localhost:5000/api/health).

Keep environment files and production credentials private. Do not commit secrets to the repository.

---

## 📦 Project structure

```text
KisanConnect/
├── src/                  # React application and route renderer
├── src/legacy/           # Original landing-page template
├── css/                  # Responsive styles and design system
├── js/                   # Prototype interactions and simulations
├── data/                 # Demo records and language content
├── server/               # Optional Express API and Mongoose models
├── .github/workflows/    # GitHub Pages deployment workflow
├── render.yaml           # Optional Render API service definition
└── docker-compose.yml    # Local MongoDB service
```

---

## 🚢 Deployment

The frontend is configured for GitHub Pages and is built through the workflow in [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

The expected deployment address is:

**https://r3con-ng.github.io/KisanConnect/**

In the repository's **Settings → Pages**, select **GitHub Actions** as the publishing source. Pushes to `main` trigger the deployment workflow; it can also be started manually from the Actions tab.

---

## 🔒 Demo safety and limitations

KisanConnect is intended for learning, demonstration, and prototype evaluation.

- OTP sign-in uses a fixed demonstration code.
- Identity verification and document upload flows are simulated.
- Payments are illustrative and do not transfer money.
- Delivery progress, price guidance, demand insights, and seeded marketplace activity are demo data.
- Browser-stored data remains in the current browser profile.
- Do not enter real Aadhaar details, identity documents, banking information, or other sensitive personal data.

---

## 📄 License

See the repository's license file for usage and distribution terms.

---

<p align="center">
  Built as a hackathon prototype to explore more accessible and direct digital connections between farmers and consumers. 🌱
</p>
