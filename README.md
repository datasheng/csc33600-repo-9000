[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/lbrlp8ht)

# FuelFinder

FuelFinder is a full‑stack platform for finding and tracking gas station prices in real time. It consists of:

- **Web Frontend**: A Next.js (React + Tailwind) application with Google Maps integration.  
- **Backend API**: A FastAPI service powered by PostgreSQL and Firebase for authentication.  
- **(In Progress) Mobile App**: An Expo React Native application, currently paused but runnable with Expo Go.

---

## Table of Contents

- [Features](#features)  
- [Tech Stack](#tech-stack)  
- [Prerequisites](#prerequisites)  
- [Installation](#installation)  
- [Environment Variables](#environment-variables)  
- [Project Structure](#project-structure)  
- [Running the Application](#running-the-application)  
  - [Web Frontend](#web-frontend)  
  - [Backend API](#backend-api)  
  - [Mobile App (Expo)](#mobile-app-expo)

---

## Features

- **User Authentication** via Firebase Auth (email/password).  
- **User Registration** and session management.  
- **Gas Station CRUD**: create, list, and view stations with location data.  
- **Price Tracking**: submit and query latest fuel prices per station.  
- **Interactive Map**: visualize station locations and prices on Google Maps.  
- **RESTful API** for seamless frontend/backend integration.  
- **Mobile Prototype**: Expo-based app for on‑the‑go price checks (development paused).  

## Tech Stack

- **Frontend (Web)**: Next.js, React, Tailwind CSS, Firebase JS SDK, Google Maps API  
- **Backend API**: FastAPI, Uvicorn, PostgreSQL, Firebase Admin SDK, python‑dotenv  
- **Mobile**: Expo (React Native)  
- **Infrastructure**: SQL scripts for schema setup, Dockerfile for containerization  

## Prerequisites

- **Node.js** (v16 or later) and **npm** or **yarn**  
- **Python** (v3.10 or later) and **pip**  
- **PostgreSQL** instance (local or hosted)  
- **Firebase** project with:  
  - Web API keys (for frontend)  
  - Service account JSON (for backend)  
- **Expo CLI** (for mobile)  

## Installation

1. **Clone the repo**  
   ```bash
   git clone <REPO_URL>
   cd csc33600-repo-9000/fuelFinder
   ```

2. **Setup environment variables**  
   - See [Environment Variables](#environment-variables).

3. **Install dependencies**  
   - **Web**: `cd web && npm install`  
   - **Backend**: `cd ../backend && pip install -r requirements.txt`  
   - **Mobile** (optional): `cd ../mobile && npm install`  

---

## Environment Variables

### Web (`web/.env`)
```env
# Firebase (Web)
NEXT_PUBLIC_FIREBASE_API_KEY=…
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=…
NEXT_PUBLIC_FIREBASE_PROJECT_ID=…
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=…
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…
NEXT_PUBLIC_FIREBASE_APP_ID=…

# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=…
```

### Backend (`backend/.env`)
```env
POSTGRES_USER=…
POSTGRES_PASSWORD=…
POSTGRES_HOST=…
POSTGRES_PORT=…
POSTGRES_DB=…
```

Place your Firebase service account JSON at:
```
backend/app/credentials/firebase-service-account.json
```

---

## Project Structure

```
fuelFinder/
├── backend/          # FastAPI backend service
│   ├── app/
│   │   ├── routes/   # Auth & station routes
│   │   ├── db/       # DB connection & SQL scripts
│   │   └── main.py   # FastAPI app entrypoint
│   ├── init_db.py    # Run to create tables
│   └── requirements.txt
├── web/              # Next.js frontend
│   ├── src/          # React components & pages
│   ├── lib/firebase.ts
│   └── package.json
└── mobile/           # Expo React Native app (prototype)
    └── package.json
```

---

## Running the Application

### Web Frontend
```bash
cd web
npm run dev
# Visit http://localhost:3000
```

### Backend API
```bash
cd backend
# Initialize database schema
python init_db.py
# (optional) test connection
python test_db_connection.py
# Start server
uvicorn app.main:app --reload
# API docs: http://localhost:8000/docs
```

### Mobile App (Expo)
```bash
cd mobile
npx expo start
# Open in Expo Go on your device or emulator
```