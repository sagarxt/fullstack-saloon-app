# Groomish Now — Frontend Web Application

<div align="center">

<img src="https://res.cloudinary.com/dfdnljcyt/image/upload/v1792095435/groomish_logo_2_sby1pb.png" alt="Groomish Now Web" width="240" style="border-radius: 12px; margin-bottom: 12px;" />

### Premium Web Portal for Customers, Stylist Staff & Salon Administrators

[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite 7](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS 3.4](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![React Router 7](https://img.shields.io/badge/React_Router-7-CA4245?style=for-the-badge&logo=react-router&logoColor=white)](https://reactrouter.com/)

</div>

---

## Overview

The **Groomish Now Frontend Web Application** is a high-performance web client serving three distinct user experiences from a unified, role-based single-page application:
1. **Customer Web Portal**: Branch-aware salon appointment discovery, multi-variant sub-service selection, e-commerce retail purchasing (with in-store pickup), Razorpay online payments, and VIP GroomCoin rewards.
2. **Staff Stylist Station**: Stylist seat queue management, client check-in, real-time service customization, and invoice completion.
3. **Super Admin Control Center**: Multi-branch management, dynamic tier points range editor, certified brands manager, staff roster, revenue analytics, and policy & FAQ content manager.

---

## Core Features & Architecture

### 1. Booking Lifecycle & Station Flow
- **Strict Linear Flow**: `CONFIRMED` &rarr; `CLIENT_CHECKIN` &rarr; `COMPLETED & BILLED`.
- **Contextual Actions**:
  - When booking is `CONFIRMED`: Staff and Admin are presented only with the **"Client Check-in"** action.
  - Once checked in: The **"Complete & Bill"** action becomes available.
- **Sub-Service Option Selection**: When a service has multiple options/sub-services, customers, staff, and admin can view all available sub-services and choose any option.
- **Today's Bookings Priority**: Staff and Admin dashboards surface today's bookings at the very top, sorted chronologically by reservation time.
- **Clean Invoicing & Details View**:
  - Services list: displays service image, name, and details cleanly (without cluttering `#1`, `#2` indices).
  - Retail products: price and MRP displayed cleanly on the right, eliminating duplicate price tags near `Qty:`.
  - Financial breakdown: clearly differentiates **Total Bill**, **Already Paid Online (-₹pricePaid)**, and **Remaining Balance to Pay (₹remainingAmount)** with counter-payment options.
  - Standardized local 12-hour AM/PM formatting (e.g. `26 Oct 2026, 04:40 PM`).

### 2. Retail Product Showcase (3:4 Aspect Ratio)
- Product cards across both the **Home Landing Page** (`ProductsSection.jsx`) and the **Products Shop** (`ProductsPage.jsx`) adhere to the standard **3:4 aspect ratio** (`aspect-[3/4]`, `object-contain` on clean white background).
- Features interactive verified brand chips, in-store pickup badges, discount percentage chips, and dynamic cart state buttons.

### 3. Dynamic Tier Point Range Management
- Admin can configure the required point range for each VIP loyalty tier (`SILVER`, `GOLD`, `PLATINUM`, `DIAMOND`) from the Admin Rewards portal.
- Members who have already attained a tier retain their status label while requiring the admin-defined points to unlock subsequent tiers.

### 4. Salon Policies & Q&A Management
- Public `/policy` and `/qa` pages with interactive tabs, category pills, and real-time search.
- Administrative CRUD suite at `/admin/policies-qa` allowing instant publication and status toggling for policies and FAQs.

---

## Project Structure

```
frontend_web/
├── src/
│   ├── api/                  # Axios HTTP client & domain API modules
│   │   ├── admin.js          # Admin catalog, stores, users, tiers & bookings
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── customer.js       # Customer bookings, cart & loyalty
│   │   ├── policyFaq.js      # Public & admin policies and FAQs
│   │   ├── staff.js          # Staff queues & booking actions
│   │   └── store.js          # Salon branch management
│   ├── auth/                 # AuthContext & ProtectedRoute guards
│   ├── components/
│   │   ├── admin/            # Admin stats, booking cards & navigation
│   │   ├── common/           # GroomCoinIcon, Modal, Cloudinary uploader
│   │   ├── landing/          # Hero, Branches, Services, Products (3:4), FAQ
│   │   ├── modals/           # Booking details, brands manager, branch modal
│   │   └── staff/            # Staff station queue cards & check-in modals
│   ├── context/              # StoreContext, CartContext, GroomCoinContext
│   ├── pages/
│   │   ├── admin/            # Dashboard, Bookings, Services, Products, Customers, Staffs, Policies
│   │   ├── customer/         # Bookings history, Booking detail, Cart, Checkout, Rewards
│   │   ├── landing/          # Public home landing page
│   │   ├── public/           # Services catalog, Service detail (4:3), Products (3:4), Policy, QA
│   │   └── staff/            # Staff dashboard & booking check-in station
│   ├── utils/                # Date formatting, image scaling, data helpers
│   ├── App.jsx               # Application route definitions
│   └── main.jsx              # App entry point
├── index.html
├── tailwind.config.js        # Official Groomish design tokens & color palette
└── vite.config.js            # Vite configuration
```

---

## Getting Started

### 1. Prerequisites
- **Node.js 18+** and npm

### 2. Install Dependencies
```bash
cd frontend_web
npm install
```

### 3. Development Server
```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

### 4. Production Build
```bash
npm run build
```
Build output is generated into the `dist/` directory.

---

<div align="center">
  <sub>Part of the <strong>Groomish Now</strong> Ecosystem.</sub>
</div>