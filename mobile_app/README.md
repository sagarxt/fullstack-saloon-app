# Groomish Luxury Mobile App

<div align="center">

<img src="https://res.cloudinary.com/dfdnljcyt/image/upload/v1792095435/groomish_logo_2_sby1pb.png" alt="Groomish Luxury Mobile App" width="220" style="border-radius: 12px; margin-bottom: 12px;" />

### Native iOS & Android Customer Experience for Groomish Now

[![Expo SDK 57](https://img.shields.io/badge/Expo_SDK-57-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![React Native 0.86](https://img.shields.io/badge/React_Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript 5.9](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Expo Router 4](https://img.shields.io/badge/Expo_Router-4-black?style=for-the-badge)](https://docs.expo.dev/router/introduction/)

</div>

---

## Overview

The **Groomish Luxury Mobile App** is a high-performance cross-platform mobile client engineered with **Expo SDK 57**, **React Native**, and **TypeScript**. Built exclusively for salon customers, it provides a seamless luxury self-service journey: browsing certified salon branches, booking hair styling and spa rituals, purchasing authentic beauty retail, tracking VIP tier progression, redeeming GroomCoins, and managing active reservations.

---

## Key Features

### 1. Dynamic Brand Showcase
- Brands on the home screen are fetched directly from the backend (`/public/brands`), displaying brand logos, verified counts, and names.
- Certified Brand profiles include verified authenticity seals and brand descriptions.

### 2. High-End Visual Design & Precise Aspect Ratios
- **Salon Services**: Rendered in **4:3 landscape** (`aspectRatio: 4 / 3`, cover) across Home, Services catalog, and Service details hero.
- **Retail Products**: Rendered in **3:4 aspect ratio** (`aspectRatio: 3 / 4`, cover/contain) across Home, Shop, and Product details.
- Curated luxury palette (`#373A43` Charcoal Slate, `#FA7B47` Groomish Orange, `#FED652` Amber Gold, `#FAF6ED` Cream Canvas) with full Light & Dark mode support.

### 3. Slidable Multi-Image Product Details
- **Image Carousel**: Horizontal paging `FlatList` with dot indicators and `1/N` counter badge for multi-image product presentations in 3:4 ratio.
- **Verified Brand Seal**: Displays brand logo, name, description, and "Verified Product • 100% Genuine Guarantee" badge.
- **Suggested Companion Products**: Interactive companion products section with quick-add actions.

### 4. Authoritative Booking Management & Payment Breakdown
- **Unified Booking Terminology**: Standardized on "Booking" / "Bookings" throughout the application (replacing legacy "Appointment" wording).
- **12-Hour AM/PM Time Format**: All timestamps and 30-minute reservation slots strictly use 12-hour AM/PM format (e.g. `26 Oct 2026, 04:40 PM` and `11:30 AM`).
- **Payable Amount Breakdown**:
  - Total Bill Amount
  - Already Paid Online deduction (`-₹pricePaid`)
  - Remaining Balance to Pay (`₹remainingAmount`)
  - Outstanding Balance Notice callout with instant **"Switch to Pay at Salon Counter"** action.
- Real-time reschedule modal and cancel booking actions.

### 5. Dynamic Salon Policies & Q&A
- Backed directly by backend `/api/v1/public/policy-faq` with real-time refresh.
- Dual-tab switcher: **Salon Policies** and **Questions & Answers**.
- Live search bar and category filter pills (`ORDER`, `BOOKINGS`, `PAYMENT`, `CANCELLATION`, `REFUND`, `SAFETY`).
- Expandable accordion FAQ cards with smooth animations.
- Accessible from both the Home footer and Profile menu.

### 6. Customer-First Security & Portal Access Alert
- The mobile app is strictly reserved for customer accounts.
- If a staff member or administrator attempts to sign in:
  - Session is not persisted.
  - A custom luxury portal alert modal is displayed:
    > *"Please visit website to access dashboard. Application is made for Customers only."*
  - Provides two options: **Login with Customer** (clears inputs and stays on login) and **Home Page** (navigates to Home).

---

## Project Structure & Navigation

The app uses **Expo Router** file-based routing:

```
mobile_app/
├── api/
│   └── client.ts             # Axios instance, JWT interceptor, 401 handling, API endpoints
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx       # Auth stack navigator
│   │   ├── login.tsx         # Customer sign-in with Staff/Admin restriction alert
│   │   ├── register.tsx      # Customer registration with referral support
│   │   └── forgot-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx       # Bottom tab bar with active badge indicators
│   │   ├── home.tsx          # Dynamic brands, 4:3 services, 3:4 products, footer links
│   │   ├── services.tsx      # Branch-aware treatments catalog (4:3 aspect ratio)
│   │   ├── shop.tsx          # Retail products catalog (3:4 aspect ratio)
│   │   ├── bookings.tsx      # Upcoming, completed & cancelled booking history
│   │   ├── cart.tsx          # Bag, 30-min slot picker, coupons, Razorpay gateway
│   │   ├── rewards.tsx       # VIP tier status, GroomCoins ledger, voucher redemption
│   │   ├── profile.tsx       # Profile management, theme toggle, policy links
│   │   ├── policy.tsx        # Dynamic Policies & FAQs with live search
│   │   └── notifications.tsx # Real-time booking and reward alerts (12-hour format)
│   ├── booking/[id].tsx      # Booking details, payment breakdown, reschedule modal
│   ├── product/[id].tsx      # Multi-image carousel (3:4), verified brand card, suggestions
│   ├── service/[id].tsx      # Service details (4:3 hero), branch selector, add to bag
│   ├── policy.tsx            # Root redirect wrapper to /(tabs)/policy
│   └── _layout.tsx           # Root provider stack (Theme, Auth, Branch, Cart)
├── components/
│   ├── TopHeader.tsx         # Unified header with branch switcher & search
│   ├── RazorpayCheckoutModal.tsx # In-app WebView Razorpay payment gateway
│   └── OfflineNotice.tsx
├── context/
│   ├── AuthContext.tsx       # Authentication state & role guard
│   ├── BranchContext.tsx     # Active salon branch selection
│   ├── CartContext.tsx       # Persistent shopping cart state
│   └── ThemeContext.tsx      # Dark / Light theme tokens
├── theme/
│   └── colors.ts             # Color palette, shadows, spacing, radius
└── utils/
    ├── brandHelper.ts        # Brand logos, descriptions, verified badge helper
    └── dateHelper.ts         # 12-hour formatters (format12HourDateTime, formatSlot12Hour)
```

---

## Getting Started

### 1. Prerequisites
- **Node.js 18+** and npm
- **Expo Go App** on your iOS or Android mobile device, or Xcode / Android Studio simulators

### 2. Install Dependencies
```bash
cd mobile_app
npm install
```

### 3. Environment Configuration
Create a `.env` file in `mobile_app/` (or rely on default backend URL):
```env
# Optional: point to local backend or tunnel URL
EXPO_PUBLIC_API_URL=https://groomish-now-backend.onrender.com/api/v1
```

### 4. Run Development Server
```bash
# Start with tunnel for physical device testing with Expo Go
npx expo start --tunnel

# Or start standard metro bundler
npm start
```

### 5. Type Check Verification
Ensure zero TypeScript compilation errors:
```bash
npx tsc --noEmit
```

---

<div align="center">
  <sub>Engineered for <strong>Groomish Now</strong>. Luxury Grooming at Your Fingertips.</sub>
</div>
