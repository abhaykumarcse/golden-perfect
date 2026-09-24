# ✈️ Golden Perfect

> **A premium India travel planner for discovering destinations, planning journeys, saving memories, managing bookings, and organizing private travel notes.**
>
> 🌐 **Live App:** https://golden-perfect-36uq3l.v2.appdeploy.ai/

<p align="center">
  <a href="https://golden-perfect-36uq3l.v2.appdeploy.ai/"><strong>🌐 Open Live App</strong></a>
</p>

<p align="center">
  <a href="https://golden-perfect-36uq3l.v2.appdeploy.ai/">Live App</a> ·
  <a href="https://github.com/abhaykumarcse/golden-perfect">Source Code</a>
</p>

---

## 🌐 Live Demo

**Golden Perfect:** https://golden-perfect-36uq3l.v2.appdeploy.ai/

The live application is deployed through AppDeploy.

---

## ✨ What is Golden Perfect?

Golden Perfect is a travel-focused web application designed around a simple goal: make discovering and organizing travel easier from one place.

It combines destination discovery, trip planning, saved places, rich travel notes, travel assistance, and booking workflows in a single experience.

### Highlights

- 🇮🇳 Explore destinations across Indian states and union territories
- 🔎 Search destinations and filter them by travel category
- 🗺️ Plan journeys with origin, destination, date, and traveller details
- 💰 Distance-based travel quotation with GST calculation
- ❤️ Save favourite places
- 📝 Rich **My Travel Notes** for memories and trip details
- 📷 Save travel photos
- 📍 Tag locations
- ☑️ Create travel checklists
- 💵 Track trip expenses
- 🔗 Link activities to travel notes
- 👤 Account-based saved data, trips, and bookings
- 🧾 Generate booking receipts as PDF
- 🔐 Admin booking-management workflow
- 🌙 Premium dark/midnight visual experience
- 📱 Responsive, mobile-friendly interface
- 📡 Offline-aware account caching and online-status handling

---

## 🧭 Core Experience

```text
Discover
   ↓
Explore Indian Destinations
   ↓
Choose Place
   ↓
Plan Your Journey
   ↓
Get Travel Quote
   ↓
Complete Booking
   ↓
Manage Trips + Memories
```

Golden Perfect is designed around keeping the important travel actions close together instead of forcing users through a complicated flow.

---

## 📝 My Travel Notes

A dedicated private notes experience helps travellers keep useful information together with their trip.

Supported note types include:

- ✍️ Text notes
- 📷 Photos
- 📍 Tagged locations
- ☑️ Checklists
- 💵 Expenses
- 🔗 Activities

Notes can be grouped by a **Place / Memory Name**, making it easier to keep memories and practical trip information organized.

---

## 🗺️ Travel & Booking

The application includes a travel quotation workflow with:

- Starting location
- Destination
- Travel date
- Number of travellers
- Road-distance estimation
- Base fare
- Distance/traveller based pricing
- GST calculation
- Booking reference/payment reference workflow
- PDF booking receipt generation

The application also includes an admin-side booking workflow for managing submitted bookings.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Build Tool | Vite 6 |
| UI Icons | Lucide React |
| Styling | CSS / Tailwind CSS tooling |
| Authentication & App API | AppDeploy Client |
| Local Storage | LocalStorage + IndexedDB |
| Geocoding | OpenStreetMap Nominatim |
| Road Routing | OSRM |
| Deployment | AppDeploy |

---

## 📁 Project Structure

```text
golden-perfect/
├── src/
│   ├── components/
│   │   └── RichNotesPanel.tsx
│   ├── App.tsx
│   ├── travelData.ts
│   ├── videoData.ts
│   └── ...
├── public/
│   └── resources/
├── package.json
├── vite.config.*
├── tsconfig.*
└── README.md
```

> The repository contains the application source used by the deployed Golden Perfect project.

---

## 🚀 Run Locally

### 1. Clone

```bash
git clone https://github.com/abhaykumarcse/golden-perfect.git
cd golden-perfect
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start development server

```bash
npm run dev
```

### 4. Create production build

```bash
npm run build
```

### 5. Preview production build

```bash
npm run preview
```

---

## 🔐 Application Architecture

Golden Perfect separates the main user experience into focused areas:

- **Welcome / Home** — entry point and discovery
- **State Explorer** — browse destinations by state/UT
- **Place Details** — destination information and travel actions
- **Trip Planner** — journey inputs and quotation
- **Profile** — account, saved places, trips and bookings
- **My Travel Notes** — private travel memory workspace
- **Admin** — booking management for authorized administrators

The frontend also uses resilient network handling and local account caching to keep previously loaded account data available when connectivity is unavailable.

---

## 🎯 Design Goals

Golden Perfect is being built with these principles in mind:

1. **Simple** — important actions should be easy to find.
2. **Premium** — modern visual design without unnecessary complexity.
3. **Useful** — solve real travel-planning and memory-keeping problems.
4. **Mobile-first** — comfortable to use on a phone as well as larger screens.
5. **Connected** — discovery, planning, notes and bookings should work as one journey.
6. **Practical** — travel information should lead naturally to an actionable next step.

---

## 📌 Project Status

**Active development** 🚧

Golden Perfect is an evolving travel platform. Features, destination data, UI, integrations, and booking capabilities may continue to improve over time.

---

## 👨‍💻 Author

**Abhay Kumar**

- GitHub: https://github.com/abhaykumarcse
- Project: https://github.com/abhaykumarcse/golden-perfect
- Live App: https://golden-perfect-36uq3l.v2.appdeploy.ai/

---

## 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">
  <strong>Golden Perfect ✈️</strong><br />
  <sub>Discover • Plan • Travel • Remember</sub>
</p>
