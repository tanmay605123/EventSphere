# 🎟️ EventSphere — Modern Event Discovery & Registration Platform

A complete, responsive web application where users discover all upcoming events in one unified place and register for them instantly with real-time seat tracking and digital QR code passes.

---

## ✨ Features & Pages Overview

### 1. 🔐 Login / Sign-up Page
- **Clean Split State**: Toggle between **Login** and **Sign Up** using an animated toggle pill.
- **Fields**: Full Name (sign-up), Email address, Password with show/hide toggle icon, and optional Phone number.
- **Validation**: Inline error feedback for email format, password minimum length (6+ chars), and required fields.
- **Forgot Password**: Interactive modal with instant reset link simulation.
- **Redirect**: Smooth post-authentication transition to the Home page or the previous destination.

### 2. 🏠 Home Page
- **Consistent Top Bar**: Circular branded logo (left), application name **EventSphere** (center), interactive profile avatar (right).
- **Search Bar**: Real-time debounced keyword search across event titles, venues, and descriptions.
- **Filter Chips**:
  - **Category Chips**: *All*, *Tech*, *Cultural*, *Sports*, *Workshops*.
  - **Day Dropdown**: *All Days*, *Today*, *Tomorrow*, *Weekend*, *Weekdays*.
  - **Date Picker**: Exact date filtering.
  - **Time Filter**: *All Times*, *Morning* (<12 PM), *Afternoon* (12–5 PM), *Evening* (5 PM+).
  - **Reset Filters**: One-click filter clear button.
- **Responsive Grid**:
  - 📱 Mobile: 1 column
  - 📱 Tablet: 2 columns
  - 💻 Desktop: 3 columns
- **Event Cards**: High-res banner image, category tag, price tag (*Free* or *$XX*), formatted date & time, venue with map pin, live seats left pill, and "View Details" button with hover arrow animation.
- **Loading Skeletons**: Polished shimmer skeletons while data loads.
- **Empty State**: Friendly illustration and prompt when no events match the search query.
- **Pagination**: Numbered pagination controls.

### 3. 📄 Event Details Page
- **Navigation**: Back button (`← Back to Events`) and consistent Top Bar.
- **Two-Column Layout**:
  - **Left**: Large event hero picture with zoom hover effect and verified organizer information card.
  - **Right**: Title, category tag, price badge, logistics grid (Date, Time, Venue), detailed description, and live capacity progress bar.
- **Smart CTA Button**:
  - Available: Prominent **Accent Orange CTA** (`Register Now`).
  - Already Registered: Disabled emerald button with checkmark (`✓ Registered`) and button to view the QR pass.
  - Sold Out: Disabled gray button (`Event Full`).
  - Clicking Register atomically reserves the seat and transitions to the Confirmation page.

### 4. 🎉 Registration Confirmation Page
- **Visual Feedback**: Large green circle with animated checkmark and celebratory confetti animation (`canvas-confetti`).
- **Summary Card**:
  - Event title, category, and banner thumbnail.
  - Date, time, and venue details.
  - Unique Registration ID (e.g. `REG-2026-XXXXX`).
  - Scannable QR code generated using `qrcode.react`.
  - Attendee full name and email.
- **Actions**:
  - `View My Events` (navigates to Profile page).
  - `Back to Home` (navigates to Home feed).
  - `Print or Save Pass as PDF`.

### 5. 👤 Profile Page
- **Header**: Large user avatar, member name, email, phone, and verified badge.
- **2x2 Grid (Responsive, stacked on mobile)**:
  - **A. Events Registered**: Tabbed view of *Upcoming* and *Past* events. Displays event title, date, venue, status badge, "Ticket" button (opens QR pass popup), and "Cancel" button (with confirmation modal that releases the seat back to the event!).
  - **B. Personal Info**: View and edit Name and Phone with instant persistence and toast feedback.
  - **C. Password**: Secure change password form with validation (current password, new password, confirm password).
  - **D. About**: App mission, version (`v1.0.0`), tech stack overview, terms summary, and prominent **Logout** button.

---

## 🎨 Design System

| Element | Specification |
| :--- | :--- |
| **Theme** | Clean, modern, friendly, light theme |
| **Primary Color** | Indigo (`#4F46E5`, Tailwind `indigo-600`) |
| **Accent CTA** | Vibrant Orange (`#F97316` / `#EA580C`) |
| **Success Color**| Emerald Green (`#10B981` / `#059669`) |
| **Background** | Soft light-gray (`#F8FAFC`) |
| **Cards** | Pure white (`#FFFFFF`) with 16px rounded corners (`rounded-2xl`) |
| **Typography** | **Poppins** via Google Fonts with clear heading/body hierarchy |
| **Top Bar** | Round logo (left), EventSphere (center), Profile avatar (right) |

---

## 🛠️ Tech Stack & Architecture

- **Frontend**:
  - React 18
  - Tailwind CSS 3
  - Lucide React (feather-style icons)
  - React Router DOM v6
  - QRCode.react (scannable SVG QR codes)
  - Canvas Confetti (celebratory animation)
  - Vite 6
- **Backend**:
  - Node.js & Express
  - JWT (JSON Web Tokens) for secure session authentication
  - bcryptjs for password hashing
  - Dual Database Engine: Mongoose (when MongoDB is running) with automatic zero-config persistent local JSON fallback (`server/data/db.json`). Runs out of the box on any machine!

---

## 🗄️ Database Models

### 1. `User`
```json
{
  "_id": "6720f4c3a2...",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "$2a$10$hashedPassword...",
  "phone": "+1 555-0199",
  "createdAt": "2026-10-29T10:00:00.000Z"
}
```

### 2. `Event`
```json
{
  "_id": "6720f4c3a1...",
  "title": "Global AI & Web3 Hackathon 2026",
  "description": "Join 500+ developers, designers, and innovators...",
  "image": "https://images.unsplash.com/...",
  "category": "Tech",
  "date": "2026-11-15",
  "time": "09:00 AM",
  "venue": "Metropolis Tech Park, Hall 4, San Francisco, CA",
  "organizer": "DevSphere Innovation Labs",
  "totalSeats": 250,
  "seatsLeft": 42,
  "price": 0,
  "createdAt": "2026-10-29T10:00:00.000Z"
}
```

### 3. `Registration`
```json
{
  "_id": "6720f4c3b5...",
  "userId": "6720f4c3a2...",
  "eventId": "6720f4c3a1...",
  "registrationId": "REG-2026-8B2F9",
  "status": "registered",
  "createdAt": "2026-10-29T10:15:00.000Z"
}
```

---

## 📡 API Endpoints Reference

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/signup` | Public | Register new user account |
| `POST` | `/api/login` | Public | Authenticate and issue JWT token |
| `GET` | `/api/events` | Public | Query events with filters (`search`, `category`, `day`, `date`, `time`) |
| `GET` | `/api/events/:id` | Public / Auth | Get event details and current user's registration status |
| `POST` | `/api/events/:id/register` | Protected | Register for event (decrements seats, prevents duplicates) |
| `DELETE` | `/api/registrations/:id` | Protected | Cancel registration and releases seat back to event |
| `GET` | `/api/profile` | Protected | Retrieve authenticated user profile |
| `PUT` | `/api/profile` | Protected | Update name and phone |
| `PUT` | `/api/profile/password` | Protected | Change account password |
| `GET` | `/api/profile/registrations` | Protected | Retrieve all registrations with populated event objects |

---

## 🚀 Getting Started (How to Run Locally)

### Prerequisites
- Node.js (v18 or newer recommended, verified on v24)
- npm (v9 or newer)

### 1. Clone & Enter Directory
```bash
cd /Users/tanmaychawda/eventsphere
```

### 2. Install Dependencies
You can install dependencies for both frontend and backend in one command:
```bash
npm run install:all
```
*(Or run `npm install` inside `server/` and `npm install` inside `client/`)*

### 3. Start Development Servers
From the root directory:
```bash
npm run dev
```
This concurrently starts:
- **Backend API**: `http://localhost:5001`
- **Frontend App**: `http://localhost:5173`

Alternatively, you can run them in two separate terminal windows:
- **Terminal 1 (Backend)**:
  ```bash
  cd server && npm run dev
  ```
- **Terminal 2 (Frontend)**:
  ```bash
  cd client && npm run dev
  ```

### 4. Open in Browser
Navigate to **`http://localhost:5173`** in your browser.

- You can sign up with any email, or click **"Fill demo credentials"** on the Login screen (`demo@eventsphere.com` / `password123`) to test immediately.
- The 8 sample events are automatically seeded into the database on first startup!
- To re-seed manually:
  ```bash
  npm run seed
  ```

---

## 🧪 Testing the API
To execute the automated end-to-end API test suite:
```bash
cd server && node test-endpoints.js
```
All 11 verification checkpoints will test registration, seat decrements, duplicate protection, cancellations, profile updates, and password changes!
