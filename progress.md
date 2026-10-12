# Salon Booking & Loyalty Program - Project Progress Tracker

> **Last Updated:** October 12, 2026  
> **Status:** Backend & Frontend Web (Groomish Now) 100% Completed, Verified & Production Ready. Multi-Store Geolocation Architecture, Branch Catalogs, Staff Operations Hub, Visual Analytics & Custom UI Component System Fully Deployed.

---

## 📊 High-Level Status Overview

| Subsystem | Tech Stack | Completion | Status Summary |
| :--- | :--- | :---: | :--- |
| **Backend** | Spring Boot 3.5, Java 21, PostgreSQL, JPA, JWT, JavaMail | **100%** | **Completed, Tested & Live Running.** Multi-store branch architecture, localized service/product availability overrides, staff profile & password change endpoints, branch analytics API with customizable timeframes, real-time Gmail SMTP asynchronous mailing, complete Service Review system, payment checkout & point accruals, in-app notifications, and request context fixes verified with live test user. |
| **Frontend Web** | React 19, Vite 7, Tailwind CSS 3, Lucide Icons | **100%** | **Completed & Fully Production-Ready.** Overhauled with official Groomish Now brand palette, smooth keyframe animations, glassmorphism navbar, store geolocation selector with Haversine distance, Staff Station with tabbed appointment queues (Today, Upcoming, Completed, All), Staff Booking Detail page with itemized billing, Staff Branch Analytics dashboard with toggleable Bar/Line charts, Staff Profile & Branch Info hub, Custom Groomish Date & Time Pickers, searchable `CustomSelect` dropdowns, item multiplier displays (`Item X {qty}`), and a global modal confirmation/alert system (`ConfirmContext`) replacing all native browser dialogs. Production build passes cleanly with 0 errors (`vite build` ✓). |
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
  - **Referral Code Generation & Strict Verification Engine**:
    - Standardized 6-character referral code format across all user creations: 3 letters of name + 3 random alphanumeric characters (e.g., `SAG8K2`), generating collision-free codes.
    - Public Verification Endpoint `GET /api/v1/auth/verify-referral?code={code}` validating referral codes prior to or during signup. Returns 200 with `{ valid: true, referrerName: ... }` or 400 Bad Request with `{ valid: false, message: "Invalid Referral Code" }`.
    - Enforced strict referral validation in `AuthService.registerUser`: if an invalid referral code is provided, registration is rejected with `Invalid Referral Code` and user creation is blocked.
    - Automatic `Referral` entity association when a valid referral code is provided upon registration.
    - Frontend registration flows (`AuthModal.jsx` and `Register.jsx`) provide live verification, `"Invalid Referral Code"` alert, with actionable **"Retry / Edit Code"** and **"Sign up without referral code"** options.
  - **Auto-Login on Registration & Browsing Context Preservation**:
    - Backend `registerCustomer` (`AuthService.registerUser`) now generates and returns an active JWT Bearer token directly on `UserResponse.token`.
    - Eliminates false-positive "Session expired" 401 popups immediately following registration.
    - `AuthModal` keeps customers on the exact page they are browsing (e.g. Products, Services) without kicking them to the home page or forcing re-navigation.
    - Standalone `/login` and `/register` support `?redirect=` query parameters and session fallback to seamlessly return customers to their intended appointment or product booking.
- **Real-Time Gmail Mail Service & Official Tax Invoicing**:
  - Enabled `@EnableAsync` in `BackendApplication` for non-blocking asynchronous email delivery.
  - Corrected classpath template loading in `EmailTemplateServiceImpl` and `OtpServiceImpl` to use `ClassPathResource.getInputStream()` with fallback containers.
  - Overhauled email HTML templates (`email-template.html`, `send-otp.html`) with **Groomish Now** branding, luxury logo banner, and color palette (`#FC6957`, `#373A43`, `#FAF6ED`, `#FED652`).
  - Implemented real-time transactional emails via configured Gmail SMTP:
    - **OTP Email**: Formatted 6-digit verification code delivery with Groomish Now luxury branding sent to the user's email address, powering email-based account registration and verification.
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
  - **Dashboard Booking ID Alignment**: Resolved discrepancy where Admin Dashboard displayed truncated raw UUIDs (`b.id.slice(0, 8)`) due to `DashboardAdminServiceImpl` omitting `dto.setBookingCode(...)` and unsorted page request. Updated `DashboardAdminServiceImpl` to sort by `createdAt DESC` and populate `bookingCode`, and updated `DashboardPage.jsx` and `StaffDashboard.jsx` to consistently display the unified `bookingCode` (with `GN-[UUID8]` fallback) and link directly to the respective appointment details page (`/admin/bookings/:id` and `/staff/bookings/:id`).
  - **Customer Special Notes Scope Adjustment**: Removed "Customer Special Notes" block from Admin Booking Details ([`AdminBookingDetailPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/admin/AdminBookingDetailPage.jsx)) and Staff Booking Details, keeping it exclusively visible to clients on Customer Booking Details ([`BookingDetailPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/customer/BookingDetailPage.jsx) & [`CustomerBookingDetailsModal.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/modals/CustomerBookingDetailsModal.jsx)).
- **Universal Booking Search Across All 3 Portals**:
  - **Customer Portal (`/customer/bookings`)**: Real-time search bar matching booking code (with or without hyphens), service name, or stylist name.
  - **Admin Portal (`/admin/bookings`)**: Live search bar matching 10-digit booking code, client name, booked by, service name, or note. Also supports backend lookup by booking code or UUID.
  - **Staff Stylist Station (`/staff/dashboard`)**: Queue search bar matching booking code, client name, phone number, or service items with clear button and empty-state guidance.
- **Multi-Store Geolocation & Localized Branch Catalog Architecture**:
  - `Store.java` entity expanded with multi-image gallery support (Cloudinary JSON array up to 6 photos), full opening/closing times, geocoding (`latitude`, `longitude`), and contact information.
  - Entities for localized catalog customization: `StoreServiceAvailability.java` (branch-specific active flag, price override, custom duration) and `StoreProductInventory.java` (branch stock tracking, low stock alerts, in-store pickup toggle).
  - Repositories: `StoreRepository.java`, `StoreServiceAvailabilityRepository.java`, and `StoreProductInventoryRepository.java`.
  - Services: `StoreService` (Haversine formula calculation) & `BranchCatalogService` with robust fallback to global catalog when no branch override exists.
  - Controllers:
    - Public: `PublicStoreController.java` (`/api/v1/public/stores`, `/api/v1/public/stores/{id}/services`, `/api/v1/public/stores/{id}/products`).
    - Staff: `StaffStoreCatalogController.java` (`/api/v1/staff/stores/catalog/services`, `/api/v1/staff/stores/catalog/products`).
    - Admin: `AdminStoreCatalogController.java` (`/api/v1/admin/stores/{id}/catalog/**`) & `AdminStoreController.java` (CRUD).
- **Staff Profile & Security Management (`/api/v1/staff/profile`)**:
  - `StaffProfileController.java` & `StaffProfileService` (`StaffProfileServiceImpl.java`):
    - `GET /api/v1/staff/profile`: Returns stylist personal information along with assigned salon branch details (Store name, code, phone, email, address, operating hours, coordinates).
    - `PUT /api/v1/staff/profile`: Allows updating personal information (name, phone number) with validation.
    - `PUT /api/v1/staff/profile/change-password`: Secure password change verifying old password with `PasswordEncoder` (BCrypt) before saving new hash and dispatching security email notification.
- **Staff Branch Analytics Engine (`/api/v1/staff/dashboard/analytics`)**:
  - Endpoint: `GET /api/v1/staff/dashboard/analytics?period={day|week|month|custom}&startDate={...}&endDate={...}`.
  - Aggregates live metrics strictly scoped to the stylist's assigned salon branch: Total Revenue (₹), Total Appointments, Completed Ratio, Average Ticket Value, and time-series data points for charting.
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
  - Cleaned top navigation layout: Removed cluttered Loyalty Rewards link and reward points pill from the main header.
  - Organized Profile Dropdown: Placed **Loyalty Rewards** link and a luxury **Reward Points & Tier badge card** directly below **My Profile** in the Profile dropdown.
  - Distinct navigation links to dedicated **Categories** (`/categories`), **Services** (`/services`), **Shop** (`/products`), and **My Bookings** (`/customer/bookings`).
  - Unread notification bell drawer with real-time badge.
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
- **Staff Portal & Operations Hub (`/staff/*`)**:
  - `StaffDashboard.jsx`: Production-ready Stylist Station aligned with Groomish Now branding.
  - Real-time stats: Today's Bookings, Completed Treatments, Pending Queue, Today's Billing revenue, and Total Lifetime Clients Assisted.
  - **Branch Bookings Queue & Multi-Status Filtering**:
    - Filter tabs: **Today's**, **Upcoming**, **Completed**, and **All** with real-time numeric badges.
    - Consolidated Schedule Queue directly into **Branch Bookings** with fast appointment inspection links.
    - Clean UI: Removed redundant top header banner (`"Assigned Salon Branch: ..."`), keeping the viewport spacious as `StaffSidebar.jsx` already clearly displays the assigned branch name and status.
  - **Dedicated Staff Booking Detail Page (`StaffBookingDetailPage.jsx` at `/staff/bookings/:id`)**:
    - Visual timeline of appointment status progression (`PENDING` -> `CONFIRMED` -> `IN_PROGRESS` -> `COMPLETED`).
    - Add Services and Retail Products directly to the appointment bill using searchable Groomish dropdowns.
    - Multiplier quantity displays: `Item Name X {quantity}` format for multiple additions of the same service or product.
    - Itemized financial breakdown (Services subtotal, Attached products, GST, Discounts, Final Total).
    - Status transition controls (Start Service, Complete & Send Bill Email, Cancel).
  - **Staff Branch Analytics Dashboard (`StaffBranchAnalyticsTab.jsx` at `?tab=analytics`)**:
    - Filterable analytics by timeframe: **Day**, **Week**, **Month**, and **Custom Range** (powered by `CustomDatePicker`).
    - Real-time KPI cards: Total Branch Revenue (₹), Appointments Handled, Completed Ratio, and Average Ticket Value.
    - Dual Visualization Toggle: **Bar Chart** (default) and **Line Chart** with interactive SVG rendering, gradient fills, and data hover tooltips.
    - Metric toggle between **Revenue (₹)** and **Appointments**.
    - Cleaned layout with removal of redundant "Interval:" text.
  - **Staff Stylist Profile & Branch Hub (`StaffProfileTab.jsx` at `?tab=profile`)**:
    - Profile editor: Update Name and Phone with immediate feedback.
    - Password Security: Dedicated Change Password modal with BCrypt verification and email alerts.
    - Comprehensive Assigned Salon Branch Information card showing branch code, name, phone, email, address, operating hours, and active status.
- **Custom Groomish Design System Components**:
  - **`CustomDatePicker.jsx`**: Fully custom calendar picker themed in Groomish Coral (`#FC6957`) and Charcoal Slate (`#373A43`), with month/year navigation, today indicator, active day styling, and Quick Select buttons ("Today", "Clear").
  - **`CustomTimePicker.jsx`**: Bespoke 12-hour AM/PM time selector with interactive hour/minute spinners and quick salon presets (09:00 AM, 10:00 AM, 08:30 PM, 09:30 PM, etc.) for admin branch hours in `StoresPage.jsx`.
  - **`CustomSelect.jsx` (Searchable Dropdown)**: Upgraded with sticky search bar (`searchable={true}`), filter-as-you-type, keyboard navigation, and Groomish orange focus ring for effortless selection across 100+ services and products.
  - **Global Form & Dropdown Styling (`index.css`)**: Global `select` styling with custom Groomish orange SVG chevron, rounded borders, focus glow, and custom `-webkit-calendar-picker-indicator` filter.
  - **Item Multiplier Display (`Item Name X {quantity}`)**: Added ` X {quantity}` right after item name across staff, admin, and customer booking views when multiple items of the same service or product are added.
  - **Global Modal Confirmation & Alert Dialog Hub (`ConfirmContext.jsx`)**:
    - Central `ConfirmProvider` exposing `showConfirm()` (returns `Promise<boolean>`) and `showAlert()` (returns `Promise<void>`).
    - Replaced all ugly/blocking native browser `window.confirm()` and `alert()` calls across the entire application (`StaffBookingDetailPage`, `BookingDetailPage`, `CustomerBookingDetailsModal`, `NotificationDrawer`, `StoresPage`, `ProductsPage`, `ReviewsPage`, `CouponsPage`, `ChangePasswordModal`) with branded Groomish modal dialogs featuring backdrop blur, smooth animations, and customizable buttons.
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

### 📍 Phase A: Multi-Store Architecture & Geolocation Engine (✅ 100% COMPLETED)
1. **Store Entity & Backend Management (`/backend`)**:
   - `Store.java` entity with `code`, `name`, `address`, `city`, `state`, `pincode`, `phone`, `email`, `image`, `latitude`, `longitude`, `openingTime`, `closingTime`, `active`.
   - Linked to `User.java` (staff store association) and `Booking.java` with snapshot fields (`storeNameSnapshot`, `storeAddressSnapshot`).
   - `StoreRepository.java` with active sorting and code lookups.
   - `StoreService` & `StoreServiceImpl` with Haversine distance proximity calculation (Earth radius 6371 km).
   - Admin Controller (`/api/v1/admin/stores`) supporting full CRUD: Add Store, Edit Store, Toggle active, and Delete.
   - Public Controller (`/api/v1/public/stores`) with optional `?lat=...&lng=...` sorting by nearest branch.
   - Seeded 4 Bengaluru flagship salons in `AdminInitializer.java` (Indiranagar Flagship, Koramangala Lounge, HSR Layout Studio, Whitefield Prestige) with live coordinates and backfilled staff/bookings.

2. **Automated Geolocation & Nearest Store Engine (`/frontend_web`)**:
   - `StoreContext.jsx`: Interrogates browser GPS coordinates (`navigator.geolocation.getCurrentPosition`), queries backend proximity engine, and selects the nearest salon branch automatically. Supports local storage manual override and re-detect GPS button.

3. **Navbar Store Selector Component**:
   - [`StoreSelectorDropdown.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/StoreSelectorDropdown.jsx) placed beside the Groomish logo in [`Navbar.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/Navbar.jsx).
   - Renders current branch name, city, distance tag (`📍 1.2 km away`), and an interactive popover with search bar, GPS re-detect, thumbnail previews, hours, and click-to-switch.

4. **Staff Station Assignment per Store**:
   - Stylists assigned to stores in [`StaffPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/admin/StaffPage.jsx) via branch dropdown and editable profile modal.
   - [`StaffDashboard.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/staff/StaffDashboard.jsx) displays assigned salon branch badge in header and an active branch queue banner.
   - Stylist queue is strictly scoped to their assigned salon branch.

5. **Store-Aware Appointments & Bookings**:
   - [`BookingFlowModal.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/modals/BookingFlowModal.jsx) attaches `storeId` to checkout payload, previews chosen salon branch in Step 1 & 2, and renders the branch name and address in the Step 3 confirmation card.
   - Customer [`BookingCard.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/customer/BookingCard.jsx) and Admin [`BookingCard.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/admin/BookingCard.jsx) display the salon branch badge.
   - Admin Bookings portal ([`BookingsPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/admin/BookingsPage.jsx)) equipped with a multi-store dropdown filter (`storeFilter`) to view bookings globally or per-branch.

6. **Admin Multi-Store Catalog Manager**:
   - Created [`StoresPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/admin/StoresPage.jsx) at `/admin/stores` with active toggles, direct Google Maps navigation links, Cloudinary photo uploads, and a "Detect Device GPS" button. Added to [`AdminSidebar.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/admin/AdminSidebar.jsx).

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

---

### 🌟 Phase C: Lifetime VIP Tiers, Past Slot Restrictions & Redeemed Vouchers System
1. **Lifetime VIP Tiers & Auto-Upgrades (No Downgrade On Redemption)**:
   - Added `lifetimePoints` field to `User` entity and exposed it in `PointsBalanceResponse`.
   - Updated points accumulation to increment both redeemable balance (`points`) and cumulative (`lifetimePoints`).
   - Tier calculations (Silver: 0 pts, Gold: 50 pts, Platinum: 150 pts, Diamond: 300 pts) are strictly computed from `lifetimePoints`.
   - When a customer redeems vouchers and points balance decreases, their tier never downgrades (e.g. 200 lifetime points minus 150 points redeemed stays in Platinum tier).
   - Removed marketing badges (`POPULAR` on Gold, `VIP MAX` on Diamond) from [`LandingPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/landing/LandingPage.jsx) as tiers are milestone-awarded.
   - Updated [`RewardsPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/customer/RewardsPage.jsx) hero card to display cumulative `Lifetime Points: X pts` alongside active redeemable balance.

2. **Appointment Slot Timing & Past Booking Restrictions**:
   - UI Slot Filter: [`BookingFlowModal.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/modals/BookingFlowModal.jsx), [`SlotPicker.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/booking/SlotPicker.jsx), and [`slots.js`](file:///d:/Projects/loyalty_program_app/frontend_web/src/utils/slots.js) now restrict date pickers to `min={todayStr}` and filter out all slots prior to current local time for today.
   - User Feedback: If all slots for today have passed, UI displays an informative message advising customers to pick tomorrow or an upcoming date.
   - Backend Slot Engine: [`CustomerBookingServiceImpl.java`](file:///d:/Projects/loyalty_program_app/backend/src/main/java/com/loyalty_program_app/backend/service/customer/impl/CustomerBookingServiceImpl.java) `getUnavailableSlots` marks all elapsed time slots for the current date as unavailable.
   - Backend Validation: `createBooking` and `rescheduleBooking` in both `CustomerBookingServiceImpl` and `StaffBookingServiceImpl` strictly reject any `scheduledAt.isBefore(LocalDateTime.now())` with a clean 400 Bad Request exception.

3. **Vouchers & Points Tracking Overhaul**:
   - Fixed voucher point price visibility in [`RewardsPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/customer/RewardsPage.jsx) (`pointsRequired`).
   - Dedicated customer page [`MyVouchersPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/customer/MyVouchersPage.jsx) at `/customer/vouchers` showing redeemed vouchers in card format with copyable code, discount %, applicable service tag, expiry date countdown, and "Book This Service Now" action.
   - Points Ledger history ([`RewardLedgerItem.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/customer/RewardLedgerItem.jsx)) now displays Order ID badges (`Order: GN-XX-XXXXXX`), bill amounts, service snapshots, and voucher codes.
   - Admin catalog management in [`AdminRewardsPage.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/admin/RewardsPage.jsx) allowing admins to create/update/deactivate vouchers with specific service links, discount %, and validity days.

4. **Admin Booking Details Modal & Complete Appointment Controls Console**:
   - Fixed crash (`Cannot read properties of null (reading 'map')` at `BookingDetailsModal.jsx:42:24`) by mapping booked services (`items`) and retail products (`products`) in [`BookingAdminServiceImpl.java`](file:///d:/Projects/loyalty_program_app/backend/src/main/java/com/loyalty_program_app/backend/service/admin/impl/BookingAdminServiceImpl.java).
   - Added `findByBookingId(UUID)` to [`BookingItemRepository.java`](file:///d:/Projects/loyalty_program_app/backend/src/main/java/com/loyalty_program_app/backend/repository/BookingItemRepository.java).
   - Added endpoint `PUT /api/v1/admin/bookings/{id}/status` in [`BookingAdminController.java`](file:///d:/Projects/loyalty_program_app/backend/src/main/java/com/loyalty_program_app/backend/controller/admin/BookingAdminController.java), fixing the previously non-functional Approve/Reject actions.
   - Completely overhauled [`BookingDetailsModal.jsx`](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/modals/BookingDetailsModal.jsx) into a full administration console:
     - Quick Status actions: **Approve (`CONFIRMED`)**, **Reject (`CANCELLED`)**, **Mark Completed (`COMPLETED`)**, with real-time feedback.
     - Reschedule controls: Interactive date picker (future-locked) and slot time picker.
     - Payment management: Edit payment status (`PENDING`, `COMPLETED`, `CANCELLED`, `REFUNDED`), payment method (`CASH`, `UPI`, `CARD`, `NETBANKING`), and amount received (`pricePaid`).
     - Notes: Editable stylist / internal client instructions.
     - Client & branch details: Displays client contact info, origin, branch location, booked service list, attached retail products, and VIP reward points status.
     - Seamless parent synchronization: Updates card list via `onUpdated` without page reload.


---

### 🎨 Phase D: Staff Station Operations Overhaul, Visual Analytics & Custom Design System (✅ 100% COMPLETED)
1. **Branch Bookings Queue & Categorized Filtering**:
   - Filter tabs: **Today's**, **Upcoming**, **Completed**, and **All** with live reactive count badges.
   - Streamlined queue navigation directly into dedicated appointment inspection pages (`/staff/bookings/:id`).
   - Header cleanup: Removed redundant top header banner (`"Assigned Salon Branch: ..."`), keeping viewport clean as `StaffSidebar.jsx` prominently highlights the assigned salon branch with live status indicator.

2. **Dedicated Staff Booking Detail Console (`StaffBookingDetailPage.jsx`)**:
   - Status progression visual timeline (`PENDING` -> `CONFIRMED` -> `IN_PROGRESS` -> `COMPLETED`).
   - Add services and products with searchable Groomish dropdowns.
   - Multiplier quantity displays: `Item Name X {quantity}` format for multiple additions of the same service or product.
   - Itemized bill calculator with tax breakdown and action buttons.

3. **Staff Branch Analytics Dashboard (`StaffBranchAnalyticsTab.jsx`)**:
   - Filterable analytics: **Day**, **Week**, **Month**, and **Custom Range** (with `CustomDatePicker`).
   - Real-time KPI metric cards: Total Branch Revenue (₹), Appointments Handled, Completed Ratio, Average Ticket Value.
   - Dual Visualization: **Bar Chart** (default) and **Line Chart** toggle with smooth SVG curve rendering, gradient fills, and interactive data point hover tooltips.
   - Metric toggle between **Revenue (₹)** and **Appointments**.
   - Clean UI: Removed redundant "Interval:" text.

4. **Staff Stylist Profile & Branch Information Hub (`StaffProfileTab.jsx`)**:
   - Stylist profile editor for name and phone updates.
   - Secure Change Password dialog with BCrypt verification.
   - Full Assigned Salon Branch Overview card displaying branch code, name, phone, email, full address, operating hours, and status.

5. **Custom Groomish UI Components & Global Modal System**:
   - **`CustomDatePicker.jsx`**: Fully custom calendar picker in brand colors (`#FC6957`, `#373A43`, `#FAF6ED`), with month/year navigation, today indicator, active day styling, and Quick Select buttons ("Today", "Clear").
   - **`CustomTimePicker.jsx`**: Interactive 12-hour AM/PM time selector with presets for opening and closing times.
   - **`CustomSelect.jsx` (Searchable Dropdown)**: Upgraded with sticky search bar (`searchable={true}`) for searching 100+ services and products without scrolling.
   - **Global Select & Form Styling (`index.css`)**: Groomish orange SVG chevron, rounded borders, focus glow, and custom `-webkit-calendar-picker-indicator` filter.
   - **Item Multiplier Display (`Item Name X {quantity}`)**: Universally applied when multiple quantities of a service or product exist.
   - **Global Modal Confirmation & Alert System (`ConfirmContext.jsx`)**: Replaced all native browser `window.confirm()` and `alert()` calls across the entire application with branded Groomish modal popups.

---

## 4. Mobile App (`/mobile_app`) - Future Phase

### 📋 Action Plan
1. Fix runtime crash in `mobile_app/app/index.tsx` (missing asset `salon-logo.png`).
2. Fix API endpoints in `mobile_app/api/client.ts` (`/api/` -> `/api/v1/`).
3. Implement persistent authentication storage (AsyncStorage / SecureStore) for JWT tokens.
4. Align mobile UI with Groomish Now color palette and logo assets.
5. Build customer mobile tabs: Home Services, Appointment Slots, My Bookings, Loyalty Rewards, and Profile.
