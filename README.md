# Salon Booking Application  

## Tech Stack

- **Backend:** Spring Boot
- **Database:** PostgreSQL
- **Image Storage:** Cloudinary (Upgrade to AWS S3 for better performance)
- **Web Framework:** React
- **Mobile Framework:** React Native



## Overview

This application is a **complete salon management + loyalty rewards system** that includes:

- Customer authentication & profile  
- Service browsing  
- Booking system
- Review & Comments
- Points & rewards system  
- Referral system  
- Admin panel 
- Staff management
- Push notifications
- Payment gateway
- Full analytics

## System Architecture

Client (React/React Native) <--HTTP & Rest API--> Backend (Spring Boot) <--Database--> PostgreSQL

## Functionality
**Guest :**
- Browse services
- View service details
  
**Customer :** 
- Register/Login (Tagged as REGISTERED_BY_SELF)
- Browse services
- View service details
- Book service (Tagged as BOOKED_BY_SELF)
- Modify booking (Tagged as MODIFIED_BY_SELF)
- View booking history
- View rewards
- View/Edit/Deactivate Profile (Tagged as MODIFIED_BY_SELF)
- View Tier Details
- View Referral Code
- View Referral History
- View Payment History
- View Notifications
- Logout
  
**Staff :**
- Register/Login
- Browse services
- View service details
- Register new Customer (Tagged as REGISTERED_BY_STAFF - Staff Name) //To Track who registered
- Book service for Customer (Tagged as BOOKED_BY_STAFF - Staff Name) //To Track who booked
- Modify booking for Customer (Tagged as MODIFIED_BY_STAFF - Staff Name) //To Track who modified
- View booking history for Customer
- View/Edit/Deactivate Profile for Customer (Tagged as MODIFIED_BY_STAFF - Staff Name)
- View Tier/Reward Points/Referral/Payment Details for Customer
- Logout
  
**Admin :**
- Register/Login
- Register new Admin/Staff/Customer
- View/Edit/Deactivate Profile for Admin/Staff/Customer (Tagged as MODIFIED_BY_ADMIN - Admin Name)
- Add/Edit/Delete Services
- Add/Edit/Delete Categories 
- Add/Edit/Delete Coupons=
- View Tier/Reward Points/Referral/Payment Details for Customer
- View Payment History for Customer
- View Notifications for Customer
- View Booking History for Customer
- Add/Edit/Delete Banners/Offer Cards
- Logout

---

## Database Entities & Relationships

Below is the full list of entities with fields.

---

**User :** Represents both ADMIN, STAFF and CUSTOMER.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String |
| email | String | Unique |
| password | String | Hashed |
| phone | String |
| image | String | URL |
| gender | Enum | MALE / FEMALE / NOT_SPECIFIED |
| dob | DateTime |
| role | Enum | ADMIN / STAFF / CUSTOMER |
| points | Integer |
| tier | Enum | SILVER, GOLD, PLATINUM |
| referralCode | String | Unique |
| createdBy | UUID | Foreign key (User) |
| updatedBy | UUID | Foreign key (User) |
| active | boolean |
| lastLoginAt | DateTime |
| createdAt | DateTime |

---

**Category :** Represents salon categories.
e.g. Hair Care, Facial & Skin Care, Grooming & Hair Removal, Nails, Make Up & Bridal, Spa & Wellness. 

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String |
| description | String |
| image | String | URL |
| active | boolean |
| createdAt | DateTime |

---

**Service :** Represents salon services.
e.g. Haircut, Beard Trim, Facial, Spa, Manicure, Pedicure
While creating a service, Admin has to select a category.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | String |
| categoryId | UUID | Foreign key (Category) |
| image | String | URL |
| description | String |
| gender | Enum | MALE / FEMALE / UNISEX |
| mrp | Double |
| price | Double |
| rewards | Integer | earn points on booking
| durationMinutes | Integer |
| active | boolean |
| createdAt | DateTime |

---

**Coupon :** Coupons can be created by Admin and can be applied while booking for discount.
eg. NEW10 (For New Customers 10% Discount), HBDAY200 (For Happy Birthday Flat Rs.200 Discount)

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| code | String | Unique |
| description | String | Detailed description with terms and conditions
| minAmount | Double |
| maxDiscount | Double |
| discount | Double |
| expiryDate | DateTime |
| active | boolean |
| createdAt | DateTime |

---

**Payment :** Payment gateway.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| invoiceNumber | String |
| userId | UUID | Foreign key (User) |
| amount | Double |
| paymentMethod | Enum | CASH, UPI, CARD, VOUCHER |
| paymentModeDetails | String | (UPI ID / Card last digits) |
| status | Enum | PENDING, COMPLETED, FAILED |
| paymentGatewayId | String |
| createdAt | DateTime |

---

**BookingItem :** Items in a booking.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| bookingId | UUID | Foreign key (Booking) |
| serviceId | UUID | Foreign key (Service) |
| serviceNameSnapshot | String | Service price may change in the future, so we need to keep a snapshot
| servicePriceSnapshot | Double |
| serviceDurationSnapshot | Integer |
| status | Enum | PENDING, CONFIRMED, COMPLETED, CANCELLED, MODIFIED, REFUNDED |
| createdAt | DateTime |

**Booking :** Represents a customer booking.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Foreign key (User) |
| paymentId | UUID | Foreign key (Payment) |
| couponId | UUID | Foreign key (Coupon) |
| scheduledAt | DateTime |
| totalAmount | Double |
| pricePaid | Double |
| status | Enum | PENDING, CONFIRMED, COMPLETED, CANCELLED, MODIFIED, REFUNDED |
| note | String |
| bookedBy | String | BOOKED_BY_STAFF, BOOKED_BY_SELF, MODIFIED_BY_STAFF |
| cancelledAt | DateTime |
| completedAt | DateTime |
| createdAt | DateTime |

---

**Reward :** Rewards customers can redeem.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| title | String |
| image | String | URL |
| description | String |
| pointsRequired | Integer |
| stock | Integer |
| expiryDate | DateTime |
| active | boolean |
| createdAt | DateTime |

---

**PointsLedger :** Tracks points earn/redeem.

| Field | Type |Description |
|-------|------|-------------
| id | UUID | Primary key |
| userId | UUID | Foreign key (User) |
| changeAmount | Integer | +earn / -redeem |
| reason | Enum | WELCOME_BONUS / BOOKING_COMPLETED / BOOKING_REFUND / REWARD_REDEEM / REFERRAL_BONUS / ADMIN_ADJUST / SYSTEM_ADJUST / GIFT |
| relatedId | UUID (optional) | Foreign key (Booking / Reward / Referral) | 
| createdAt | DateTime |

---

**Referral :** Tracks referral system.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| referrerId | UUID | Foreign key (User) |
| referredId | UUID | Foreign key (User) |
| rewardGiven | boolean |
| pointsLedgerId | UUID | Foreign key (PointsLedger) |
| createdAt | DateTime |

---

**Service Review :** Customer reviews.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Foreign key (User) |
| serviceId | UUID | Foreign key (Service) |
| rating | Integer |
| review | String |
| createdAt | DateTime |

**Notification :** Push notifications.

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | Foreign key (User) |
| title | String |
| message | String |
| type | Enum | BOOKING, PAYMENT, OFFER, SYSTEM |
| seen | boolean |
| createdAt | DateTime |

---




## Authentication APIs

- **POST :** `/auth/register`
- **POST :** `/auth/login`

Returns:
```json
{
  "userId": "uuid",
  "email": "customer@email.com",
  "name": "User Name",
  "accessToken": "JWT_TOKEN"
}
```

ADMIN API DOCUMENTATION

Base Path: /api/v1/admin

📌 SERVICES
Method	Endpoint	Description
GET	/services	List all
POST	/services	Create
PUT	/services/{id}	Update
DELETE	/services/{id}	Delete

Payload:

{
  "name": "Haircut",
  "description": "Basic Cut",
  "mrp": 150,
  "price": 99,
  "durationMinutes": 30
}

🎁 REWARDS
Method	Endpoint
GET	/rewards
POST	/rewards
PUT	/rewards/{id}
DELETE	/rewards/{id}
📅 BOOKINGS
Method	Endpoint	Description
GET	/bookings	List all
GET	/bookings/{id}	Single booking
DELETE	/bookings/{id}	Remove booking
PUT	/bookings/{id}	Update booking
PUT	/bookings/{id}/status?status=CONFIRMED	
🔍 Filter API

GET /bookings/filter?keyword=&status=&fromDate=&toDate=

🧍‍♂️ CUSTOMERS
Method	Endpoint
GET	/customers
GET	/customers/{id}
DELETE	/customers/{id}
GET	/customers/search?keyword=

Returns:

{
  "id": "uuid",
  "name": "John",
  "email": "john@gmail.com",
  "phone": "1234567890",
  "totalBookings": 3,
  "totalSpent": 500
}

👤 CUSTOMER API DOCUMENTATION

Base Path: /api/v1

⭐ Points

| GET | /points/balance |
| GET | /points/ledger |

🎁 Rewards

| GET | /rewards |
| POST | /rewards/{id}/redeem |

🛠️ Services

| GET | /services |
| GET | /services/{id} |

📅 Bookings

| POST | /bookings |
Create:

{
  "serviceId": "uuid",
  "scheduledAt": "2025-11-20T14:00",
  "note": "Keep short"
}


| GET | /customer/bookings |
| GET | /customer/bookings/{id} |
| DELETE | /customer/bookings/{id} |

👤 Profile

| GET | /users/me |
| PUT | /users/me |

🎟️ Referrals

| GET | /referrals/me |

🧱 Backend Folder Structure
/backend
 ├─ controller
 ├─ service
 ├─ service/impl
 ├─ model
 ├─ dto
 ├─ repository
 ├─ security
 ├─ enums
 ├─ advice (exception handler)
 ├─ application.properties

🎨 Frontend Structure (React + Vite)
src/
 ├─ pages/
 │   ├─ auth/
 │   ├─ admin/
 │   ├─ customer/
 ├─ api/
 ├─ components/
 ├─ auth/
 ├─ context/
 ├─ index.css
 ├─ App.jsx

📈 Future Feature Extensions

You can later add:

🚀 1. Staff Management

Staff entity

Staff-service mapping

Staff availability

Staff assignment to booking

💳 2. Payments Integration

Razorpay

UPI

Cash register

🏆 3. Loyalty Levels

Silver / Gold / Platinum

Level-based discounts

📢 4. Notification System

Email

SMS

WhatsApp

🛍️ 5. Combo Packages

Service bundles

Package discounts
