# Salon Booking & Loyalty Program - Project Progress Tracker

> **Last Updated:** October 11, 2026  
> **Status:** Backend & Frontend Web (Groomish Now) 100% Completed, Verified & Production Ready. Advancing to Multi-Store Geolocation Architecture & Advanced Notification Services.

---

## 📊 High-Level Status Overview

| Subsystem | Tech Stack | Completion | Status Summary |
| :--- | :--- | :---: | :--- |
| **Backend** | Spring Boot 3.5, Java 21, PostgreSQL, JPA, JWT, JavaMail | **100%** | **Completed, Tested & Live Running.** Real-time Gmail SMTP asynchronous mailing, complete Service Review system (Repo/Service/Controllers), payment checkout & point accruals, in-app notifications, `@Builder.Default` fixes, and request context fixes verified with live test user. |
| **Frontend Web** | React 19, Vite 7, Tailwind CSS 3, Lucide Icons | **100%** | **Completed & Fully Production-Ready.** Overhauled with official Groomish Now brand palette, smooth keyframe animations, glassmorphism navbar, logo & wordmark assets, multi-step booking checkout flow, VIP loyalty tier & referral system, reviews modal, complete admin portal (Dashboard, Bookings, Categories, Services, Customers, Staffs, Coupons, Payments, Reviews), compact one-pager forms (`AddServiceModal`, `EditServiceModal`), custom rounded dropdowns (`CustomSelect`), central Axios 401 session expiration handling with automatic login redirect, global branded toast popup notifications, and protected routes. Production build passes cleanly with 0 errors (`vite build` ✓). |
| **Mobile App** | React Native (Expo SDK 54), TypeScript, NativeWind | **~15%** | Skeleton only: splash, login, register screens. Contains runtime bugs (missing logo asset, `/api/` instead of `/api/v1/`), no token persistence, and lacks customer browsing/booking/rewards screens. Next phase. |

---

## 1. Backend (`/backend`)

### ✅ Implemented & Stabilized (100%)
- **Build & Quality**:
  - Compiles cleanly with Maven (`BUILD SUCCESS` on Java 21, 198 source files compiled).
  - Cleaned up deprecated `Specification.where(null)` in `ServiceAdminServiceImpl` to modern `Specification.allOf()`.
  - Removed empty dummy skeleton class `CustomerServiceBookingController.java`.
  - Fixed Lombok `@Builder.Default` on all entities (`User`, `Category`, `ServiceEntity`, `Coupon`, `Banner`, `Referral`, `Reward`, `Notification`) so default fields (like `active = true`, `points = 0`, `seen = false`) are never erased by builders.
- **Authentication & Security Context**:
  - Fixed `JwtAuthFilter` to set `request.setAttribute("userId", ...)` and `request.setAttribute("userEmail", ...)`. This resolved critical runtime NPEs across all customer and staff endpoints.
  - Safe referral code generation handling names of any length without `StringIndexOutOfBoundsException`.
- **Real-Time Gmail Mail Service**:
- **Real-Time Gmail Mail Service & Official Tax Invoicing**:
  - Enabled `@EnableAsync` in `BackendApplication` for non-blocking asynchronous email delivery.
  - Corrected classpath template loading in `EmailTemplateServiceImpl` and `OtpServiceImpl` to use `ClassPathResource.getInputStream()` with fallback containers.
  - Overhauled email HTML templates (`email-template.html`, `send-otp.html`) with **Groomish Now** branding, luxury logo banner, and color palette (`#FC6957`, `#373A43`, `#FAF6ED`, `#FED652`).
  - Implemented real-time transactional emails via configured Gmail SMTP:
    - **OTP Email**: Formatted verification code delivery with Groomish Now branding.
    - **Welcome Email**: Sent automatically upon customer registration with account details and unique referral code.
    - **Booking Confirmation Email**: Detailed appointment breakdown (Booking ID, service name, scheduled time, price paid).
    - **Booking Status Email**: Triggered immediately on reschedule or cancellation.
    - **Reward Redemption Email**: Details reward item, points spent, and remaining loyalty balance.
    - **Security Alert Email**: Alert sent immediately when user changes their account password.
    - **Official Tax Invoice & Payment Bill Email (`sendPaymentBillEmail`)**: Dispatched automatically upon appointment completion. Generates an itemized breakdown of salon services, attached store retail products, GST, discount, total paid, payment method, and Groomish loyalty points earned.
- **Retail Store Products & In-Store Billing System**:
  - Entities: `Product.java` (name, brand, category, price, mrp, volume/size, stock, image, inStorePickupOnly) and `BookingProduct.java` (linking store products to bookings with snapshots).
  - Repositories: `ProductRepository.java` and `BookingProductRepository.java`.
  - Database Seeding: `AdminInitializer.java` automatically seeds 8 professional salon retail products (Argan hair serum, hyaluronic cleanser, keratin mask, cedarwood beard oil, matte clay wax, sea salt spray, charcoal scrub, aftershave balm).
  - Service: `ProductService` & `ProductServiceImpl` handling public browsing, admin catalog CRUD, staff product attachments, and complete-and-bill pipeline.
  - Controllers:
    - Public: `PublicProductController` (`/api/v1/public/products`, `/category/{category}`, `/search`, `/categories`).
    - Staff: `StaffProductController` (`/api/v1/staff/products`, `/booking/{id}/add`, `/booking/{id}/complete-and-bill`).
    - Admin: `AdminProductController` (`/api/v1/admin/products`, add/remove, complete-and-bill).
- **Complete Service Review & Rating System**:
  - Entity: `ServiceReview.java`
  - Repository: `ServiceReviewRepository.java` (with paginated queries and native average rating aggregation).
  - DTOs: `ServiceReviewRequest`, `ServiceReviewResponse`, `ServiceRatingSummaryResponse`.
  - Service: `ServiceReviewService` & `ServiceReviewServiceImpl`.
  - Controllers:
    - Customer: `CustomerReviewController` (`/api/v1/customer/reviews` - POST create, GET my reviews, DELETE my review).
    - Public: `PublicReviewController` (`/api/v1/public/reviews` - GET reviews for service, GET rating summary).
    - Admin: `AdminReviewController` (`/api/v1/admin/reviews` - GET all reviews, DELETE review).
- **Cloudinary Image Storage & Structured Folder Management**:
  - Implemented direct and endpoint-driven Cloudinary image uploads across the official folder taxonomy:
    - `groomishnow/category`: Category cover photography.
    - `groomishnow/service`: Salon treatment and service photos.
    - `groomishnow/product`: Retail store beauty product images.
    - `groomishnow/templates`: Email assets, branding graphics, and promotional banners.
  - Endpoints: `POST /api/v1/admin/upload` supporting `MultipartFile` and remote URL / data URI string uploads with custom folder target and secure HTTPS URL generation.
  - Trimmed property values in `CloudinaryConfig.java` to prevent whitespace authentication failures.
  - Reusable frontend component `CloudinaryImageUploader.jsx` featuring drag-and-drop, real-time Cloudinary upload progress indicator, thumbnail preview, folder tagging, and URL fallback.
  - **Admin Panel Alignment Overhaul**:
    - Completely restructured and styled [`AddCategoryModal.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/modals/AddCategoryModal.jsx) and [`AddServiceModal.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/modals/AddServiceModal.jsx).
    - Fixed collapsed inline unstyled elements (`className="input mb-3"`) that previously caused horizontal wrapping and misplaced floating placeholders.
    - Added clean typography, visible borders, focus rings, responsive multi-column grids for pricing/duration, and aligned action buttons.
    - **Modal Viewport & Scroll Fix (`ModalWrapper.jsx`)**: Portaled modals via `createPortal(..., document.body)` with `z-[9999]`, `fixed inset-0`, background scroll lock, and internal `max-h-[92vh] overflow-y-auto` card scrolling. This completely eliminated top/bottom clipping on all monitor resolutions.
    - **Admin Navigation Simplification**: Removed the redundant top header navbar entirely from `AdminLayout.jsx`. Embedded the official **Super Admin** profile badge directly into `AdminSidebar.jsx` below the brand header with live name, email, and role badge.
- **Unique 10-Character Human-Readable Booking ID System**:
  - Format: `GN-[2 Alphanumeric]-[6 Digits]` (e.g., `GN-7K-481920`, `GN-AB-123456`), giving exactly 10 alphanumeric characters (`GN` + 2 uppercase alphanumeric + 6 digits). Easy to read, memorize, or tell over the phone.
  - Generator: `BookingCodeGenerator.java` utilizing non-ambiguous uppercase characters (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`) and `SecureRandom`.
  - Entity: `Booking.java` with `@Column(name = "booking_code", unique = true, length = 32) private String bookingCode;` and `@PrePersist ensureBookingCode()`.
  - Repository: Added `existsByBookingCode()` and `findByBookingCode()` in `BookingRepository.java`.
  - Backfill & Compatibility: `AdminInitializer.java` auto-generates unique codes for any legacy bookings with `null` codes on startup.
  - DTOs & Services: `bookingCode` exposed across `BookingResponse`, `BookingDetailsResponse`, customer booking flows, staff appointments, admin queries, and transactional emails (booking confirmation, reschedule, cancellation, and official tax invoice email).
- **Universal Booking Search Across All 3 Portals**:
  - **Customer Portal (`/customer/bookings`)**: Real-time search bar matching booking code (with or without hyphens), service name, or stylist name.
  - **Admin Portal (`/admin/bookings`)**: Live search bar matching 10-digit booking code, client name, booked by, service name, or note. Also supports backend lookup by booking code or UUID.
  - **Staff Stylist Station (`/staff/dashboard`)**: Queue search bar matching booking code, client name, phone number, or service items with clear button and empty-state guidance.
- **Payment Processing & Points Accrual**:
  - Created `PaymentCheckoutRequest` DTO.
  - Implemented `checkoutPayment` in `CustomerPaymentService`:
    - Links invoice, updates booking to `CONFIRMED`, and generates unique invoice number.
    - Accrues loyalty reward points to customer upon payment completion (1 pt per ₹100 spent).
    - Updates loyalty tier (Silver -> Gold -> Platinum -> Diamond).
    - Records entry in `PointsLedger` with reason `BOOKING_COMPLETED`.
    - Generates in-app `Notification`.
  - Exposed `POST /api/v1/customer/payments/checkout` in `CustomerPaymentController`.
- **Live Tested**:
  - Spring Boot daemon running on `http://localhost:8008`.
  - Live verified end-to-end user registration, login, booking creation, Gmail confirmation email, payment checkout, points accrual, in-app notification, 5-star review submission, product catalog retrieval, and automated itemized tax bill email generation.

---

## 2. Frontend Web (`/frontend_web`)

### ✅ Implemented & Production-Ready (100%)
- **Groomish Now Brand System & Aesthetics**:
  - Strict adherence to the official brand color palette:
    - Coral: `#FC6957`
    - Charcoal Slate: `#373A43`
    - Gold / Amber: `#FED652`
    - Cream Canvas: `#FAF6ED`
    - Emerald Green: `#34A955`
    - Crimson Rose: `#EA4158`
    - Vibrant Tangerine: `#FA7B47`
    - Ocean Blue: `#207FBD`
  - Typography: Google Fonts `Outfit`, `Plus Jakarta Sans`, and `Playfair Display`.
  - Modern UI elements: Glassmorphism headers, glowing buttons (`shadow-glowOrange`, `shadow-glowGold`), smooth transitions, responsive layout, custom scrollbar.
  - Brand Assets: Integrated `frontend_web/public/` assets (`groomish_logo_2.png`, `groomish_now_name.png`, `groomisg_now_icon.png`).
- **Navigation & Layout**:
  - Sleek top navigation (`h-16`) utilizing solely `/groomish_logo_2.png` (integrated logo + wordmark).
  - Profile dropdown simplified strictly to **My Profile** and **Log Out** (with optional admin/staff portal entry if authenticated with those roles), avoiding redundancy with top navbar links.
  - Distinct navigation links to dedicated **Categories** (`/categories`) and **Services** (`/services`) pages.
  - Real-time loyalty points badge (`pts`), and unread notification bell drawer.
  - Luxury footer with salon services overview, operating hours, newsletter signup, and contact information.
- **Dedicated Public Pages & Navigation**:
  - `CategoriesPage.jsx` (`/categories`): Full-featured salon categories gallery with service count, search, high-res photography, and direct navigation into dedicated category pages.
  - `CategoryDetailPage.jsx` (`/category/:categoryId` & `/categories/:categoryId`): **Dedicated Category Page** featuring hero cover, gender filter options (**Women**, **Men**, **Unisex**, **All**), live search, price/duration sorting, service cards with direct booking, and related collections carousel.
  - `ServicesPage.jsx` (`/services`): Dedicated salon treatments catalog with category pills filter, gender tabs, live keyword search, price sorting, and interactive booking modal trigger.
  - `ServiceDetailPage.jsx` (`/services/:serviceId`): **Dedicated Treatment Detail Page** with high-res photography, gender badges, duration & pricing breakdown, verified customer reviews & rating summary integration (`/api/v1/public/reviews/service/{id}` & `/summary`), what-to-expect hygiene badges, sticky booking card with Groomish loyalty points preview, and "You Might Also Like" related services.
  - `ProductsPage.jsx` (`/products`): **Dedicated Beauty Shop & In-Store Pickup Page** with luxury Groomish Now styling, category pills (**Hair Care**, **Skin & Facial**, **Beard Care**, **Styling**), live search, brand filters, in-store pickup indicators, loyalty points calculations, and interactive In-Store Product Reservation dialog.
  - `Navbar.jsx`: Added direct **Shop** link to both desktop navigation bar and mobile dropdown menu.
- **Landing Page (`/`)**:
  - Hero section with live booking CTA and VIP Club loyalty preview card.
  - **Category Section**: Strictly capped to **2 lines** (10 items max on 5-col grid). Each category card navigates directly to its dedicated category page (`/category/:categoryId`).
  - **Services Section**: Strictly capped to **3-4 lines** (12 items max on 4-col grid). Each card navigates directly to its dedicated treatment page (`/services/:serviceId`) or opens instant booking.
  - VIP Loyalty tier breakdown card (Silver, Gold, Platinum, Diamond).
- **Interactive Modals & Auth Overhaul**:
  - `AuthModal.jsx`: **Fixed icon and text overlap** in Sign In and Create Account forms by adopting robust flex containers (`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border ... focus-within:border-groomish-orange`) with transparent unpadded inputs, completely eliminating CSS cascade collisions. Header updated to solely use `groomish_logo_2.png`. Includes quick demo sign-in helper (`mrsagarxt@gmail.com` / `sagar`), password visibility toggles, referral code field, and OTP flow.
  - `ModalWrapper.jsx`: Rounded luxury dialog with backdrop blur, keyboard Escape listener, and animated entrance.
  - `BookingFlowModal.jsx`: Multi-step salon booking:
    1. Visual date selector (Today, Tomorrow, Day After) & time slots grouped with real-time slot availability.
    2. Promo coupon code validator with instant discount deduction.
    3. Itemized bill breakdown with GST and loyalty points calculation.
    4. Payment checkout selection (UPI, Card, Pay at Salon) directly calling `POST /customer/payments/checkout`.
    5. Celebration screen with appointment details, points earned, and confirmation email notice.
  - `CustomerBookingDetailsModal.jsx` & `RescheduleBookingModal.jsx`: Slot rescheduling and cancellation dialogs.
  - `LeaveReviewModal.jsx`: Interactive 5-star rating component with comment feedback submitting to `CustomerReviewController`.
  - `NotificationDrawer.jsx`: Real-time alerts drawer with mark-as-seen.
- **Customer Pages (`/customer/*`)**:
  - `MyBookingsPage.jsx`: Filter by All, Upcoming, Completed, and Cancelled with action buttons (Reschedule, Cancel, and Rate & Review).
  - `RewardsPage.jsx`: VIP Tier status card with progress bar to next tier, perks breakdown, redeemable vouchers catalog with 1-click redemption, and transparent points ledger.
  - `ProfilePage.jsx`: User profile editor, security change password section with email alert, and VIP Referral Code card with 1-click clipboard copy and WhatsApp sharing link.
- **Admin Portal (`/admin/*`)**:
  - `AdminSidebar.jsx`: Charcoal slate design with Groomish branding, active menu states, quick link to customer website, and new **Store Products** menu link.
  - `AdminLayout.jsx`: Top navigation header with Admin profile chip.
  - `DashboardPage.jsx`: Real-time metrics (Total Revenue, Total Bookings, Today's Schedule, Total Clients) and Recent Appointments table.
  - `BookingsPage.jsx`: Filter by Status (Pending, Confirmed, Completed, Cancelled) with Approve, Reject, and Mark Completed controls.
  - `CategoriesPage.jsx`: Active/Inactive filters, Add Category modal, and activation toggle.
  - `ServicesPage.jsx`: Category filters, pricing & duration management, Add Service modal.
  - `ProductsPage.jsx` (`/admin/products`): **Retail Products Inventory Management** table, live search, stock units monitor, Add/Edit product modal, in-store pickup toggle, and activation switch.
  - `CustomersPage.jsx`: Client search by name/email/phone, VIP Tier badges, points balance, and active toggle.
  - `StaffPage.jsx`: Stylist directory with Add Staff Member modal.
  - `CouponsPage.jsx`: Promo code management, discount amounts, min cart values, and Create Coupon modal.
  - `PaymentsPage.jsx`: Comprehensive audit trail of client payments, invoice numbers, and payment methods.
  - `ReviewsPage.jsx`: Customer review ratings moderation with delete controls.
- **Staff Portal (`/staff/*`)**:
  - `StaffDashboard.jsx`: Production-ready Stylist Station aligned with Groomish Now branding.
  - Real-time stats: Today's Bookings, Completed Treatments, Pending Queue, Today's Billing revenue, and Total Lifetime Clients Assisted.
  - Appointment actions:
    - **"Bill & Products"**: Dedicated modal for stylists to view treatment snapshots, attach retail store products (with stock validation & quantity picker), remove items, view the live updated total, and click **"Complete & Send Bill Email"**.
    - **One-Click Complete**: Marking an appointment as completed automatically awards loyalty points, saves the final bill, and dispatches the Groomish Now Tax Invoice & Payment Receipt email to the client!
- **Routing & Role Portal Direct Access**:
  - Direct entry for Admin & Staff: Admin automatically opens the Admin Panel (`/admin/dashboard`) and Staff automatically opens the Staff Dashboard (`/staff/dashboard`) upon login or visiting `/`.
  - Navbar completely hidden for Admin (as AdminSidebar is always present) and Staff (as Staff Dashboard has its own header).
  - All public catalog pages auto-redirect Admin and Staff directly to their corresponding admin management portals (`/admin/categories`, `/admin/services`, `/admin/products`) or Staff Dashboard.
- **Custom Smooth Rounded Select Component (`CustomSelect.jsx`)**:
  - Overhauled blocky native browser `<select>` controls into modern, smooth, floating dropdowns.
  - Features animated chevron rotation (180°), floating `rounded-2xl` menu with soft elevation shadow, active checkmark indicators (`Check`), Groomish orange hover states, outside click dismissal, and standard form event compatibility (`name`, `value`, `onChange`).
  - Implemented across all forms and tables:
    - Admin: [`AddServiceModal.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/modals/AddServiceModal.jsx), [`EditServiceModal.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/modals/EditServiceModal.jsx), [`ServicesPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/admin/ServicesPage.jsx), [`ProductsPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/admin/ProductsPage.jsx).
    - Public: [`ServicesPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/public/ServicesPage.jsx), [`CategoryDetailPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/public/CategoryDetailPage.jsx), [`ProductsPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/public/ProductsPage.jsx).
    - Staff & Customer: [`StaffDashboard.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/staff/StaffDashboard.jsx) (walk-in gender & retail store product picker), [`ProfilePage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/customer/ProfilePage.jsx) (gender preference), and [`Register.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/auth/Register.jsx) (country code selector).
- **Compact One-Pager Modals (`AddServiceModal.jsx` & `EditServiceModal.jsx`)**:
  - Re-architected modal layouts into compact 2-column configurations (`maxWidth="max-w-2xl"`) so all inputs and action buttons fit on a single screen without vertical scrolling.
  - Aligned fields horizontally: Service Name & Category side-by-side, 4-column pricing and duration row (Gender, MRP, Offer Price, Duration), and Service Description alongside Cloudinary photo uploader.
  - Added `compact={true}` mode to [`CloudinaryImageUploader.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/common/CloudinaryImageUploader.jsx) with reduced dropzone padding and scaled icons.
- **Centralized 401 Session Expiration & Auto-Login Redirect (`axiosClient.js`)**:
  - Configured central Axios response interceptor capturing `401 Unauthorized` responses.
  - Automatically purges expired credentials (`user` and `token`) from `localStorage`.
  - Dispatches debounced error toast: **"Session expired or unauthorized. Please log in again."**
  - Smoothly redirects unauthenticated users to `/login` after notification display.
  - Also captures `403 Forbidden` with "Access denied" alerts.
- **Global Groomish Now Toast & Popup Notification Hub**:
  - Rebuilt [`Toast.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/Toast.jsx), [`ToastProvider.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/context/ToastProvider.jsx), [`useToast.js`](file:///d:/Projects/loyalty_program_app/frontend_web/src/context/useToast.js), and [`toastEmitter.js`](file:///d:/Projects/loyalty_program_app/frontend_web/src/utils/toastEmitter.js).
  - Floating stack at `fixed top-5 right-5 z-[99999]` with backdrop blur, brand theme tokens, auto-dismiss timer (4s), manual close `X`, and Lucide status icons (`CheckCircle2`, `AlertCircle`, `AlertTriangle`, `Sparkles`).
  - Supports dual trigger pathways: React hook `useToast()` (`showToast`, `success`, `error`, `warning`, `info`) and non-React static emitter `toastEmitter.*` (callable in Axios interceptors and utility functions).
- **Unified Auth & Token Synchronization (`AuthProvider.jsx` & `AuthContext.jsx`)**:
  - Standardized JWT token and user profile storage across both context providers (`data.token || data.accessToken`).
  - Guarantees `Authorization: Bearer <token>` is attached to every authenticated API call.
- **Universal Array & Page Normalization (`extractList`)**:
  - Implemented `extractList()` utility to safely handle Spring Boot `Page<T>` responses (`{ content: [...], totalElements: ... }`) and raw arrays.
  - Eliminated runtime crashes (`categories.filter is not a function`, `services.filter is not a function`, `payments.reduce is not a function`) across:
    - Admin: `CategoriesPage`, `ServicesPage`, `ProductsPage`, `BookingsPage`, `CustomersPage`, `StaffPage`, `CouponsPage`, `PaymentsPage`, `ReviewsPage`.
    - Public: `CategoriesPage`, `ServicesPage`, `CategoryDetailPage`, `ServiceDetailPage`, `ProductsPage`, `LandingPage`, `CategoriesSection`, `ServicesSection`.
    - Customer & Modals: `MyBookingsPage`, `RewardsPage`, `NotificationDrawer`, `CategoryServicesModal`, `Navbar`.
- **Routing & Build Verification**:
  - All routes protected by `PrivateRoute` with role-based authorization (`CUSTOMER`, `STAFF`, `ADMIN`).
  - Production build succeeds cleanly with 0 errors (`✓ built in 11.79s`).

---

## 3. 🎯 Next Target: Location-Based Store Suggestions & Notification Services

### 📍 Phase A: Multi-Store Architecture & Geolocation Engine
1. **Store Entity & Backend Management (`/backend`)**:
   - Create `Store.java` entity:
     - `id`, `name`, `code` (e.g., `GN-BLR-KORAMANGALA`), `address`, `city`, `state`, `pincode`, `phone`, `email`.
     - `coverImage` (Cloudinary `groomishnow/stores`), `latitude`, `longitude`, `active`, `openingTime`, `closingTime`.
   - `StoreRepository.java` with geospatial and city queries.
   - Admin Store Controller (`/api/v1/admin/stores`) supporting full CRUD: Add Store, Edit Store details, Upload branch photo, and deactivate branch.
   - Public Store Controller (`/api/v1/public/stores`) for catalog browsing and location lookups.
   - Seed default flagship stores in `AdminInitializer.java` (e.g. Indiranagar, Koramangala, Whitefield, HSR Layout).

2. **Automated Geolocation & Nearest Store Suggestion (`/frontend_web`)**:
   - Utilize browser `navigator.geolocation.getCurrentPosition()` on initial visitor arrival.
   - Calculate distances using the Haversine formula against active store coordinates.
   - Automatically pre-select the closest Groomish branch with fallback to the flagship store.
   - Persist selected store in `localStorage` / application state.

3. **Navbar Store Selector Component**:
   - Positioned prominently directly beside the Groomish logo in [`Navbar.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/Navbar.jsx).
   - Pill badge displaying `MapPin` icon, current **Store Name**, and **Neighborhood / City**.
   - Interactive dropdown popover with live store search, distance indicators (e.g. `1.8 km away`), address preview, and 1-click store switching.

4. **Store-Linked Staff Members**:
   - Link staff user accounts to their designated `storeId`.
   - Staff login automatically scopes the session and directs the stylist directly to their store's station queue.

5. **Store-Aware Appointments & Bookings**:
   - Capture `storeId` / store snapshot in booking entity during customer checkout.
   - Stylists on [`StaffDashboard.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/staff/StaffDashboard.jsx) view appointments and queues strictly filtered to their store.
   - Admin Bookings portal ([`BookingsPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/admin/BookingsPage.jsx)) equipped with a multi-store dropdown filter to view bookings globally or per-branch.

---

### 🔔 Phase B: Advanced Notification Services Engine
1. **Multi-Channel Notification Pipeline**:
   - In-app live notification drawer ([`NotificationDrawer.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/NotificationDrawer.jsx)) with unread counters and mark-as-seen actions.
   - Real-time popups via the newly integrated Groomish Toast Hub.
   - Automated transactional emails via Gmail SMTP (`EmailService`).
2. **Lifecycle Notification Triggers**:
   - Appointment booked, rescheduled, or cancelled.
   - Stylist assignment alerts.
   - Appointment completion, payment confirmation, and official tax invoice delivery.
   - Loyalty point balance updates and VIP tier promotions.
   - Store broadcast announcements and promotional deals.

---

## 4. Mobile App (`/mobile_app`) - Future Phase

### 📋 Action Plan
1. Fix runtime crash in `mobile_app/app/index.tsx` (missing asset `salon-logo.png`).
2. Fix API endpoints in `mobile_app/api/client.ts` (`/api/` -> `/api/v1/`).
3. Implement persistent authentication storage (AsyncStorage / SecureStore) for JWT tokens.
4. Align mobile UI with Groomish Now color palette and logo assets.
5. Build customer mobile tabs: Home Services, Appointment Slots, My Bookings, Loyalty Rewards, and Profile.
