# **MASTER PROMPT – La Grande Marque Shipping Admin System (Enterprise Full-Stack Web Application)**

Design and develop a **premium, enterprise-grade, full-stack Shipping & Logistics Administration System** for **La Grande Marque**, a shipping company operating between **Madagascar** and **Mauritius**.

The system is **for internal company staff only** and should provide an exceptional user experience comparable to modern enterprise platforms such as **Stripe Dashboard, Linear, Notion, Vercel, DHL, FedEx, UPS, and Maersk**.

The application should be visually stunning, highly responsive, secure, scalable, and production-ready. Every page should feel professionally designed with excellent spacing, typography, animations, and usability.

---

# General Design Requirements

The overall design should follow a **modern logistics brand identity**.

Theme:

* Premium White
* Deep Navy Blue
* Royal Blue
* Gold Accent
* Light Gray backgrounds

Color Palette

Primary

* #2563EB

Dark Navy

* #0F172A

Secondary Navy

* #1E3A8A

Gold Accent

* #D4AF37

Background

* #F8FAFC

White

* #FFFFFF

Success

* #22C55E

Warning

* #F59E0B

Danger

* #EF4444

Muted Text

* #64748B

Borders

* #E2E8F0

Typography

Use Inter font throughout.

Large bold headings.

Comfortable spacing.

Minimalistic.

Rounded corners.

Beautiful shadows.

Modern enterprise styling.

---

# Technical Stack

Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS
* shadcn/ui
* Framer Motion
* Lucide React Icons

Backend

* Node.js
* Express.js

Database

* Supabase PostgreSQL

Authentication

* Supabase Authentication

Storage

* Supabase Storage

PDF

* Server-side PDF generation

Deployment

* Vercel
* Render
* Supabase

---

# Authentication

Create a premium login experience.

Include

* Email
* Password
* Show/Hide Password
* Remember Me
* Forgot Password
* Loading states
* Error handling
* Secure authentication
* Session timeout
* Role-based authentication
* Audit logging

After login

Redirect to Dashboard.

---

# Dashboard

The dashboard should immediately provide business insights.

Top Summary Cards

* Total Shipments Today
* Total Shipments This Month
* Total Revenue
* Pending Shipments
* Delivered Shipments
* Customers
* Total Weight Shipped
* Loyalty Rewards Issued

Cards should contain

* Beautiful icons
* Percentage increase/decrease
* Mini trend graphs
* Hover animation

Charts

* Monthly Shipments
* Revenue Trends
* Top Commodity Categories
* Shipment Status Distribution
* Customer Growth
* Loyalty Redemption Statistics

Recent Activity

Display

* Latest customers
* Latest shipments
* Latest payments
* Recently delivered shipments

Quick Actions

* New Shipment
* Register Customer
* Generate Report
* Add Commodity
* Settings

Notifications Panel

Display

* Pending deliveries
* Failed payments
* Loyalty rewards achieved
* Recent admin activities

---

# Sidebar

Modern collapsible sidebar.

Include icons.

Dashboard

Customers

Shipments

Commodity Categories

Reports

Receipts

Loyalty Program

Audit Logs

Settings

Profile

Logout

Active menu highlighted.

Smooth transitions.

---

# Admin Profile

Every admin has a profile.

Include

Profile Photo

First Name

Last Name

Email

Phone Number

Role

Department

Date Joined

Last Login

Password Management

Profile Settings

Notification Preferences

Dark Mode Preference

Change Password

Upload Profile Picture

Remove Profile Picture

Edit Personal Information

View Login History

---

# Customer Management

Customer List

Display

Profile Avatar

Full Name

Phone Number

Email

Address

Total Shipments

Total KG

Current Loyalty Progress

Status

Registration Date

Powerful Search

Filters

Pagination

Sorting

Bulk Actions

Export

---

# Customer Details Page

When an admin clicks on any customer,

Open a beautiful customer profile page.

Display

Large profile avatar

Customer name

Phone number

Email

Full address

Alternative address

Notes

Registration date

Last shipment

Total shipments

Total KG sent

Current loyalty progress

Current free KG earned

Favorite shipment category

Payment history

Recent activity

Shipment statistics

Loyalty progress bar

Recent shipments table

Previous shipments table

Each shipment should display

Tracking Number

Shipment Date

Commodity

Weight

Quantity

Status

Payment Status

Destination

Receipt

Actions

Admin can

Edit customer

Delete customer

Create shipment

Generate report

Print profile

Download shipment history

---

# Shipment Management

Beautiful data table.

Search.

Advanced Filters.

Status badges.

Create Shipment

Customer selection

Quick customer search

Quick customer creation

Commodity category

Weight

Quantity

Insurance

Special instructions

Origin

Destination

Pickup Date

Expected Arrival

Payment Method

Payment Status

Shipment Status

Generate tracking number automatically.

Timeline

Pending

Packed

Ready

Loaded

In Transit

Arrived

Ready for Pickup

Delivered

Cancelled

Each shipment should have

Shipment Details page.

Shipment Timeline.

Receipt.

Customer Information.

Payment History.

Internal Notes.

Edit History.

---

# Commodity Categories

Beautiful cards.

Category icon.

Description.

Handling instructions.

Hazard indicators.

Edit.

Delete.

Search.

---

# Loyalty Program

Automatic calculations.

Rule

Every configurable KG earns configurable free KG.

Dashboard

Current Progress

Progress bars

Reward History

Upcoming Rewards

Redemption History

Visual analytics

---

# Receipts

Generate professional PDF.

Include

Company logo

Customer information

Tracking number

Weight

Destination

Commodity

Payment information

Shipment status

Barcode

QR Code

Company contacts

Footer

Admin Signature

Watermark

Receipt Number

Buttons

Download PDF

Print

Send via WhatsApp

Preview

---

# WhatsApp Integration

Generate WhatsApp message automatically.

Include

Customer Name

Tracking Number

Weight

Destination

Receipt Link

Company Contact

Open WhatsApp Web automatically.

---

# Reports

Professional reporting dashboard.

Filters

Date

Customer

Category

Status

Weight

Revenue

Export

CSV

PDF

Excel

Charts

Summary Cards

---

# Notifications

Real-time notification center.

Shipment delivered

Customer registered

Payment received

Reward issued

Admin login

Unread counter

Mark all as read

---

# Audit Logs

Track every admin activity.

Login

Logout

Customer edits

Shipment edits

Deleted records

Settings changes

Searchable

Filterable

---

# Settings

Company Information

Company Logo

Company Name

Phone Numbers

Email

Address

Operating Routes

Madagascar ↔ Mauritius

Loyalty Configuration

Tax

Payment Methods

Receipt Settings

Theme

System Preferences

Backup Options

---

# Security

HTTPS

Rate Limiting

CSRF Protection

Input Validation

XSS Protection

SQL Injection Prevention

Secure Sessions

Password Hashing

Role Authorization

Server-side Validation

API Authentication

Automatic Logout

---

# Responsiveness

Desktop

Tablet

Mobile

Every page must be fully responsive.

Tables should become responsive cards on mobile.

Sidebar should become a slide-out drawer.

No horizontal scrolling.

Touch-friendly controls.

---

# Animations

Smooth page transitions.

Card hover effects.

Fade animations.

Slide animations.

Loading skeletons.

Shimmer loading.

Button ripple.

Micro-interactions.

Professional motion.

---

# Accessibility

Keyboard navigation.

ARIA labels.

High contrast.

Screen reader support.

WCAG AA compliant.

---

# Performance

Lazy loading.

Optimized database queries.

Image optimization.

Code splitting.

Fast rendering.

Caching.

Production-ready optimization.

---

# Folder Structure

Follow a scalable enterprise architecture.

Separate modules for

Authentication

Dashboard

Customers

Shipments

Categories

Receipts

Reports

Loyalty

Notifications

Audit Logs

Settings

Profile

Reusable Components

Hooks

Utilities

Services

API

Database

Types

Constants

---

# User Experience

Every page should have:

* Sticky page header with breadcrumbs.
* Global search bar for customers, shipments, and tracking numbers.
* Beautiful empty states with illustrations.
* Loading skeletons instead of spinners where appropriate.
* Confirmation dialogs before destructive actions.
* Toast notifications for success, warning, and error messages.
* Consistent card layouts and spacing.
* Status badges with clear color coding.
* Responsive tables with sorting, filtering, and pagination.
* Export and print actions where relevant.

---

# Additional Enterprise Features

Include these additional features to make the application more complete:

* Global search across the entire application.
* Dashboard widgets that can be reordered by the admin.
* Recent searches.
* Favorite customers for quick access.
* Soft delete with restore functionality instead of permanent deletion.
* Activity timeline for every customer and shipment.
* Notes section for customers and shipments.
* Attachment upload for shipment documents and invoices.
* Company logo upload.
* Automatic tracking number generation with uniqueness validation.
* Breadcrumb navigation on every page.
* User avatar dropdown with Profile, Settings, and Logout.
* Session expiration warning before automatic logout.
* Comprehensive error pages (403, 404, 500).
* Empty-state illustrations and helpful messages.
* Dark mode and light mode with system preference detection.
* Automatic saving of user preferences (theme, sidebar state, table density).

---

# Final Goal

Build a **production-ready, enterprise-level, full-stack Shipping Administration System** that is visually polished, secure, responsive, scalable, maintainable, and intuitive. Every interface should look custom-designed rather than template-based, delivering a premium experience suitable for a professional shipping company managing operations between Madagascar and Mauritius. There should be **no placeholder content**, no generic layouts, and every module should be consistent with the overall design language established by the login page.
