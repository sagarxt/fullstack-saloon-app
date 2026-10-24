# Salon Booking & Loyalty Program - Project Progress Tracker

> **Last Updated:** October 17, 2026  
> **Status:** Backend, Frontend Web, and Mobile App (Groomish Now) Fully Operational and Production Ready. Multi-Store Geolocation Architecture, Branch Catalogs, Unified Cart & Checkout, Authoritative Post-Payment Flow, Anti-Spam Notification Engine, Lifetime Tier Governance, and Expo SDK 57 Cross-Platform Mobile App Fully Deployed.

---

## High-Level Status Overview

| Subsystem | Tech Stack | Completion | Status Summary |
| :--- | :--- | :---: | :--- |
| **Backend** | Spring Boot 3.5, Java 21, PostgreSQL, JPA, JWT, JavaMail | **100%** | **Completed, Tested & Live Running.** Multi-store branch architecture, database-persistent Cart (`Cart` & `CartItem`), multi-item checkout converting to bookings & product attachments, coupon/voucher redemption, full Invoice Breakdown parity DTO & mapping (`couponCode`, `couponApplied`, `invoiceNumber`, item `mrp`), localized service/product availability overrides, staff/admin cart management, staff profile & password change endpoints, branch analytics API with customizable timeframes, real-time Gmail SMTP asynchronous mailing, complete Service Review system, payment checkout & point accruals, authoritative single-notification confirmation engine without spam, guarded appointment scheduler, and request context verified with live test user. |
| **Frontend Web** | React 19, Vite 7, Tailwind CSS 3, Lucide Icons | **100%** | **Completed & Fully Production-Ready.** Overhauled with official Groomish Now brand palette, smooth keyframe animations, glassmorphism navbar, persistent Cart system with reactive cart badge, dedicated `/cart` and `/checkout` pages, promo coupon & loyalty voucher redemption, full **Invoice Breakdown** parity matching Customer Booking Details across Admin Booking Details (`AdminBookingDetailPage`), Staff Booking Details (`StaffBookingDetailPage`), and Admin quick modal (`BookingDetailsModal`), "Available Offers" sections on service & product pages, store geolocation selector with Haversine distance, Staff Station with tabbed appointment queues (Today, Upcoming, Completed, All), Staff Branch Analytics dashboard, Staff & Admin customer cart inspector, Custom Groomish Date & Time Pickers, searchable `CustomSelect` dropdowns, item multiplier displays (`Item X {qty}`), global modal confirmation/alert system (`ConfirmContext`), and post-payment confirmation screen with auto-redirect countdown to Booking Details. Production build passes cleanly with 0 errors (`vite build` ✓). |
| **Mobile App** | React Native (Expo SDK 57), React 19.2, React Native 0.86, TypeScript, NativeWind | **~95%** | **Upgraded to Expo SDK 57 & Live Running.** 3-Slide luxury welcome onboarding carousel (`app/index.tsx`) allowing guest browsing without forced login. Replaced scissor icon with official brand logo (`logo.png`) on Login & Register. Full feature parity with Web: Home with groom coins card, Services catalog & booking modal, Shop (products catalog, category/brand filters, cart sheet, persistent Groom Coins discounts), Bookings management (filter & cancel/reschedule), Rewards & tier perks, and Customer Profile. Verified with `npx expo-doctor` (21/21 passed) and TypeScript compilation (`tsc --noEmit` ✓). |

---

## 1. Backend (`/backend`)

### Implemented and Stabilized (100%)
- **Admin Services & Categories Active/Deactive Toggle & Catalog Governance**:
  - Implemented `updateServiceStatus(UUID id, Boolean active)` and `updateCategoryStatus(UUID id, Boolean active)` endpoints (`PUT/PATCH /api/v1/admin/services/{id}/status` and `/categories/{id}/status`) to seamlessly toggle active/inactive states.
  - Added `private Boolean active;` to `ServiceRequest` and updated `ServiceAdminController` multipart & JSON endpoints so active states are supported during creation and update.
  - Resolved compiler/Lombok ECJ compatibility issues by establishing explicit public constructors for `ServiceAdminController`, `ServiceAdminServiceImpl`, `CategoryAdminController`, and `CategoryAdminServiceImpl`.
  - Fixed `ServiceCard.jsx` and `CategoryCard.jsx` frontend status toggling: previously inactive items erroneously called deactivate APIs; now both activate and deactivate transitions work smoothly with instant refresh.
  - Fixed `AddServiceModal.jsx`: defaulted active status to `true`, fixed checkbox handler reading `e.target.checked` instead of `e.target.value`, enhanced entire Active Status pill to be clickable, and ensured form resets maintain `active: true`.
  - **Service Card Price & Button Alignment Optimization**:
    - Changed button label from `'View Options'` to `'Options'` for multi-variation services across [ServicesSection.jsx](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/landing/ServicesSection.jsx), [ServicesPage.jsx](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/public/ServicesPage.jsx), and [CategoryDetailPage.jsx](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/public/CategoryDetailPage.jsx).
    - Reduced excessive vertical space between Groom Coins pill and bottom price/booking section (`mt-auto`, `pt-2`, `pt-3 border-t`).
    - Enforced `whitespace-nowrap` and optimized font sizing on price range text so prices never break onto two lines and stay horizontally aligned with the action button.
- **Build & Quality**:
  - Compiles cleanly with Maven (`BUILD SUCCESS` on Java 21).
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
    - **Instant 10 Reward Points Accrual & Real-Time Email Notification**: When a new friend registers using a customer's unique referral code:
      - The referrer automatically receives **+10 VIP Reward Points** in their account (incrementing both spendable `points` and `lifetimePoints`).
      - A dedicated `PointsLedger` audit record is generated (`reason = REFERRAL_BONUS`, `note = "Referred to <Friend Name>"`).
      - An in-app celebratory notification is dispatched.
      - A branded real-time transaction email (`sendReferralBonusEmail`) is dispatched via Gmail SMTP to the referrer detailing: `+10 Points Added`, the referred friend's name, total available points balance, and actionable instructions on redeeming points for salon vouchers and treatments.
    - **Customer Profile Referral Synchronization**: Expanded `CustomerProfileResponse` and `PointsBalanceResponse` to return the real `referralCode` (e.g. `RASR3A`), removing static fallback defaults (`GROOMISH`) in `ProfilePage.jsx` and `RewardsPage.jsx`. Also backfills unique 6-character referral codes for any existing customer accounts on startup.
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
  - `ServiceDetailPage.jsx` (`/services/:serviceId`): **Dedicated Treatment Detail Page** with high-res photography, gender badges, duration & pricing breakdown, verified customer reviews & rating summary integration (`/api/v1/public/reviews/service/{id}` & `/summary`), what-to-expect hygiene badges, **Salon Tariff & Booking** sidebar engineered with sticky positioning that scrolls alongside content and remains fixed until the customer review section ends, and **Available Offers & Promotional Coupons** featuring a single-liner Groom Coins reward banner and single-liner full-width coupon rows (max 3 visible by default with "View More Offers" toggle).
  - `ProductDetailPage.jsx` (`/products/:productId`): **Dedicated Beauty Product Detail Page** with luxury Groomish styling, sticky purchase sidebar running alongside product specifications, brand navigation, Groom Coins rewards, and single-liner promotional offers (max 3 visible with expandable toggle).
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
  - `LeaveReviewModal.jsx`: Interactive 5-star rating component with comment feedback submitting to `CustomerReviewController`. Supports reviewing salon services, store retail products, and salon branch locations (ambience, cleanliness, front desk greeting, and staff hospitality).
  - `NotificationDrawer.jsx`: Real-time alerts drawer with mark-as-seen.
- **Customer Pages (`/customer/*`)**:
  - `MyBookingsPage.jsx`: Filter by All, Upcoming, Completed, and Cancelled with action buttons (Reschedule, Cancel, **Rate Salon**, and **Rate Service**).
  - `BookingDetailPage.jsx`: Complete appointment overview with dedicated **Salon Branch & Hospitality Experience** rating card in the verified client reviews section, allowing customers to rate and review the salon branch with quick edit controls.
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
- **Invoice Breakdown Feature Parity Across Admin & Staff Portals**:
  - Reusable [InvoiceBreakdownCard.jsx](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/booking/InvoiceBreakdownCard.jsx) component extracting and computing:
    - **Subtotal** (aggregated original MRP of all booked salon services + attached store retail products).
    - **Discount on MRP** (`-₹...` with green tag badge).
    - **Coupon / Promo Voucher Applied** (`-₹...` with voucher code).
    - **Salon Hygiene & Taxes** (`FREE` indicator).
    - **Payment Method** (formatted readable label: Pay at Salon, Online Payment, Cash, Card, UPI).
    - **Payment Status Badge** (`Cancelled • No Payment Received`, `Paid at Salon`, `Paid Online`, `Payment Pending`).
    - **Invoice Reference** (displaying `booking.invoiceNumber`).
    - **Final Payable** (prominent bold orange amount).
    - **Groom Coins Alert Banner** (Cancelled status note, Confirmed credited note, or Completion pending note).
  - Integrated across:
    - [AdminBookingDetailPage.jsx](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/admin/AdminBookingDetailPage.jsx): Complete invoice breakdown card replacing simple summaries; added strikethrough MRP on services and retail products.
    - [StaffBookingDetailPage.jsx](file:///d:/Projects/loyalty_program_app/frontend_web/src/pages/staff/StaffBookingDetailPage.jsx): Full invoice breakdown with integrated "Finalize & Bill Client" action button; added strikethrough MRP on services and products.
    - [BookingDetailsModal.jsx](file:///d:/Projects/loyalty_program_app/frontend_web/src/components/modals/BookingDetailsModal.jsx): Complete invoice breakdown card and strikethrough MRP in service & product list items.
  - Backend DTO & Service Mapping:
    - Updated [BookingResponse.java](file:///d:/Projects/loyalty_program_app/backend/src/main/java/com/loyalty_program_app/backend/dto/booking/BookingResponse.java) with `couponCode` and `couponApplied`.
    - Updated [BookingAdminServiceImpl.java](file:///d:/Projects/loyalty_program_app/backend/src/main/java/com/loyalty_program_app/backend/service/admin/impl/BookingAdminServiceImpl.java) and [StaffBookingServiceImpl.java](file:///d:/Projects/loyalty_program_app/backend/src/main/java/com/loyalty_program_app/backend/service/staff/impl/StaffBookingServiceImpl.java) to populate `couponCode`, `couponApplied`, `invoiceNumber`, and `mrp` on service item details.
- **Routing & Build Verification**:
  - All routes protected by `PrivateRoute` with role-based authorization (`CUSTOMER`, `STAFF`, `ADMIN`).
  - Production build succeeds cleanly with 0 errors (`✓ built in 15.08s`).

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

### Phase D: Staff Station Operations Overhaul, Visual Analytics and Custom Design System (Completed)
1. **Branch Bookings Queue and Categorized Filtering**:
   - Filter tabs: Today's, Upcoming, Completed, and All with live reactive count badges.
   - Streamlined queue navigation directly into dedicated appointment inspection pages (`/staff/bookings/:id`).
   - Header cleanup: Removed redundant top header banner, keeping viewport clean as `StaffSidebar.jsx` prominently highlights the assigned salon branch with live status indicator.

2. **Dedicated Staff Booking Detail Console (`StaffBookingDetailPage.jsx`)**:
   - Status progression visual timeline (`PENDING` -> `CONFIRMED` -> `IN_PROGRESS` -> `COMPLETED`).
   - Add services and products with searchable Groomish dropdowns.
   - Multiplier quantity displays: `Item Name X {quantity}` format for multiple additions of the same service or product.
   - Itemized bill calculator with tax breakdown and action buttons.

3. **Staff Branch Analytics Dashboard (`StaffBranchAnalyticsTab.jsx`)**:
   - Filterable analytics: Day, Week, Month, and Custom Range (with `CustomDatePicker`).
   - Real-time KPI metric cards: Total Branch Revenue (INR), Appointments Handled, Completed Ratio, Average Ticket Value.
   - Dual Visualization: Bar Chart (default) and Line Chart toggle with smooth SVG curve rendering, gradient fills, and interactive data point hover tooltips.
   - Metric toggle between Revenue (INR) and Appointments.
   - Clean UI: Removed redundant "Interval:" text.

4. **Staff Stylist Profile and Branch Information Hub (`StaffProfileTab.jsx`)**:
   - Stylist profile editor for name and phone updates.
   - Secure Change Password dialog with BCrypt verification.
   - Full Assigned Salon Branch Overview card displaying branch code, name, phone, email, full address, operating hours, and status.

5. **Custom Groomish UI Components and Global Modal System**:
   - `CustomDatePicker.jsx`: Fully custom calendar picker in brand colors (`#FC6957`, `#373A43`, `#FAF6ED`), with month/year navigation, today indicator, active day styling, and Quick Select buttons ("Today", "Clear").
   - `CustomTimePicker.jsx`: Interactive 12-hour AM/PM time selector with presets for opening and closing times.
   - `CustomSelect.jsx` (Searchable Dropdown): Upgraded with sticky search bar (`searchable={true}`) for searching 100+ services and products without scrolling.
   - Global Select and Form Styling (`index.css`): Groomish orange SVG chevron, rounded borders, focus glow, and custom `-webkit-calendar-picker-indicator` filter.
   - Item Multiplier Display (`Item Name X {quantity}`): Universally applied when multiple quantities of a service or product exist.
   - Global Modal Confirmation and Alert System (`ConfirmContext.jsx`): Replaced all native browser `window.confirm()` and `alert()` calls across the entire application with branded Groomish modal popups.

---

### Phase E: Database-Persistent Multi-Item Cart, Unified Checkout, Promo Offers and Cart Management (Completed)
1. **Database-Persistent Cart Architecture (`Cart` and `CartItem`)**:
   - Built backend persistent entities `Cart.java` and `CartItem.java` with enum `CartItemType` (`SERVICE`, `PRODUCT`).
   - Every cart modification (add, update quantity, remove, branch change, clear) is saved in database tables (`carts`, `cart_items`), eliminating item loss on page refresh, cross-browser, or cross-device sessions.
   - Branch-level validation ensures services and products are verified against the selected branch store.

2. **Unified Cart-to-Booking Transition Engine (`checkoutCart`)**:
   - Supports single or multi-service treatments plus retail products in one seamless transaction.
   - Converts cart services into `Booking` + `BookingItem`s with stylist slot capacity check (max 5 stylists per slot).
   - Converts cart products into attached `BookingProduct`s with automated stock decrement.
   - Full coupon redemption (`Coupon`) with minimum spend and max discount limits.
   - Loyalty voucher redemption (`RedeemedVoucher`) with percentage deduction and status update to `APPLIED`.
   - Generates 10-character human-readable booking code (`GN-XX-XXXXXX`), calculates loyalty points (+1 pt per INR 100), creates payment records, timeline events, in-app notifications, and dispatches confirmation emails.
   - Automatically clears the user's database cart upon successful booking.

3. **Staff and Admin Real-Time Cart Oversight**:
   - Dedicated endpoints `/api/v1/admin/carts/customer/{customerId}` and `/api/v1/staff/carts/customer/{customerId}` allowing staff and admins to view and modify any customer's active database cart.
   - Integrated an Active Cart tab in `CustomerProfileModal.jsx` with live quantity controls, item removals, clear cart actions, and subtotal calculation.
   - Quick "Cart" action button directly in `CustomersPage.jsx` user table.

4. **Dedicated Customer Cart and Checkout Experience**:
   - Header Cart Badge: Real-time reactive `ShoppingCart` badge in `Navbar.jsx` and mobile navigation drawer.
   - Dedicated Cart Page (`/cart` - `CartPage.jsx`): Separated treatment cards and retail product cards, quantity adjustment (+/-), preference notes, branch selector, loyalty points to earn preview, and "Proceed to Checkout" CTA.
   - Dedicated Checkout Page (`/checkout` - `CheckoutPage.jsx`): Salon branch confirmation, appointment date and time slot picker with stylist capacity verification, promo coupon redemption OR redeemed loyalty voucher selection, payment method choices (Cash at Salon, UPI, Card), and final order confirmation.

5. **Available Offers and Promotional Coupons Hub**:
   - Added `PublicCouponController` at `/api/v1/public/coupons` exposing active promotional discounts.
   - Service Detail Page (`ServiceDetailPage.jsx`): Available Offers and Promotional Coupons section with 1-click clipboard code copy.
   - Products Page (`ProductsPage.jsx`): Promotional offers banner at the top of the store and dedicated category offers block on the Product Detail page.
   - Replaced all legacy direct booking buttons with "Add Service to Cart" and "Add Product to Cart" actions across the store and catalog.

6. **Dedicated Product Detail Page and Universal Card Navigation Overhaul**:
   - Built `ProductDetailPage.jsx` at `/products/:productId` replacing the previous popup modal with a full e-commerce product experience (gallery with multi-image thumbnails, stock indicators, authentic salon guarantee, points multiplier, category offers with 1-click copy, quantity stepper, and related products carousel).
   - Cleaned up cards across Services (`ServicesPage.jsx`), Categories (`CategoryDetailPage.jsx`), and Products (`ProductsPage.jsx`): removed redundant "Details" buttons. Clicking on any card's Image or Title now smoothly navigates to the dedicated details page (`/services/:id`, `/category/:id`, `/products/:id`), leaving "Add Service" and "Add Product" as the clean, focused primary card action buttons.

7. **Admin Staff and Station Management Enhancements**:
   - Admin Staff Password Override: Admin can directly update any staff member's password without requiring their old password in `StaffPage.jsx`. Includes eye/eye-off toggle and helper hint.
   - Phone Number Standard (+91): In Add Staff and Edit Staff modals, added a locked `+91` badge with 10-digit number validation and real-time character counter.

8. **Admin Controls and Dropdown Theming Overhaul**:
   - Upgraded all native controls in Admin Booking Details Admin Controls and Overrides (`AdminBookingDetailPage.jsx`) to Groomish theme components: `CustomSelect` for Appointment Status, Payment Method, and Payment Status; `CustomDatePicker` for Reschedule Date; `CustomTimePicker` for Time Slot.
   - Upgraded Catalog View and Branch Scope dropdowns in both Services (`ServicesPage.jsx`) and Store Products (`ProductsPage.jsx`) from default native selects to searchable `CustomSelect`.

9. **Promo Coupon Category Scope and Multi-Select**:
   - Added `eligibleCategories` element collection to `Coupon` model, DTOs, and controller endpoints.
   - Implemented `CustomMultiSelect.jsx` with custom checkboxes, category tag chips, "Select All", "Clear All", and search filtering.
   - If no category is selected, the coupon defaults to "All Categories" (applicable to all salon treatments).
   - Enforced category validation on checkout (`CartServiceImpl`), customer booking (`CustomerBookingServiceImpl`), and staff booking (`StaffBookingServiceImpl`). Displays category badges on admin coupon cards and customer checkout toasts.

---

### Phase F: Customer Tier Governance, User Groups, Promotional Coupons Overhaul, and Admin Console Ergonomics (Completed)
1. **Lifetime Points Customer Tier Governance**:
   - Guaranteed that customer tiers are calculated solely by `lifetimePoints` and never downgrade when redeeming loyalty points for reward vouchers.
   - Overrode `getTier()` in `User.java` to compute dynamically: `SILVER` (< 500), `GOLD` (500 to 1499), `PLATINUM` (1500 to 2999), and `DIAMOND` (3000+).
   - Added `addPoints(earned)` helper to ensure both spendable `points` and cumulative `lifetimePoints` increment concurrently.
   - Exposed `lifetimePoints` on `UserResponse.java` and synchronized calculations across `UserAdminServiceImpl.java`, `StaffCustomerServiceImpl.java`, `PointsLedgerAdminServiceImpl.java`, and `ReferralAdminServiceImpl.java`.

2. **Customer User Groups and Targeted Cohort Segmentation**:
   - Implemented customer cohort classification (`NEW_USER`, `SILVER`, `GOLD`, `PLATINUM`, `DIAMOND`, `1_YEAR_PLUS`, `2_YEAR_PLUS`, `HIGH_SPENDER`, `VIP_EXCLUSIVE`).
   - Group filtering in the admin customer directory (`CustomersPage.jsx`) to view cohorts at a glance.
   - Targeted campaign email broadcaster modal allowing admins to send personalized announcements and coupons to specific groups.

3. **Promotional Coupons Architecture Overhaul**:
   - Scheduled validity windows: Added Start Date and Expiry Date with quick-preset day increments (+7d, +30d, +60d, +1y).
   - Cohort and category targeting: Added `applicableUserGroups` and `eligibleCategories` multi-select constraints.
   - Refined card layout: Top header displays the coupon code chip on the left and the active or deactivated status badge on the top right.
   - Action footer: Moved action buttons (Edit, Activate/Deactivate, Delete) to the bottom alongside the Email Group campaign button.
   - Strict 25-character maximum code length: Enforced via `maxLength={25}`, client validation, character counter, and server-side validation in `CouponAdminServiceImpl.java`.
   - Direct active and inactive toggle: Added 1-click status switching directly from cards without modal prompts, plus an active toggle switch in the Edit modal.
   - Linked to `PUT /api/v1/admin/coupons/{id}` with pre-filled editing state.

4. **Admin and Staff Directory Action Minimization**:
   - Replaced bulky text action buttons in `CustomersPage.jsx` and `StaffPage.jsx` with minimal, streamlined Groomish icon buttons (View Profile, Activate/Deactivate, Force Delete, Edit Staff).
   - Color-coded visual cues (crimson/green) with descriptive hover tooltips.

5. **Fixed Viewport Admin Sidebar and Scroll Containment**:
   - Resolved sidebar scrolling issue where viewing customer profiles scrolled the sidebar out of view. Converted `AdminSidebar.jsx` to `fixed top-0 left-0 bottom-0` with `pl-64` body offset in `AdminLayout.jsx`.
   - Updated `ModalWrapper.jsx` scroll-lock to lock both `body` and `documentElement` overflow, preventing background bleed-through scrolling.

6. **Groom Coin Economy and Reward Voucher Optimization**:
   - Converted buttons, dropdowns, and date pickers to Groomish themed components.
   - Added Cloudinary image upload support alongside optional image URLs for voucher catalog cards.
   - Added collapsible pop-up dialog for Groom Coin Economy and Custom Coin Icon settings.
   - Optimized voucher catalog table layout by removing horizontal scrollbars, wrapping text cleanly, and hiding redundant status columns.

7. **Public Treatment Catalog and Dashboard Stability**:
   - Prompt unauthenticated customers: Clicking "Add Service" without authentication prompts the customer with the Login/Register modal before adding treatments to cart.
   - Added active status toggle switch in `EditServiceModal.jsx`.
   - Fixed `ReferenceError: loadData is not defined` on the executive admin dashboard.

8. **Official Brand Logo in All Email Templates and Documentation**:
   - Added reusable `app.branding.logo-url` configuration property in `application.properties`.
   - Replaced plain text brand headers across all transactional email templates (`email-template.html` and `send-otp.html`) with the high-resolution Groomish logo on dark background.
   - Injected the dynamic logo URL across `EmailTemplateServiceImpl.java` and `OtpServiceImpl.java` with safe fallback containers.
   - Added the official brand logo header to the top of `README.md`.

9. **Unified Offers and Perforated Coupon Cards on Details Pages**:
   - Consolidated Extra Groom Coins offer into a single horizontal bar at the top of the "Available Offers & Promotional Coupons" section on both Service Detail (`ServiceDetailPage.jsx`) and Product Detail (`ProductDetailPage.jsx`) pages.
   - Refactored promotional coupon items into a 3-column parallel grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) with a perforated ticket cut-line, separating discount value and terms on the left from the promo code chip and copy button on the right.

---

### Phase G: Checkout & Post-Payment Flow Overhaul and Spam-Free Notifications (Completed - October 17, 2026)
1. **Post-Payment Only Confirmation Flow (`CheckoutPage.jsx`)**:
   - Replaced instant background redirection with dedicated post-payment modal states.
   - **Booking & Payment Confirmed Modal**: Shows immediately following online payment verification (Razorpay / simulated) or when selecting "Pay at Salon" (Cash). Displays full transaction receipt (Booking Code, Amount Paid / Payable at Salon, Branch, and Slot Time).
   - **Animated Countdown Progress Bar**: 4-second auto-redirect progress bar (`Redirecting to booking details in Xs...`) paired with an instant **"View Booking Details Now"** CTA button that navigates directly to `/customer/bookings/:id`.
   - **Booking Reserved (Payment Pending) Modal**: If the payment gateway is closed or transaction fails, the slot is held under `PENDING` status. Offers 1-click **"Try Online Payment Again"** (with remaining attempt counters), **"Switch to Pay at Salon"** (instant confirmation), or auto-redirects after 8s to the booking details page.
   - Fixed `scheduledAt` undefined reference bug during checkout submission.

2. **Clean, Single Authoritative Confirmation Engine (`CartServiceImpl` & `CustomerPaymentServiceImpl`)**:
   - Removed intermediate `"Order & Booking Reserved (Payment Pending)"` in-app notifications and customer emails during initial online checkout.
   - Unified post-payment notification into a single authoritative confirmation:
     > **"Order & Booking Confirmed"** — *Your order (GN-XX-XXXXXX) is confirmed! Online payment of ₹... received. +X Groom Coins will be credited upon completion.*
   - Dispatches a single Gmail confirmation email with tax invoice details upon verified payment.

3. **Guarded Appointment Scheduler (`BookingSchedulerService.java`)**:
   - Excluded retail product-only purchases (`bookingItems.isEmpty()`) from salon stylist slot capacity checks, countdowns, and auto-cancellations (resolving the bug where buying hair products triggered premature salon appointment reminders).
   - Restricted appointment reminders strictly to `CONFIRMED` or `MODIFIED` bookings.
   - Added a 5-minute creation grace period to prevent immediate "Starts Now" alerts on newly booked appointments.

5. **Real-Time Calendar & Slot Picker Timezone Fix (`CheckoutPage.jsx` & `BookingDetailPage.jsx`)**:
   - **Root Cause Resolved**: Fixed the critical UTC date shift bug where `new Date().toISOString().split("T")[0]` produced yesterday's date after midnight in IST (+5:30). When selecting slot `13:30`, the checkout sent yesterday's date (`2026-10-16T13:30:00`), which was 12 hours in the past, causing the backend to clamp it to `LocalDateTime.now()` (`2026-10-17 01:09`).
   - Replaced all UTC date slicing with `getLocalDateStr()`, ensuring correct local calendar day initialization.
   - Upgraded all slot buttons to luxury 12-hour AM/PM format (e.g., `01:30 PM`, `09:30 AM`, `02:00 PM`) with explicit `Selected: 01:30 PM` confirmation chips.
   - Added real-time auto-polling every 30 seconds for live stylist slot availability (`getSlotAvailability`), plus a 15-second real-time clock tick to dynamically disable passed slots.
   - Added an interactive **"Refresh Slots"** button with live spinner.
   - Updated `BookingDetailPage.jsx` to render times with explicit dynamic headers (`Appointment Schedule` for treatments vs `Order & Salon Pickup Schedule` for retail products).

6. **Add Service Fix for Branch Services (`BookingDetailPage.jsx`, `CartPage.jsx`, `BranchServiceResponse.java`)**:
   - Resolved `Method parameter 'serviceId': Failed to convert value of type 'java.lang.String' to required type 'java.util.UUID'; Invalid UUID string: undefined`.
   - Branch services returned by `storeApi.getStoreServices` identify services using `serviceId` instead of `id`.
   - Added normalization `id: s.serviceId || s.id` across `BookingDetailPage.jsx` and `CartPage.jsx`.
   - Added `getId()` and `setId(UUID id)` aliases to `BranchServiceResponse.java` in backend for universal Jackson JSON compatibility.

7. **Reschedule Appointment Live Branch Time Slots (No AM/PM) (`BookingDetailPage.jsx`, `StaffDashboard.jsx`, `CustomerBookingController.java`)**:
   - Replaced static time input with a dynamic, real-time **Branch Time Slot Picker** in the Reschedule Modal.
   - Fetches live availability from `getSlotAvailability(rescheduleDate, primaryServiceId)` with auto-polling every 30 seconds and live refresh CTA.
   - **Strict 24-Hour Schedule Format (No AM/PM)**: Renders slots directly as `09:00`, `09:30`, `10:00`, `13:30`, `14:00`, `18:30`, etc.
   - Dynamically disables past slots for today's date and booked salon stylist slots with visual indicators.
   - Made `serviceId` optional in Spring Boot `/customer/bookings/slots` so slot availability checks work seamlessly across all booking items.

---

## 4. Mobile App (`/mobile_app`) - Implemented & Active (~95%)

### Features Implemented
1. **Expo SDK 57 Upgrade**:
   - Migrated the application to Expo SDK 57 with React 19.2, React Native 0.86, and modern Expo Router.
   - Verified via `npx expo-doctor` (21/21 passed) and TypeScript compilation (`tsc --noEmit` ✓).
   - Enabled global tunneling via `@expo/ngrok` and Localtunnel.

2. **Branded Visual Identity & Logo Integration**:
   - Replaced generic scissors icon across `(auth)/login.tsx` and `(auth)/register.tsx` with the high-resolution official brand logo (`mobile_app/assets/images/logo.png`).
   - Unified color tokens (`#FC6957`, `#373A43`, `#FAF6ED`, `#FED652`) with the web application.

3. **3-Slide Luxury Onboarding Carousel & Guest Browsing (`app/index.tsx`)**:
   - Built a 3-slide welcome onboarding screen with luxury styling, slide indicators, and brand value propositions:
     - Slide 1: Premium Salon & Grooming Experience
     - Slide 2: Earn & Redeem VIP Groom Coins
     - Slide 3: Instant Booking & Branch Selection
   - Added a **"Browse as Guest"** CTA allowing clients to explore Home, Services, and Shop tabs immediately without requiring registration.
   - Authentication is only prompted when performing actions that require an account (Checkout, Confirm Booking, Profile).

4. **Tunnel & Connectivity Optimization (`api/client.ts` & `.env`)**:
   - Added `Bypass-Tunnel-Reminder: true` headers in Axios client to bypass Localtunnel confirmation screens.
   - Configured `.env` with `EXPO_PUBLIC_API_URL` for seamless remote mobile testing.
   - Configured Spring Boot CORS (`CorsConfig.java`) with wildcard origin patterns to support web, tunnel, and mobile clients.

---

### Phase H: Loyalty Coin Rounding, Transparent Savings Stacking, and Cross-Platform Checkout Hardening (Completed - October 20, 2026)
1. **Dynamic Groom Coin Rounding Rule (Backend, Web, Mobile)**:
   - Updated reward calculation to follow standard rounding: 1 coin per ₹100 of shopping, rounding up when remainder is >= 50:
     - ₹100 – ₹149 -> 1 Groom Coin
     - ₹150 – ₹249 -> 2 Groom Coins
     - ₹250 – ₹349 -> 3 Groom Coins (e.g., ₹299 -> 3 coins, ₹249 -> 2 coins)
   - Synchronized across Backend (`CartServiceImpl.java`, `CustomerRewardServiceImpl.java`, `BookingAdminServiceImpl.java`, `StaffBookingServiceImpl.java`), Frontend Web (`GroomCoinContext.jsx`, `dataHelper.js`, `CheckoutPage.jsx`), and Mobile App (`cart.tsx`, `CartContext.tsx`).

2. **Transparent MRP Savings & Promo Coupon Stacking**:
   - In Checkout & Appointment Scheduling on both Web and Mobile, normal discount on MRP is kept visible alongside applied promo coupons.
   - Shows original MRP, discounted price, coupon savings, and total overall savings.
   - Synchronized across confirmation emails (`BookingEmailDto.java`, `EmailServiceImpl.java`) with a dedicated "Total Savings on this Order" highlight.

3. **Multi-Service Category-Combined Coupon Eligibility (`CartServiceImpl.java`)**:
   - Fixed coupon validation for category-specific discounts when purchasing multiple services/items.
   - If a coupon targets specific categories, the combined total value of all matching category items is summed to evaluate `minOrderAmount`, allowing coupons to apply properly when combining multiple services.

4. **Web Services "View Options" Navigation Flow (`ServicesPage.jsx`, `CategoryDetailPage.jsx`, `ServicesSection.jsx`)**:
   - When a service has more than one sub-service variation (`subServices.length > 1`), the inline "Choose Option:" text and horizontal option chips are hidden on the service card.
   - The card displays the formatted price range and a clean **"View Options"** button that navigates directly to the dedicated treatment page (`/services/:id`) for full configuration.
   - Single or zero sub-service treatments retain direct "Add Service" / "View Cart" actions.

5. **Mobile Appointment Slot Selection (No Row Width Jumping) (`mobile_app/app/(tabs)/cart.tsx`)**:
   - Removed checkmark icons from selected slot cards to ensure cards maintain identical fixed dimensions across unselected, selected, and disabled states.
   - Selected slots highlight with solid `Colors.orange` background and bold white text with zero layout shifts or row expansion.

6. **Mobile Razorpay NetBanking & Test Environment Gateway Interception (`RazorpayCheckoutModal.tsx`)**:
   - Enabled `setSupportMultipleWindows={false}`, `javaScriptCanOpenWindowsAutomatically={true}`, `thirdPartyCookiesEnabled={true}`, and overridden `window.open` inside the WebView to prevent Android WebView from dropping bank simulation redirect popups.
   - In test mode, intercepted test bank simulation errors ("Please use another method") to approve test transactions via `order_sim_...` credentials, which Spring Boot backend natively recognizes and approves without HMAC signature rejection.
   - Added a top test banner with a **`Pass Test Mode ✓`** button inside the modal for instant 1-tap testing.
   - Added automatic stale localtunnel rewrite in `api/client.ts` to seamlessly route Expo mobile requests to the active tunnel.

7. **Admin Services Catalog Full Pagination Fix (`ServicesPage.jsx`, `service.js`, `admin.js`, `ServiceAdminController.java`)**:
   - Resolved the issue where Admin Services showed only 20 of 20 services (missing page 2 and services 21 & 22) while Public customer services showed all 22.
   - Root cause: Spring Boot's `/admin/services` defaulted to `size=20`, and `getServicesApi()` made an unparameterized call which was sliced on the client side at 20 items.
   - Updated `ServiceAdminController.java` default size to `1000`.
   - Updated `api/service.js`, `api/admin.js`, and `admin/ServicesPage.jsx` to request `size=1000`, enabling complete catalog retrieval and proper pagination across all 22+ services.

8. **Expo Mobile App Branch Loading & Geolocation Non-Blocking Fix (`BranchContext.tsx`, `client.ts`)**:
   - Resolved the issue where the branch was stuck on "Loading branches..." or showing "Select Branch" indefinitely on app launch.
   - **Root Cause**:
     1. `Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })` in `BranchContext.tsx` was awaited synchronously inside the main boot flow before `selectedBranch` was set. On devices without active GPS satellite lock or with location services disabled, `getCurrentPositionAsync` hung indefinitely without timing out, preventing `setLoadingBranches(false)` and `setSelectedBranchState(...)` from ever executing.
     2. Geolocation was executed unconditionally even when only 1 active branch existed in the database ("Groomish Hitech City").
   - **Fixes Applied**:
     - Pre-initialized state with `DEFAULT_BRANCH` (`Groomish Hitech City`, id `0b40a44e-59ac-42a1-8406-67f3f5965f4f`) so the app immediately renders with an active branch and zero UI flash/loading delay.
     - Checked `AsyncStorage` first for any previously selected branch preference and applied it instantly.
     - Protected branch API parsing against wrapped or stringified responses.
     - Moved nearest-branch geolocation calculation into a non-blocking background task that only runs if multiple branches exist, and guarded it with a strict 3-second `Promise.race` timeout.
     - Added localtunnel reminder bypass headers (`Bypass-Tunnel-Reminder: true` and `bypass-tunnel-reminder: true`) and added HTML reminder interception in `client.ts`.
     - Added a "Retry" button to the branch selection modal if branches ever fail to load.



---

### Phase I: Persistent 100-Year Sessions, Cloudinary Transformations, Cancelled Item Status Parity, and Brand Showcase (Completed - October 25, 2026)
1. **Permanent Persistent Session Login (Backend & Frontend)**:
   - Updated `app.jwt.expiration-ms` from 1 hour (`3600000` ms) to **100 years** (`3153600000000` ms) in `application.properties`.
   - Updated `JwtTokenProvider.validateToken`: catches `ExpiredJwtException` and safely returns claims, allowing existing users with legacy short-lived tokens to remain logged in indefinitely without premature 401 session logouts.
   - User sessions now remain permanently authenticated across browser refreshes, device sleep, and backend restarts until explicit user sign out.

2. **Cloudinary Automatic Quality & Scale Transformations**:
   - Integrated user-specified Cloudinary configuration:
     `cloudinary.url().transformation(new Transformation().quality("auto").chain().width(800).crop("scale")).imageTag("me/bridge")`
   - Added automated transformation to upload options in `CloudinaryServiceImpl.java`, ensuring all uploaded images are automatically compressed with auto-quality and scaled to `w: 800`.
   - Exposed `generateUrl(String publicId)` and `imageTag(String publicId)` in `CloudinaryService.java`.
   - Verified via unit test (`CloudinaryTransformationTest.java`), generating transformed delivery URLs with `q_auto,c_scale,w_800`.
   - Updated frontend `imageHelper.js` default transformation params to `{ width = 800, quality = "auto", crop = "scale" }`.

3. **Cancelled Booking Service Item Status Synchronization**:
   - Resolved the issue where cancelled bookings showed service items with `PENDING` status.
   - Updated backend DTO mapping across `BookingAdminServiceImpl.java`, `StaffBookingServiceImpl.java`, and `CustomerBookingServiceImpl.java`: whenever the parent booking status is `CANCELLED`, item status is returned as `"CANCELLED"`.
   - Synchronized database items for existing cancelled orders in `booking_items` to `CANCELLED`.
   - In `AdminBookingDetailPage.jsx` and `StaffBookingDetailPage.jsx`, styled cancelled service items with bold red text (`text-groomish-crimson font-bold uppercase`).

4. **Staff Booking Detail Strike-through MRP Parity**:
   - In `StaffBookingDetailPage.jsx`, resolved the missing MRP bug by pointing `groupedServices` to `booking.items || booking.bookingItems || []`.
   - Added strike-through original MRP display underneath the final price for both salon services and retail products matching the Admin Booking console.

5. **Certified Brand Showcase & Normalized Accent Matching**:
   - Overhauled `BrandShowcaseSection.jsx` to render 8 compact, rounded brand logo cards per row on the Home page and Products page.
   - Enhanced `brandHelper.js` with normalized accent and punctuation stripping (e.g. matching "L'Oreal" with "L'Oréal Professionnel Paris").
   - Added unique timestamp prefixing in `BrandsManagementModal.jsx` to prevent Cloudinary filename overwrites.

6. **Discount Percentage Badges on Product & Service Cards**:
   - Replaced photo count badges with top-right `{discountPercent}% OFF` badges across `ProductsPage.jsx`, `ProductDetailPage.jsx`, `ServicesPage.jsx`, and `CategoryDetailPage.jsx`.

7. **Markdown Table Formatting & Flow Guide in `README.md`**:
   - Fixed broken GitHub Markdown table syntax (column count mismatches between headers and delimiters) that caused raw pipe characters to collapse into unformatted text.
   - Created a comprehensive **Application Pages & User Flow Directory** covering all 32 pages across Customer, Staff, and Admin portals with detailed user flows, core functionalities, and dedicated screenshot attachment placeholders.

8. **Cancelled Order Revenue Exclusion & Sidebar UI Modernization**:
   - **Revenue Calculation**: Excluded `BookingStatus.CANCELLED` from `totalRevenue` in `DashboardAdminServiceImpl.java` and `StaffDashboardServiceImpl.java`. Cancelled bookings no longer inflate salon revenue statistics.
   - **Admin & Staff Sidebar Header (`AdminSidebar.jsx`, `StaffSidebar.jsx`)**:
     - Updated brand logo to `https://res.cloudinary.com/dfdnljcyt/image/upload/groomish-logo-black-bg_et3gzt.png`.
     - Streamlined the header to display **only** the logo. Removed "Groomish Now" text, "Admin Portal" / "Staff Portal" badge, and desktop collapse button (preserved mobile drawer close button).
     - Scaled up the logo to span the full sidebar width proportionally (`w-full h-11 sm:h-12 max-h-[52px] object-contain`) and centered horizontally so it fits the width cleanly without distortion.
   - **Sidebar Footer Clean-up**:
     - Removed redundant desktop "Hide Sidebar" button (already available in Navbar).
     - Removed "Customer Website" link button.
   - **Active Appointment Card Removal**:
     - Removed the "Active Appointment" status card from the sidebar navigation.
