# STOREA Platform - Complete Documentation

**Version:** 1.0  
**Last Updated:** 2025  
**Document Type:** Comprehensive System Documentation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Application Architecture](#application-architecture)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Public Pages (Marketing Site)](#public-pages-marketing-site)
5. [Authentication System](#authentication-system)
6. [Main Application Pages](#main-application-pages)
7. [Project Invitation System](#project-invitation-system)
8. [Tender Invitation System](#tender-invitation-system)
9. [Admin Pages](#admin-pages)
10. [Dialogs & Popups](#dialogs--popups)
11. [Database Schema](#database-schema)
12. [Supabase Edge Functions](#supabase-edge-functions)
13. [Storage Buckets](#storage-buckets)
14. [Real-time Features](#real-time-features)
15. [Analytics & Tracking](#analytics--tracking)
16. [Security Features](#security-features)
17. [User Workflows](#user-workflows)
18. [Advanced Features](#advanced-features)
19. [Testing & Quality Assurance](#testing--quality-assurance)
20. [UI/UX Components](#uiux-components)
21. [Utilities & Services](#utilities--services)
22. [Context Providers](#context-providers)
23. [Custom Hooks](#custom-hooks)
24. [SEO & Metadata](#seo--metadata)
25. [Deployment & Infrastructure](#deployment--infrastructure)
26. [Integrations](#integrations)
27. [Technical Specifications](#technical-specifications)

---

## Executive Summary

### Platform Purpose
STOREA is a comprehensive construction project management platform designed to streamline collaboration between architects, builders, contractors, and homeowners. The platform provides a centralized hub for managing projects, documents, communications, tenders/bids, financial tracking, and more.

### Target Users
- **Architects**: Project creators and managers
- **Builders**: Construction project leaders
- **Contractors**: Specialized tradespeople and subcontractors
- **Homeowners**: Project owners and stakeholders

### Key Value Propositions
1. **Centralized Project Management**: All project data in one place
2. **Document Control**: Version control and audit trails for all documents
3. **Streamlined Communication**: Integrated messaging and RFI systems
4. **Tender Management**: Complete bid request and submission workflow
5. **Financial Tracking**: Budget, invoices, payments, and progress claims
6. **Real-time Collaboration**: Live updates and notifications
7. **Mobile Responsive**: Access from any device
8. **Enterprise Security**: Admin approval, role-based access control

### Platform Statistics
- **Total Pages**: 40+ pages/routes
- **Database Tables**: 50+ tables
- **UI Components**: 100+ reusable components
- **Edge Functions**: 10 serverless functions
- **Storage Buckets**: 6 secure file storage areas
- **User Roles**: 5 distinct roles (Admin, Architect, Builder, Contractor, Homeowner)

---

## Application Architecture

### Technology Stack

#### Frontend Technologies
- **Framework**: React 18.3.1
- **Language**: TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM v6.30.1
- **State Management**: TanStack React Query v5.83.0
- **Form Handling**: React Hook Form v7.61.1 + Zod v3.25.76

#### UI & Styling
- **CSS Framework**: Tailwind CSS with custom design system
- **Component Library**: shadcn/ui (Radix UI primitives)
- **UI Components**: 
  - @radix-ui/* (30+ component packages)
  - Custom components built on Radix primitives
- **Icons**: Lucide React v0.462.0
- **Theming**: next-themes v0.3.0 (dark/light mode)
- **Animations**: tailwindcss-animate v1.0.7

#### Backend & Database
- **Backend Platform**: Supabase (PostgreSQL)
- **Database**: PostgreSQL 13+ with Row Level Security
- **Authentication**: Supabase Auth (email/password, OAuth)
- **Storage**: Supabase Storage (file management)
- **Real-time**: Supabase Realtime (WebSocket subscriptions)
- **Serverless Functions**: Supabase Edge Functions (Deno runtime)

#### Analytics & Monitoring
- **Web Analytics**: Google Analytics 4 (ID: G-8EBGY1HGEE)
- **Behavior Analytics**: Microsoft Clarity (ID: p3vxdyy2fc)
- **Conversion Tracking**: Google Ads integration ready

#### Data Visualization & Charts
- **Charting Library**: Recharts v2.15.4
- **Calendar**: react-day-picker v9.9.0
- **Maps**: Leaflet v1.9.4

#### File Processing
- **Excel**: xlsx v0.18.5
- **PDF Generation**: jspdf v3.0.2, jspdf-autotable v5.0.2
- **PDF Viewing**: pdfjs-dist v5.4.296
- **File Downloads**: file-saver v2.0.5
- **Compression**: jszip v3.10.1
- **Screen Capture**: html2canvas v1.4.1

#### Additional Libraries
- **Date Utilities**: date-fns v4.1.0
- **Carousel**: embla-carousel-react v8.6.0, react-slick v0.31.0
- **Drag & Drop**: react-dropzone v14.3.8
- **OTP Input**: input-otp v1.4.2
- **Notifications**: sonner v1.7.4
- **Encryption**: crypto-js v4.2.0
- **Drawer**: vaul v0.9.9

### Project Structure

```
storea/
├── public/                          # Static assets
│   ├── favicon.png                  # Site favicon
│   ├── storea-logo.png             # Brand logo
│   ├── og-*.jpg                    # Open Graph images
│   ├── robots.txt                  # SEO crawling rules
│   ├── sitemap.xml                 # SEO sitemap
│   └── site.webmanifest            # PWA manifest
│
├── src/
│   ├── api/                        # API service layers
│   │   └── admin.ts               # Admin API functions
│   │
│   ├── components/                 # React components
│   │   ├── admin/                 # Admin dashboard components (30+ files)
│   │   ├── advanced/              # Advanced features
│   │   ├── auth/                  # Authentication components
│   │   ├── companies/             # Company display
│   │   ├── dashboard/             # Dashboard widgets (15+ files)
│   │   ├── documents/             # Document management (25+ files)
│   │   ├── errors/                # Error boundaries
│   │   ├── financials/            # Financial components (15+ files)
│   │   ├── layout/                # Layout components (Header, Sidebar, etc.)
│   │   ├── marketing/             # Public marketing site components
│   │   ├── messages/              # Messaging system (10+ files)
│   │   ├── notifications/         # Notification center
│   │   ├── profile/               # User profile management
│   │   ├── projects/              # Project management (15+ files)
│   │   ├── projects-v2/           # Advanced project features
│   │   ├── rfis/                  # RFI system (25+ files)
│   │   ├── search/                # Global search
│   │   ├── security/              # Security components
│   │   ├── tenders/               # Tender management (40+ files)
│   │   ├── testing/               # Testing & QA tools (10+ files)
│   │   └── ui/                    # Reusable UI components (60+ files)
│   │
│   ├── context/                   # React Context providers
│   │   ├── AuthContext.tsx       # Authentication state
│   │   ├── NotificationContext.tsx
│   │   ├── ProjectSelectionContext.tsx
│   │   ├── RealtimeContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── hooks/                     # Custom React hooks (50+ files)
│   │   ├── useAuth.ts
│   │   ├── useAnalytics.ts
│   │   ├── useProjects.ts
│   │   ├── useDocuments.ts
│   │   ├── useRFIs.ts
│   │   ├── useTenders.ts
│   │   └── ... (40+ more hooks)
│   │
│   ├── integrations/              # Third-party integrations
│   │   └── supabase/
│   │       ├── client.ts         # Supabase client config
│   │       └── types.ts          # Auto-generated types
│   │
│   ├── lib/                       # Utility libraries
│   │   ├── security/             # Security utilities
│   │   ├── telemetry/            # Telemetry stubs
│   │   ├── validations/          # Validation schemas
│   │   ├── calendarUtils.ts
│   │   └── utils.ts              # General utilities
│   │
│   ├── pages/                     # Route pages (30+ files)
│   │   ├── public/               # Public marketing pages
│   │   ├── admin/                # Admin pages
│   │   └── ... (main app pages)
│   │
│   ├── services/                  # Business logic services
│   │   ├── BidExcelParser.ts
│   │   ├── DocumentUploadService.ts
│   │   ├── EmailRFIParser.ts
│   │   ├── RFIEmailService.ts
│   │   ├── TenderBidFileService.ts
│   │   ├── TenderExcelParser.ts
│   │   └── TradespeopleService.ts
│   │
│   ├── utils/                     # Helper utilities (15+ files)
│   │   ├── adminActivityLogger.ts
│   │   ├── documentUtils.ts
│   │   ├── geocoding.ts
│   │   ├── notificationCleanup.ts
│   │   ├── profileUtils.ts
│   │   ├── rfiUtils.ts
│   │   ├── storageUtils.ts
│   │   └── ... (more utilities)
│   │
│   ├── App.tsx                    # Root app component
│   ├── main.tsx                   # App entry point
│   ├── index.css                  # Global styles & design tokens
│   └── vite-env.d.ts             # Vite type definitions
│
├── supabase/
│   ├── functions/                 # Edge Functions (10 functions)
│   ├── migrations/                # Database migrations
│   └── config.toml               # Supabase configuration
│
├── tailwind.config.ts             # Tailwind CSS configuration
├── vite.config.ts                # Vite build configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies
```

### Application Flow Architecture

```
User Request
    ↓
React Router (routes defined in App.tsx)
    ↓
Authentication Guard (RequireAuth)
    ↓
Profile Completion Guard (RequireCompleteProfile)
    ↓
Page Component
    ↓
Custom Hooks (data fetching via React Query)
    ↓
Supabase Client
    ↓
PostgreSQL Database (with RLS)
    ↓
Response cached by React Query
    ↓
UI Updates (optimistic + real-time)
```

---

## User Roles & Permissions

### User Role Hierarchy

#### 1. Admin Role
- **Access Level**: Full system access
- **Key Permissions**:
  - View all projects, users, and data
  - Approve/reject new user registrations
  - Assign admin role to other users
  - Access admin dashboard and monitoring tools
  - View audit logs and system activity
  - Configure system settings
  - Manage alerts and notifications
  - Access testing and QA tools
  - Can bypass profile completion requirement
- **Restrictions**: Cannot be self-assigned (requires existing admin)

#### 2. Architect Role
- **Access Level**: Project creator and manager
- **Key Permissions**:
  - Create new projects
  - Invite team members to projects
  - Upload and manage documents
  - Create and issue tenders
  - Create and manage RFIs
  - View project financials
  - Approve contractor access to tenders
  - Award contracts
  - Full access to owned projects
- **Required Profile Fields**:
  - Company affiliation
  - Professional license number
  - Years of experience
- **Typical Use Cases**: Design firms, architectural practices

#### 3. Builder Role
- **Access Level**: Construction project leadership
- **Key Permissions**:
  - Join projects (via invitation)
  - Upload documents
  - Create RFIs
  - View and submit bids
  - Manage subcontractors
  - View project financials
  - Manage project timeline
- **Required Profile Fields**:
  - Company affiliation
  - Business registration number
  - Company address
- **Typical Use Cases**: General contractors, construction companies

#### 4. Contractor Role
- **Access Level**: Specialized tradesperson
- **Key Permissions**:
  - Join projects (via invitation)
  - View project documents (scope limited)
  - Submit bids on tenders
  - Respond to RFIs
  - Upload work documents
  - Limited financial visibility
- **Required Profile Fields**:
  - Professional license number (if applicable)
  - Years of experience
  - Specialization/trade
- **Typical Use Cases**: Electricians, plumbers, HVAC specialists, etc.

#### 5. Homeowner Role
- **Access Level**: Project owner/client
- **Key Permissions**:
  - Join projects (usually as invited stakeholder)
  - View project progress
  - Review documents
  - Participate in messaging
  - View financial reports
  - Approve major changes
  - Limited document upload
- **Required Profile Fields**:
  - Property address
  - Project type
- **Typical Use Cases**: Residential clients, property owners

### User Approval Workflow

```
User Signs Up (Email + Password or Google OAuth)
    ↓
Email Verification Sent
    ↓
User Clicks Verification Link
    ↓
Email Verified ✓
    ↓
User Completes Profile Setup (Multi-step wizard)
    ↓
Profile Submitted for Admin Review
    ↓
Admin Reviews User Profile
    ↓
┌─────────────────────┐
│ Admin Decision      │
└─────────────────────┘
    ↓               ↓
Approved        Rejected
    ↓               ↓
User Gains      User Notified
Full Access     (must reapply)
    ↓
Auto-link to Pending Project Invitations
    ↓
User Can Access Full Platform
```

### Row Level Security (RLS) Policies

The platform implements comprehensive RLS policies ensuring users can only access data they're authorized to view:

- **Projects**: Users can only see projects they're members of
- **Documents**: Scoped by project membership and visibility settings
- **Messages**: Limited to thread participants
- **RFIs**: Visible to project members and assigned users
- **Tenders**: Controlled by tender access approvals
- **Financials**: Restricted to project stakeholders with financial permissions
- **Admin Data**: Only accessible to users with admin role

---

## Public Pages (Marketing Site)

All public pages are accessible without authentication and are optimized for SEO.

### 1. Home Page (`/`)

**Route**: `/`  
**Component**: `src/pages/public/Home.tsx`  
**Layout**: `PublicLayout`

**Purpose**: Primary landing page showcasing the STOREA platform

**Key Features**:
- **Hero Section**: 
  - Animated storage/construction visualization
  - Primary call-to-action buttons
  - Value proposition headline
- **StorageAnimation**: Custom animated SVG showcasing construction elements
- **Feature Highlights**: Quick overview of key capabilities
- **Social Proof**: Testimonials or user statistics (if configured)
- **Navigation**: Links to Features, Pricing, About, Contact

**Components Used**:
- `HeroSection`
- `StorageAnimation`
- `NavBar`
- `Footer`
- `FeatureCard` (multiple instances)

**SEO Optimizations**:
- Primary H1: "Construction Project Management Made Simple"
- Meta description optimized for construction management keywords
- Open Graph image: `/og-image.jpg`
- Structured data (JSON-LD) for organization
- Canonical URL set

**Analytics Tracking**:
- Page view tracking
- CTA button clicks
- Scroll depth tracking

---

### 2. Features Page (`/features`)

**Route**: `/features`  
**Component**: `src/pages/public/Features.tsx`

**Purpose**: Comprehensive showcase of platform capabilities

**Featured Capabilities**:

1. **Project Management**
   - Multi-project support
   - Team collaboration
   - Timeline tracking
   - Gantt charts

2. **Document Control**
   - Version management
   - Superseding workflow
   - Document locking
   - Audit trails

3. **RFI Management**
   - Structured inquiry system
   - Auto-numbering (COMPANY-TYPE-NNNN)
   - Email integration
   - Response tracking

4. **Tender/Bid Management**
   - Tender creation wizard
   - Line item pricing
   - Bid comparison tools
   - Contractor prequalification

5. **Financial Tracking**
   - Budget management
   - Invoice generation
   - Progress claims
   - Payment tracking

6. **Team Collaboration**
   - Real-time messaging
   - File sharing
   - Activity feeds
   - Notifications

7. **Calendar & Scheduling**
   - Event management
   - Meeting coordination
   - Deadline tracking
   - Reminders

8. **Mobile Access**
   - Responsive design
   - Touch-optimized
   - Works on all devices

**Components Used**:
- `FeatureCard` (grid of 8+ features)
- `RelatedPages` (navigation to other marketing pages)
- `FAQSection` (common questions)

**SEO**:
- H1: "Powerful Features for Construction Management"
- Semantic HTML structure
- Alt text on all images
- Internal linking to other pages

**Analytics**:
- Feature view tracking (`trackFeatureView('Features Page')`)
- Time on page
- Feature card clicks

---

### 3. Pricing Page (`/pricing`)

**Route**: `/pricing`  
**Component**: `src/pages/public/Pricing.tsx`

**Purpose**: Display pricing plans and packages

**Pricing Tiers** (configurable):
- **Free/Starter**: Basic project management
- **Professional**: Full feature access for small teams
- **Business**: Advanced features for larger organizations
- **Enterprise**: Custom pricing, unlimited users

**Interactive Elements**:
- **Billing Toggle**: Monthly vs. Yearly pricing
- **Plan Comparison Table**: Feature matrix
- **CTA Buttons**: "Get Started" / "Contact Sales"

**Components**:
- `PricingCard` (for each tier)
  - Plan name and description
  - Price display
  - Feature list
  - Action button
- Billing period toggle

**Features Highlighted**:
- User limits
- Project limits
- Storage capacity
- Support level
- Advanced features availability
- Custom integrations

**Analytics**:
- Plan selection tracking
- Billing period toggle tracking
- CTA button clicks

**SEO**:
- H1: "Simple, Transparent Pricing"
- Structured data for pricing
- Open Graph: `/og-pricing.jpg`

---

### 4. About Page (`/about`)

**Route**: `/about`  
**Component**: `src/pages/public/About.tsx`

**Purpose**: Company information, mission, and team

**Content Sections**:
1. **Company Mission**: Why STOREA exists
2. **Our Story**: Company history and founding
3. **Team**: Key team members (if applicable)
4. **Values**: Core principles
5. **Technology**: Why we built it this way
6. **Contact Information**: How to reach the company

**SEO**:
- H1: "About STOREA"
- Open Graph: `/og-about.jpg`
- Breadcrumb navigation
- Company schema markup

---

### 5. Contact Page (`/contact`)

**Route**: `/contact`  
**Component**: `src/pages/public/Contact.tsx`

**Purpose**: User inquiries and support requests

**Contact Methods**:

1. **Contact Form** (`ContactForm` component)
   - Name (required)
   - Email (required)
   - Company (optional)
   - Message (required)
   - Form validation with error messages
   - Success/error toast notifications
   - **Analytics**: Form submission tracking

2. **Direct Contact Information**
   - Email: support@storea.com (example)
   - Phone: +61 xxx xxx xxx
   - Address: Office location

3. **FAQ Section**
   - Common questions
   - Quick answers
   - Link to documentation

**Features**:
- Client-side form validation
- Email notification on submission (via Edge Function)
- Spam protection (honeypot field)
- Loading states during submission
- Success confirmation

**Analytics**:
- Contact form submissions (`trackContactForm()`)
- FAQ interactions
- Direct contact link clicks

**SEO**:
- H1: "Contact Us"
- Open Graph: `/og-contact.jpg`
- Local business schema (if applicable)

---

### 6. Privacy Policy (`/privacy`)

**Route**: `/privacy`  
**Component**: `src/pages/public/Privacy.tsx`

**Purpose**: Legal privacy policy and data handling practices

**Sections Covered**:
- Information collection
- Data usage
- Data storage and security
- Third-party services (Google Analytics, Clarity, Supabase)
- User rights (GDPR compliance)
- Cookie policy
- Contact for privacy concerns
- Last updated date

**Legal Requirements**:
- GDPR compliance statements
- Cookie consent information
- Data retention policies
- User data deletion procedures

---

### 7. Terms of Service (`/terms`)

**Route**: `/terms`  
**Component**: `src/pages/public/Terms.tsx`

**Purpose**: Legal terms and conditions

**Sections**:
- Service description
- User obligations
- Account terms
- Payment terms (if applicable)
- Intellectual property
- Limitation of liability
- Termination clauses
- Governing law
- Dispute resolution
- Last updated date

---

### Public Page Components

**Shared Components Across All Public Pages**:

1. **NavBar** (`src/components/marketing/NavBar.tsx`)
   - Logo with link to home
   - Navigation links (Home, Features, Pricing, About, Contact)
   - "Sign In" and "Get Started" CTAs
   - Mobile responsive hamburger menu
   - Sticky header on scroll

2. **Footer** (`src/components/marketing/Footer.tsx`)
   - Company information
   - Quick links
   - Social media links
   - Legal links (Privacy, Terms)
   - Copyright notice

3. **PublicLayout** (`src/components/marketing/PublicLayout.tsx`)
   - Wraps all public pages
   - Includes NavBar and Footer
   - Consistent spacing and structure
   - SEO-friendly HTML structure

4. **Breadcrumbs** (`src/components/marketing/Breadcrumbs.tsx`)
   - Navigation trail
   - Schema.org markup
   - Improves SEO and UX

---

## Authentication System

### Overview
STOREA uses Supabase Auth for secure, scalable authentication with multiple sign-in methods and comprehensive security features.

---

### 1. Auth Page (`/auth`)

**Route**: `/auth`  
**Component**: `src/pages/Auth.tsx`

**Purpose**: Unified authentication page for signup and login

**Sign-Up Features**:
- **Email/Password Registration**:
  - Email validation (Zod schema)
  - Password strength requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
  - Password confirmation field
  - Real-time password strength indicator
- **Google OAuth**:
  - One-click Google sign-in
  - Automatic profile creation from Google data
- **Email Verification**:
  - Verification email sent automatically
  - User cannot access app until verified
  - Resend verification email option
- **Redirect Configuration**:
  - `emailRedirectTo` set to `window.location.origin`
  - Works in all environments (dev, staging, production)

**Login Features**:
- Email/password login
- Google OAuth login
- "Remember me" option (session persistence)
- "Forgot password" link
- Error handling with user-friendly messages

**Security Features**:
1. **CAPTCHA Challenge** (`CaptchaChallenge` component)
   - Triggered on suspicious activity
   - Prevents automated attacks
   - Math-based challenge

2. **Login Attempt Tracking** (`loginAttemptTracker`)
   - Tracks failed login attempts
   - Rate limiting (max 5 attempts per 15 minutes)
   - IP-based tracking
   - Automatic lockout on excessive failures

3. **Password Validation** (`passwordValidator`)
   - Strength calculation
   - Common password detection
   - Real-time feedback

4. **CSRF Protection** (`csrfProtection`)
   - Token generation
   - Request validation
   - Session protection

5. **Session Management** (`sessionManager`)
   - Automatic session refresh
   - Session timeout (24 hours default)
   - Secure token storage

**User Experience**:
- Tab switching between "Sign In" and "Sign Up"
- Loading states during authentication
- Error messages for all failure scenarios:
  - Invalid credentials
  - Email already registered
  - Network errors
  - Email not verified
- Success messages with auto-redirect
- Password visibility toggle

**Analytics Tracking**:
- Signup events by method (`trackSignup('email')` or `trackSignup('google')`)
- Login events
- Failed authentication attempts

**Components**:
- `PasswordStrengthIndicator`: Visual password strength meter
- `CaptchaChallenge`: Security challenge dialog

**Error Scenarios Handled**:
- User already exists
- Invalid email format
- Weak password
- Email not verified
- Account pending approval
- Network connectivity issues
- Server errors

**Redirect Behavior**:
- After successful signup → `/profile-setup`
- After successful login (profile complete) → `/dashboard`
- After successful login (profile incomplete) → `/profile-setup`
- After email verification → Last attempted URL or `/dashboard`

---

### 2. Profile Setup Page (`/profile-setup`)

**Route**: `/profile-setup`  
**Component**: `src/pages/ProfileSetup.tsx`

**Purpose**: Multi-step wizard for completing user profile after initial signup

**Access Control**:
- Only accessible to authenticated users
- Redirects to `/auth` if not logged in
- Auto-redirects to `/dashboard` if profile already complete
- Required before accessing main application (enforced by `RequireCompleteProfile` guard)

**Profile Completion Logic**:

Profile is considered complete when ALL of the following are met:
1. **Base Fields** (all roles):
   - Name (full name)
   - Phone number (validated)

2. **Role-Specific Fields**:

   **Homeowner**:
   - Property address
   - Project type (renovation, new build, extension, etc.)

   **Architect**:
   - Company affiliation (company_id)
   - Professional license number
   - Years of experience (numeric value)

   **Builder**:
   - Company affiliation (company_id)
   - Business registration number (ABN/ACN)
   - Company address

   **Contractor**:
   - Professional license number
   - Years of experience (numeric value)

**Multi-Step Wizard**:

**Step 1: Personal Information** (`Step1PersonalInfo.tsx`)
- **Fields**:
  - Full Name* (required)
  - Phone Number* (required)
    - Format: 0403190409 or +61403190409
    - Validation: Minimum 10 digits
    - Auto-formatting on save
  - Bio (optional, max 200 characters)
  - Avatar/Profile Picture
    - Uses company logo if set
    - Placeholder if no company logo
- **Validation**:
  - Name: Required, min 2 characters
  - Phone: Required, valid Australian format
  - Bio: Max 200 characters
- **Progress**: Step 1 of 2-3 (depends on role)

**Step 2: Professional Information** (`Step2ProfessionalInfo.tsx`)
- **Fields vary by role selected during signup**:

  **For Homeowner**:
  - Property Address* (required)
  - Project Type* (required)
    - Options: Renovation, New Build, Extension, Landscaping, Other
  - Budget Range (optional)
  - Project Timeline (optional)

  **For Architect**:
  - Company Name* (required - select or create)
  - Position/Title
  - Professional License Number* (required)
  - Years of Experience* (required)
  - Specialization (multi-select)
    - Options: Residential, Commercial, Industrial, Landscape, Interior, Urban Planning

  **For Builder**:
  - Company Name* (required - select or create)
  - Position/Title
  - Business Registration Number* (required - ABN/ACN)
  - Years of Experience
  - Specialization (multi-select)
    - Options: Residential, Commercial, Renovations, New Builds, High-Rise

  **For Contractor**:
  - Company Name (optional)
  - Trade/Specialization* (required)
    - Options: Electrical, Plumbing, HVAC, Carpentry, Painting, etc.
  - Professional License Number* (required)
  - Years of Experience* (required)
  - Insurance Details (optional)
    - Public Liability
    - Workers Compensation
- **Progress**: Step 2 of 2-3

**Step 3: Company Information** (`Step3CompanyInfo.tsx`)
- **Only shown for**: Architect, Builder roles (those who selected/created a company)
- **Fields**:
  - Company Address
  - Company Phone
  - Company Website
  - Number of Employees
  - Company Logo Upload
    - Drag-and-drop or click to upload
    - Supports: JPG, PNG, WebP
    - Max size: 2MB
    - Uploads to `company-logos` bucket in Supabase Storage
    - Preview before upload
- **Note**: Company information is shared across all users of the same company
- **Progress**: Step 3 of 3

**Navigation**:
- "Back" button (disabled on step 1)
- "Next" button (validates current step before proceeding)
- "Complete Setup" button (on final step)
- Progress indicator showing current step

**Profile Setup Wizard Component** (`ProfileSetupWizard.tsx`):

**Key Functions**:

1. **handleFieldChange(field, value)**
   - Updates form data
   - Clears field-specific errors
   - Normalizes phone numbers

2. **validateStep(step)**
   - Validates current step before moving forward
   - Returns boolean (valid/invalid)
   - Shows error messages for invalid fields

3. **handleSubmit()**
   - Final submission logic:
     a. Normalizes phone number (removes formatting)
     b. Validates all data using `validateProfileData` utility
     c. Creates or retrieves company record (if applicable)
     d. Upserts profile data to `profiles` table
     e. Mirrors avatar_url and company logo (if applicable)
     f. Invokes `link-pending-projects` Edge Function
        - Automatically links user to any pending project invitations
        - Uses email matching
     g. Refreshes user profile data in AuthContext
     h. Shows success toast
     i. Calls `onComplete()` callback
   - Error handling with user-friendly messages

4. **onComplete()**
   - Checks for pending invitation in sessionStorage
   - If found, redirects to invitation URL
   - Otherwise, redirects to `/dashboard`

**Database Operations**:
- Profile upsert to `profiles` table
- Company creation/retrieval from `companies` table
- Company logo upload to Supabase Storage
- Edge Function invocation for project linking

**Auto-Linking Logic**:
The `link-pending-projects` Edge Function automatically:
- Finds all pending project invitations matching user's email
- Links user to those projects
- Updates invitation status to "accepted"
- Assigns appropriate role based on invitation

**Validation Rules**:
- All required fields must be filled
- Phone number must be valid format
- Email must be unique (already validated at signup)
- License numbers must be valid format (if role requires)
- Company selection required for architect/builder roles

**Error Handling**:
- Field-level validation errors
- Server error messages
- Network failure handling
- Duplicate entry detection
- Invalid data format messages

**Loading States**:
- Form submission loading
- Company logo upload progress
- Navigation disabled during async operations

---

### 3. User Approval Flow

**Page**: `/user-approval`  
**Component**: `src/components/auth/PendingApprovalMessage.tsx`

**When Shown**:
- After email verification
- After profile setup completion
- Before admin approval
- User's `approved` field in database is `false` or `null`

**Message Displayed**:
```
Account Pending Approval

Your account has been created successfully, but it needs to be approved 
by an administrator before you can access the application.

You'll receive a notification once your account is approved. 
This usually takes 1-2 business days.
```

**Features**:
- Professional, branded message card
- Clear explanation of status
- Expected timeline
- "Sign Out" button
- STOREA logo

**Admin Approval Process** (see Admin section for details):
1. Admin navigates to `/admin/approvals` or `/admin/users`
2. Reviews pending user profile
3. Approves or rejects
4. User notified via email (if configured)
5. Upon approval, user can immediately sign in

**Database Field**:
- `profiles.approved`: boolean
- `profiles.approved_at`: timestamp
- `profiles.approved_by`: admin user_id

---

### Authentication Context (`AuthContext.tsx`)

**Purpose**: Global authentication state management

**Exported Values**:
- `user`: Current Supabase user object
- `profile`: User profile from `profiles` table
- `session`: Current Supabase session
- `loading`: Boolean indicating auth state loading
- `signIn(email, password)`: Login function
- `signUp(email, password)`: Registration function
- `signInWithGoogle()`: Google OAuth function
- `signOut()`: Logout function
- `refreshProfile()`: Re-fetch profile from database

**Session Management**:
- `onAuthStateChange` listener for real-time auth updates
- Session persistence in localStorage
- Automatic token refresh
- Session timeout handling

**Profile Loading**:
- Fetches profile immediately after authentication
- Joins with companies table for company data
- Includes online status and role information

**Error Handling**:
- Network errors
- Session expiration
- Profile loading failures

---

### Authentication Guards

**RequireAuth** (in route configuration):
- Redirects to `/auth` if not authenticated
- Allows access if user is logged in

**RequireCompleteProfile** (`src/components/auth/RequireCompleteProfile.tsx`):
- Checks if profile is complete using `isProfileComplete()` utility
- Allows profile setup page itself
- Allows admin routes for admin users (even with incomplete profile)
- Redirects to `/profile-setup` if profile incomplete
- Uses `useEffect` to check admin status via `has_role` RPC

**Logic**:
```javascript
if (!user) redirect to /auth
if (on /profile-setup page) allow
if (admin user) allow
if (profile incomplete) redirect to /profile-setup
else allow access
```

---

### Password Reset Flow

**Trigger**: "Forgot Password" link on `/auth` page

**Process**:
1. User enters email address
2. Calls `supabase.auth.resetPasswordForEmail(email)`
3. Edge Function `send-password-reset` triggered
4. Email sent with reset link
5. User clicks link in email
6. Redirected to password reset page
7. User enters new password
8. Password updated in Supabase Auth
9. User redirected to login

**Email Template**: Configured in Supabase Auth settings

---

### Security Best Practices Implemented

1. **Never store passwords in plain text** (handled by Supabase)
2. **Email verification required** before access
3. **Admin approval layer** for additional security
4. **Rate limiting** on login attempts
5. **CAPTCHA** on suspicious activity
6. **CSRF protection** on all forms
7. **Session timeout** and automatic refresh
8. **Secure password requirements** enforced
9. **SQL injection prevention** via parameterized queries
10. **XSS prevention** via React's built-in escaping

---

## Main Application Pages

All pages below require authentication and complete profile. Access is controlled by `RequireAuth` and `RequireCompleteProfile` guards.

---

### 1. Dashboard (`/dashboard`)

**Route**: `/dashboard`  
**Component**: `src/pages/Dashboard.tsx`  
**Layout**: `AppLayout` (includes Sidebar + Header)

**Purpose**: Central hub providing overview of all user activities, projects, and actionable items

**Page Structure**:
- Responsive grid layout
- Role-based widget visibility
- Real-time data updates
- Quick action buttons
- Contextual information based on selected project

**Widgets & Components**:

#### **1. Project Status Overview** (`ProjectStatusOverview.tsx`)
- Current project health indicators
- Progress percentage
- Phase/milestone tracking
- Budget status
- Timeline adherence
- Color-coded status (on track, at risk, delayed)

#### **2. Quick Actions** (`QuickActions.tsx`)
- Create New Project (if architect)
- Upload Document
- Create RFI
- Send Message
- Create Tender (if architect)
- Add To-Do Item
- Schedule Event
- One-click access to common tasks

#### **3. Calendar Widget** (`CalendarWidget.tsx`)
- Upcoming events (next 7 days)
- Meeting reminders
- Project deadlines
- Milestone dates
- Click to view full calendar

#### **4. To-Do List** (`ToDoList.tsx`)
- Personal tasks
- Assigned tasks
- Due dates with urgency indicators
- Mark complete inline
- Add new tasks
- Filter by project or priority

#### **5. Recent Activity** (`RecentActivity.tsx`)
- Live activity feed
- User actions across projects
- Document uploads
- RFI submissions
- Message threads
- Tender updates
- Real-time updates via WebSocket
- User avatars and timestamps

#### **6. Open RFIs** (`OpenRFIs.tsx`)
- RFIs requiring attention
- Assigned to current user
- Priority indicators
- Due date urgency
- Quick response option
- Filter by status

#### **7. User RFIs Dashboard** (`UserRFIsDashboard.tsx`)
- Personal RFI overview
- Created by user
- Assigned to user
- Status breakdown (open, in progress, closed)
- Response time metrics

#### **8. Open Messages** (`OpenMessages.tsx`)
- Unread message count
- Recent threads
- Quick reply option
- Participant avatars
- Navigate to full message thread

#### **9. Actionable Documents** (`ActionableDocuments.tsx`)
- Documents requiring review
- Documents pending approval
- Documents assigned to user
- Version updates requiring attention
- Quick view and approve

#### **10. Team Members Overview** (`TeamMembersOverview.tsx`)
- Current project team
- Online status indicators
- Role badges
- Quick contact options
- Avatar display

#### **11. Dashboard Analytics** (`DashboardAnalytics.tsx`)
- Visual charts and graphs:
  - Project progress over time
  - Budget utilization
  - RFI response times
  - Document activity
  - Team productivity
- Built with Recharts
- Interactive tooltips

#### **12. Conflict Warnings** (`ConflictWarning.tsx`)
- Schedule conflicts
- Resource allocation issues
- Overlapping deadlines
- Critical alerts
- Suggested resolutions

#### **13. Location Info** (`LocationInfo.tsx`)
- Current project location
- Weather information (via `get-weather` Edge Function)
- Site conditions
- Map preview (Leaflet)

#### **14. Info Panel** (`InfoPanel.tsx`)
- Contextual help
- Tips and shortcuts
- Recent updates
- Platform notifications

#### **15. Agenda View** (`AgendaView.tsx`)
- Day/week view of events
- Chronological timeline
- Today's schedule
- Tomorrow's schedule

**Real-time Features**:
- Activity feed updates live
- New message notifications
- RFI status changes
- Document uploads
- User online/offline status
- All via Supabase Realtime subscriptions

**Responsive Behavior**:
- Desktop: Multi-column grid layout
- Tablet: 2-column layout
- Mobile: Single column, stacked widgets
- Collapsible widgets on mobile

**Performance**:
- Lazy loading for charts
- Pagination for activity feed
- Cached queries via React Query
- Optimistic updates

**Customization** (potential future feature):
- Drag-and-drop widget rearrangement
- Hide/show widgets
- Custom widget sizes

---

### 2. Projects Page (`/projects`)

**Route**: `/projects`  
**Component**: `src/pages/Projects.tsx`

**Purpose**: Comprehensive project management hub

**Page Sections**:

#### **Project List View**
- Grid or list view toggle
- All projects user has access to
- Filter options:
  - Status (Active, Completed, On Hold, Planning)
  - Role (My Projects, Invited Projects)
  - Date range
  - Search by name/address
- Sort options:
  - Name (A-Z, Z-A)
  - Date created (newest, oldest)
  - Status
  - Progress

#### **Project Cards** (`ProjectCard.tsx`)
Each card displays:
- Project name
- Address with map icon
- Status badge
- Progress percentage
- Team member avatars (first 5)
- Quick actions:
  - View Details
  - Open Messages
  - View Documents
  - Manage Team (if architect)
- Click to open detailed view

#### **Create Project** (Architect only)
**Dialog**: `CreateProjectDialog.tsx`

**Multi-step Project Creation**:

**Step 1: Basic Information**
- Project Name* (required)
- Project Description
- Project Type:
  - Residential
  - Commercial
  - Industrial
  - Infrastructure
  - Renovation
- Status:
  - Planning
  - Active
  - On Hold
  - Completed

**Step 2: Location Details**
- Street Address* (required)
- City/Suburb* (required)
- State/Territory* (required)
- Postcode* (required)
- Country (defaults to Australia)
- Geocoding: Converts address to coordinates for map
- Map Preview: Shows location on map

**Step 3: Timeline**
- Start Date
- Expected Completion Date
- Project Phases (optional):
  - Design Phase
  - Approval Phase
  - Construction Phase
  - Handover Phase
- Milestone dates

**Step 4: Team & Budget**
- Estimated Budget
- Budget Currency (AUD default)
- Initial Team Members:
  - Invite by email
  - Assign roles
- Project Manager assignment

**On Submit**:
- Creates record in `projects` table
- Auto-generates unique `project_id` (e.g., PROJ-2025-001)
- Generates `invitation_token` for easy sharing
- Adds creator as project architect
- Sends invitations to team members (if added)
- Creates initial activity log entry

#### **Project Details Dialog** (`ProjectDetailsDialog.tsx`)
**Opened by clicking on a project card**

**Tabs**:

**1. Overview Tab**
- Project information (all fields from creation)
- Edit mode (if user is architect)
- Save changes functionality
- Project status management

**2. Team Tab**
- Team member list with roles
- Add team member button (`AddTeamMemberDialog`)
  - Search existing users by email/name
  - Invite new users by email
  - Assign role (architect, builder, contractor, homeowner)
- Remove team member (with confirmation)
- Change member role
- Team statistics:
  - Total members
  - Members by role
  - Online members

**3. Documents Tab**
- Quick view of project documents
- Recent uploads
- Link to full Documents page

**4. Activity Tab**
- Project-specific activity log
- Filtered by project
- Shows all actions (uploads, RFIs, messages, etc.)

**5. Settings Tab** (Architect only)
- Archive project
- Delete project (with confirmation)
- Transfer ownership
- Project visibility settings

#### **Project Invitations**

**Invitation Methods**:

**1. Email Invitation** (`AddTeamMemberDialog.tsx`)
- Enter email addresses (comma-separated)
- Select role for each invitee
- Add personal message (optional)
- Sends email via `send-team-invitation` Edge Function
- Creates record in `invitations` table
- Email contains:
  - Project name and details
  - Inviter information
  - Accept invitation link
  - Invitation expiry date (default: 7 days)

**2. Invitation Link** (`ProjectInvitationLink.tsx`)
- Generate shareable link
- Copy to clipboard
- QR code generation (for mobile access)
- Set expiration date
- Set role that link grants
- Track link usage
- Revoke link option

**3. Join Request** (`ProjectJoinSection.tsx`)
- Users can request to join visible projects
- Architect receives notification
- Approve/reject in `PendingInvitationsDialog`

#### **Pending Invitations** (`PendingInvitationsDialog.tsx`)
Shows all pending invitations for projects user manages:
- Invitee email
- Role requested
- Invitation date
- Status (pending, accepted, declined, expired)
- Actions:
  - Resend invitation
  - Revoke invitation
  - Change role

#### **Team Display** (`EnhancedTeamDisplay.tsx`)
Enhanced team visualization:
- Team member cards
- Role badges
- Online status
- Contact information
- Permissions display
- Activity summary per member
- Performance metrics (optional)

#### **Advanced Project Wizard** (`AdvancedProjectWizard.tsx`)
For complex project setups (optional feature):
- Budget breakdown by category
- Detailed timeline with dependencies
- Risk assessment
- Stakeholder matrix
- Approval workflows
- Document template selection
- Integration with external systems

#### **Gantt Chart** (`ProjectGanttChart.tsx`)
Visual timeline representation:
- Interactive timeline
- Drag to adjust dates
- Dependencies between tasks
- Critical path highlighting
- Milestone markers
- Resource allocation view
- Export to image/PDF

#### **Project Contacts** (`ProjectContactsSection.tsx`)
Comprehensive contact directory:
- All project stakeholders
- External contacts (suppliers, authorities)
- Contact details (phone, email, address)
- Organization affiliation
- Role on project
- Quick communication options

**Database Tables Involved**:
- `projects`: Main project records
- `project_users`: Team membership
- `invitations`: Pending invitations
- `project_join_requests`: Join requests
- `project_pending_invitations`: Pre-signup invitations

**Permissions**:
- **View Projects**: All members
- **Create Projects**: Architects only
- **Edit Projects**: Project architects only
- **Manage Team**: Project architects and admins
- **Archive/Delete**: Project architects and admins

---

### 3. Documents Page (`/documents`)

**Route**: `/documents`  
**Component**: `src/pages/Documents.tsx`

**Purpose**: Complete document control and management system with version control, collaboration, and audit trails

**Page Layout**:
- Document groups list (left panel or top)
- Document preview/details (right panel or expandable)
- Filters and search bar
- Upload button (prominent)
- View mode toggle (grid/list)

---

#### **Document Groups** (Primary Organization)

**What is a Document Group?**
- A document group represents a single logical document that may have multiple versions
- Similar to how Google Docs tracks revisions
- Each group has a unique document number
- Only one revision is "current" at any time
- Others are archived but accessible in history

**Document Group Card Display**:
- Document number (e.g., DOC-PROJ-001)
- Document title
- Current revision number (e.g., Rev 3)
- File type icon
- Category badge
- Status badge (Draft, For Review, Approved, Superseded)
- Uploaded by (with avatar)
- Last updated date
- Lock status (if locked)
- Quick actions menu

**Document Numbering System**:
- Auto-generated: `DOC-[PROJECT_CODE]-[SEQUENCE]`
- Example: DOC-PROJ-001, DOC-PROJ-002
- Custom numbers can be assigned
- Numbers are immutable once assigned
- Prevents duplicate numbers

---

#### **Document Upload System** (`DocumentUploadSystem.tsx`)

**Upload Methods**:

**1. Drag-and-Drop**
- Drag files directly onto upload zone
- Visual drop target feedback
- Multiple file upload support
- Progress indicators per file

**2. Click to Browse**
- File browser dialog
- Multi-select enabled
- File type filtering

**Supported File Types**:

**Documents**:
- PDF (.pdf)
- Microsoft Word (.doc, .docx)
- Microsoft Excel (.xls, .xlsx)
- Microsoft PowerPoint (.ppt, .pptx)
- Text files (.txt, .md)

**Images**:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- TIFF (.tiff)

**CAD Files**:
- DWG (.dwg)
- DXF (.dxf)
- DGN (.dgn)

**Other**:
- ZIP archives (.zip)
- CSV (.csv)

**Upload Process**:
1. User selects files
2. Client-side validation:
   - File size check (max 50MB per file)
   - File type check
   - Filename sanitization
3. Upload to Supabase Storage (`documents` bucket)
   - Path: `projects/[project_id]/documents/[filename]`
   - Generates unique filename if duplicate
4. Create document group record
5. Create initial revision record
6. Extract metadata:
   - File size
   - File type/extension
   - Upload timestamp
   - Uploader user_id
7. Generate document number
8. Create activity log entry
9. Notify project team (optional)
10. Show success toast

**Upload UI Features**:
- Progress bar per file
- Batch upload status
- Cancel upload option
- Retry failed uploads
- Thumbnail preview (for images)
- Estimated time remaining

---

#### **Document Metadata & Categorization**

**When Uploading or Editing**:

**Required Fields**:
- Title (can default to filename)
- Category

**Optional Fields**:
- Description
- Tags (multi-select)
- Project stage (Design, Tender, Construction, As-Built)
- Assigned to (team member)
- Status (Draft, For Review, Approved)
- Visibility scope:
  - All project members
  - Specific roles only
  - Specific users only

**Categories** (customizable per project):
- Architectural Drawings
- Structural Plans
- MEP Drawings
- Permits & Approvals
- Specifications
- Contracts
- Correspondence
- Invoices
- Site Photos
- Reports
- Calculations
- Custom categories (via `document_categories` table)

**Tags** (flexible):
- User-defined keywords
- Helps with search and filtering
- Autocomplete from existing tags

---

#### **Document Versioning & Revision Control**

**Key Concepts**:
- Each document group can have multiple revisions
- Only one revision is marked as "current"
- Old revisions remain accessible but archived
- Revision numbers increment (Rev 1, Rev 2, Rev 3, etc.)

**Creating a New Revision**:

**Method 1: Upload New Version**
- Select existing document group
- Click "Upload New Revision"
- Upload new file
- Enter "Changes Summary" (what's new?)
- Previous revision automatically archived
- New revision becomes current

**Method 2: Supersede Document** (`SupersedeDocumentDialog.tsx`)
- Formal superseding workflow
- Requires approval (optional)
- Links old and new documents
- Old document marked `is_superseded: true`
- New document references `superseded_by: [old_doc_id]`
- Maintains audit trail

**Revision History** (`DocumentVersionHistory.tsx`):
- Timeline view of all revisions
- Each revision shows:
  - Revision number
  - Upload date and user
  - File size
  - Changes summary
  - Download button
  - Restore button (make this revision current)
- Compare revisions (if PDF)

**Restore Previous Revision**:
- Admin/architect can restore an old revision
- Archived revision becomes current again
- Creates new activity log entry
- Notifies team

---

#### **Document Locking**

**Purpose**: Prevent concurrent edits and accidental overwrites

**Lock Mechanism**:
- User can lock a document for editing
- Locked documents cannot be:
  - Deleted
  - Superseded
  - Edited by others
- Lock shows:
  - Locked by (user)
  - Lock time
  - Lock reason (optional)

**Unlock**:
- User who locked can unlock
- Admin can force unlock
- Auto-unlock after 24 hours (configurable)

**UI Indicators**:
- Lock icon on document card
- Tooltip showing lock details
- Disabled action buttons for locked documents

---

#### **Document Preview** (`DocumentPreview.tsx`)

**Preview Capabilities**:

**PDF Files**:
- In-browser PDF viewer (using pdfjs-dist)
- Page navigation
- Zoom in/out
- Rotate pages
- Search within document
- Download original
- Print

**Images**:
- Full-size image viewer
- Zoom and pan
- Rotate
- Download original

**Office Documents** (Word, Excel, PowerPoint):
- Preview using embedded viewer (Office Online or Google Docs Viewer)
- Download to view locally if preview unavailable

**Other Files**:
- Show file icon and metadata
- Download button
- "No preview available" message

**Preview Panel**:
- Opens in sidebar or modal dialog
- Metadata sidebar:
  - Document number
  - Title
  - Category
  - Status
  - Uploaded by
  - Upload date
  - File size
  - Tags
  - Description
- Comments section (see below)
- Version history access
- Action buttons (Download, Edit, Delete, Lock, Share)

---

#### **Document Collaboration**

**Comments** (`DocumentComments.tsx`):
- Add comments to documents
- Threaded discussions
- @mention team members (triggers notification)
- Markdown formatting support
- Attach files to comments
- Edit/delete own comments
- Real-time comment updates
- Comment count badge on document

**Collaboration Panel** (`DocumentCollaboration.tsx`):
- Who's viewing (real-time presence)
- Recent activity on document
- Pending approvals
- Related documents
- Discussion threads

**Document Sharing** (`DocumentSharingDialog.tsx`):
- Share with specific users
- Share with external stakeholders (email)
- Set permission level:
  - View only
  - Comment
  - Edit
  - Full control
- Set expiration date
- Revoke access
- Share via link (with password option)
- Track who accessed

---

#### **Document Filters & Search** (`EnhancedDocumentFilters.tsx`)

**Filter Options**:
- **Category**: Multi-select categories
- **Status**: Draft, For Review, Approved, Superseded
- **File Type**: PDF, Word, Excel, Images, CAD, etc.
- **Uploaded By**: Team member selection
- **Date Range**: Upload date range picker
- **Tags**: Tag multi-select
- **Project Stage**: Design, Tender, Construction, As-Built
- **Assigned To**: Filter by assignee
- **Locked Status**: Show only locked/unlocked
- **Visibility**: Documents I can access vs. all documents

**Search**:
- Full-text search across:
  - Document titles
  - Descriptions
  - Tags
  - Comments
  - File contents (PDF text extraction)
- Search within category
- Advanced search with operators (AND, OR, NOT)
- Search history
- Saved searches

**Sort Options**:
- Name (A-Z, Z-A)
- Upload date (newest, oldest)
- File size (largest, smallest)
- Document number
- Last modified
- Most commented
- Most downloaded

---

#### **Document Actions**

**Available Actions** (permission-dependent):

**1. View/Download**
- Download original file
- Download as PDF (if supported)
- Download all revisions (ZIP)

**2. Edit Metadata** (`EditDocumentDialog.tsx`)
- Update title, description, tags
- Change category
- Change status
- Assign to team member
- Update visibility

**3. Upload New Revision**
- Replace file with new version
- Automatic revision increment

**4. Supersede**
- Formal superseding workflow
- Mark old document as superseded

**5. Lock/Unlock**
- Prevent editing by others

**6. Delete** (`DocumentDeleteConfirmDialog.tsx`)
- Soft delete (mark as deleted)
- Hard delete (admin only)
- Confirmation required
- Cannot delete if referenced by tenders/RFIs

**7. Share**
- Internal sharing with team
- External sharing via email/link

**8. Create Tender Package** (`CreateTenderPackageDialog.tsx`)
- Bundle multiple documents
- Create tender-specific package
- Link to tender
- Generate cover sheet

**9. View History** (`DocumentHistoryDialog.tsx`)
- All revisions
- All activity (views, downloads, edits)
- Audit trail

**10. Print**
- Print document directly from preview

---

#### **Document Analytics** (`DocumentAnalytics.tsx`)

**Metrics Tracked**:
- Total documents
- Documents by category
- Documents by status
- Upload trends (over time)
- Most viewed documents
- Most downloaded documents
- Storage usage (per project)
- Average document size
- User contributions (who uploads most)

**Visualizations**:
- Bar chart: Documents by category
- Pie chart: Documents by status
- Line chart: Upload trends
- Table: Top documents by views/downloads

---

#### **Document Activity Tracking** (`DocumentActivity.tsx`)

**Logged Events**:
- Document uploaded
- Document viewed
- Document downloaded
- Document edited (metadata changes)
- Revision uploaded
- Document locked/unlocked
- Document shared
- Document deleted
- Comment added
- Document superseded
- Status changed
- Assignment changed

**Activity Display**:
- Timestamp
- User (with avatar)
- Action description
- Changes made (if applicable)
- Related entities (RFI, Tender, etc.)

---

#### **Tender Package Creation**

**Purpose**: Bundle multiple documents for tender issuance

**Dialog**: `CreateTenderPackageDialog.tsx`

**Process**:
1. Select documents from project
2. Filter and search documents
3. Multi-select documents
4. Set package name
5. Add cover sheet information:
   - Tender title
   - Issue date
   - Closing date
   - Instructions to bidders
6. Generate package:
   - Creates ZIP file
   - Includes all selected documents
   - Adds cover sheet PDF
   - Links to tender record
   - Stores in `tender-documents` bucket
7. Package available for download or tender attachment

---

#### **Document List Views**

**Grid View**:
- Document cards in grid
- Large file type icons
- Thumbnail previews (for images)
- Quick actions on hover
- Responsive columns (1-4 depending on screen size)

**List View** (`DocumentListView.tsx`):
- Table format
- Columns:
  - Document Number
  - Title
  - Category
  - Status
  - File Type
  - Size
  - Uploaded By
  - Upload Date
  - Actions
- Sortable columns
- Row selection (for bulk actions)
- Expandable rows (show details)

**Folder View** (`DocumentFolder.tsx`):
- Hierarchical folder structure (optional)
- Group by category or custom folders
- Drag-and-drop between folders
- Folder-level permissions

---

#### **Bulk Document Operations**

**Bulk Actions**:
- Select multiple documents (checkbox selection)
- Available actions:
  - Download selected (as ZIP)
  - Delete selected
  - Change category
  - Change status
  - Add tags
  - Assign to user
  - Lock/unlock
  - Move to folder
  - Create package

**Bulk Upload**:
- Upload multiple files at once
- Apply same metadata to all
- Batch processing
- Progress tracking

---

#### **Document Permissions**

**Permission Levels**:
- **View**: Can view and download
- **Comment**: View + add comments
- **Edit**: View + edit metadata + upload revisions
- **Manage**: Full control (delete, share, change permissions)

**Permission Inheritance**:
- Default: All project members can view
- Custom: Set per document or document group
- Role-based: Architects have Manage by default

**Visibility Scopes**:
- **All Project Members**: Everyone on project
- **Specific Roles**: Only architects, only contractors, etc.
- **Specific Users**: Named individuals
- **Tender Participants**: Only users with tender access

---

#### **Document Storage & Technical Details**

**Supabase Storage**:
- Bucket: `documents`
- Path structure: `projects/[project_id]/documents/[doc_group_id]/[revision_id]/[filename]`
- Signed URLs for secure access (1 hour expiry)
- Public URLs for publicly shared documents

**Database Tables**:
- `document_groups`: Document group metadata
- `document_revisions`: Individual file versions
- `documents`: Legacy single-document table (deprecated)
- `document_categories`: Custom categories
- `document_shares`: Sharing permissions
- `document_events`: Activity log
- `document_approvals`: Approval workflow (optional)

**File Processing**:
- PDF text extraction for search indexing
- Image thumbnail generation
- File type detection
- Virus scanning (if configured)

---

**Key Features Summary**:
✅ Document groups with version control  
✅ Drag-and-drop upload  
✅ Auto-numbering  
✅ Categorization and tagging  
✅ Full-text search  
✅ PDF preview  
✅ Revision history  
✅ Document locking  
✅ Collaboration (comments, sharing)  
✅ Audit trails  
✅ Superseding workflow  
✅ Tender package creation  
✅ Analytics and insights  
✅ Role-based permissions  
✅ Real-time updates  

---

### 4. Messages Page (`/messages`)

**Route**: `/messages`  
**Component**: `src/pages/Messages.tsx`

**Purpose**: Real-time team communication platform with threaded conversations

**Page Layout**:
- Thread list (left sidebar, 30% width)
- Active conversation (main area, 70% width)
- Search bar (top of thread list)
- "New Thread" button (prominent)

---

#### **Message Threads**

**Thread List Display**:
- All threads user participates in
- Sorted by last message time (most recent first)
- Each thread shows:
  - Thread title
  - Last message preview (truncated)
  - Participant avatars (first 4)
  - Unread count badge
  - Timestamp (relative: "2 hours ago")
  - Pinned icon (if pinned)
  - Archived icon (if archived)
- Unread threads highlighted
- Active thread highlighted

**Thread Filtering**:
- All threads
- Unread only
- Pinned
- Archived
- By project (if multi-project)

---

#### **Create Thread Dialog** (`CreateThreadDialog.tsx`)

**Fields**:
- **Thread Title*** (required)
  - Example: "Foundation Pour Schedule"
- **Participants*** (required)
  - Multi-select from project team
  - Search by name
  - Shows role badges
  - Minimum 1 participant (besides creator)
- **Project** (auto-selected if in project context)
- **Description** (optional)
  - Thread purpose
  - Expected outcome
- **Topics/Tags** (optional)
  - Categorize thread
  - Examples: Schedule, Budget, Design, Safety

**On Create**:
- Creates record in `message_threads` table
- Adds creator and participants
- Sends notifications to participants
- Opens new thread in main view

---

#### **Conversation View**

**Message Display** (`MessageBubble.tsx` / `EnhancedMessageBubble.tsx`):

**Own Messages**:
- Aligned right
- Different background color
- "You" label or user name

**Other Messages**:
- Aligned left
- User avatar
- User name and role badge
- Timestamp

**Message Content**:
- Text content (supports line breaks)
- Markdown formatting:
  - **Bold**
  - *Italic*
  - `code`
  - Links (auto-detected and clickable)
- @mentions highlighted
- Quoted messages (if replying)

**Message Actions** (hover or long-press):
- Reply (quotes original message)
- Edit (own messages only, within 5 minutes)
- Delete (own messages only, with confirmation)
- Copy text
- React with emoji (optional)

**File Attachments**:
- Display attached files with icons
- Click to preview/download
- Multiple attachments per message
- Attachment types:
  - Documents (PDF, Word, Excel)
  - Images (inline preview)
  - CAD files
  - Other files (download link)
- Attachment metadata:
  - Filename
  - File size
  - Upload status

---

#### **Message Input** (`MessageInput.tsx`)

**Features**:
- Multi-line text area
- Auto-resize as typing
- Character counter (if limit set)
- "Attach File" button (`FileSelector.tsx`)
  - Click to browse
  - Drag-and-drop onto input area
  - Multiple file selection
  - File type validation
  - Progress indicators for uploads
- **@mention** autocomplete:
  - Type "@" to trigger
  - Dropdown of thread participants
  - Select to insert mention
  - Mentioned user gets notification
- **Emoji picker** (optional)
- "Send" button (or press Enter)
  - Shift+Enter for new line
- **Typing indicator** sent to other participants

**Quoted/Reply Message**:
- When replying, shows quoted message above input
- Click X to cancel reply
- Quoted message shown in sent message

---

#### **Real-time Features**

**Typing Indicator** (`TypingIndicator.tsx`):
- Shows when other participants are typing
- Display: "[Name] is typing..."
- Disappears after 3 seconds of inactivity
- Multiple users typing: "John, Mary, and 2 others are typing..."

**Live Message Delivery**:
- Messages appear instantly via WebSocket
- No page refresh needed
- Smooth animations on new message
- Auto-scroll to bottom on new message (if already at bottom)

**Read Receipts**:
- Track when each participant last read thread
- Stored in `message_participants.read_at`
- Display "Seen by" under message
- Unread count for each user

**Online Status**:
- Green dot for online participants
- Grey dot for offline
- "Last seen" timestamp for offline users

---

#### **Message Search** (`MessageSearch.tsx`)

**Search Functionality**:
- Search across all messages in all threads
- Real-time search (as you type)
- Search filters:
  - In current thread
  - In all threads
  - By participant
  - By date range
  - With attachments only
- Result highlighting
- Click result to jump to message in thread

**Search Results Display**:
- Thread name
- Message preview with search term highlighted
- Sender name
- Timestamp
- Click to open thread and scroll to message

---

#### **Thread Management**

**Thread Actions Menu**:
- **Pin Thread**: Keeps thread at top of list
- **Archive Thread**: Moves to archived (hide from main list)
- **Mute Notifications**: Stop notifications for this thread
- **Leave Thread**: Remove self from participants
- **Add Participants**: Add more team members
- **Remove Participants**: Remove users (creator/admin only)
- **Edit Thread**: Change title, description
- **Delete Thread**: Permanently delete (creator/admin only, with confirmation)

**Thread Settings** (gear icon):
- Notification preferences (per thread)
- Thread visibility (who can see)
- Thread permissions (who can add participants)

---

#### **Convert to Formal RFI**

**Formal Inquiry Dialog** (`FormalInquiryDialog.tsx`):

**Purpose**: Escalate casual message thread to formal RFI

**Trigger**: "Convert to RFI" button in thread

**Process**:
1. Opens dialog with pre-filled data:
   - Subject: Thread title
   - Description: Compiled thread messages
   - Attachments: All files from thread
2. User selects:
   - RFI Type (RFI, GC, GA)
   - Assigned to (recipient)
   - Priority
   - Required date
3. On submit:
   - Creates RFI record
   - Links to original message thread
   - Notifies assigned user
   - Adds "Converted to RFI [RFI_NUMBER]" message in thread
   - Optionally archives thread

**Use Case**: Thread discussion reveals need for formal documented response

---

#### **RFI Message Composer** (`RFIMessageComposer.tsx`)

**Purpose**: Create RFI directly from message interface

**Features**:
- Simplified RFI creation
- Pre-filled from thread context
- Quick send option
- Inline RFI preview

---

#### **Enhanced Message Features** (`EnhancedMessageBubble.tsx`)

**Additional Capabilities**:
- Message reactions (emoji)
- Message importance flag (mark as important)
- Forwarding messages to other threads
- Message bookmarking (save for later)
- Message translation (if international team)

---

#### **Inquiry Message** (`InquiryMessage.tsx`)

**Purpose**: Display RFI-related messages with special formatting

**Features**:
- Distinct visual style for RFI messages
- RFI status badge
- Link to full RFI details
- Quick response option

---

#### **Message Notifications**

**Notification Triggers**:
- New message in thread
- @mention of user
- Reply to user's message
- Thread participant added
- Thread title changed

**Notification Channels**:
- In-app notification center
- Browser push notification (if enabled)
- Email notification (configurable per user)
- Mobile push (if mobile app exists)

**Notification Settings**:
- Per-thread mute
- Global message notification preferences
- Quiet hours (no notifications during set times)

---

#### **Message Templates** (`message_templates` table)

**Purpose**: Save commonly used messages for quick sending

**Features**:
- Create template from existing message
- Name and save template
- Insert template into message input
- Variables/placeholders (e.g., {project_name}, {date})
- Share templates with team (optional)

**Use Cases**:
- Standard meeting reminders
- Document request templates
- Status update formats
- Safety notices

---

#### **Message Analytics** (optional future feature)

**Metrics**:
- Total messages sent
- Messages per day/week
- Most active threads
- Response time metrics
- Most active participants
- Busiest communication times

---

#### **Data Structure**

**Tables**:
- `message_threads`: Thread metadata
- `messages`: Individual messages
- `message_participants`: Thread membership and read status
- `message_templates`: Saved templates

**Message Fields**:
- `id`, `thread_id`, `sender_id`
- `content` (text)
- `attachments` (JSONB array)
- `parent_message_id` (for replies)
- `quoted_content` (quoted text from reply)
- `is_deleted`, `edited_at`
- `created_at`, `updated_at`
- `message_type` (regular, system, rfi_link)

**Thread Fields**:
- `id`, `project_id`, `title`, `description`
- `created_by`, `participants` (array of user_ids)
- `is_pinned`, `is_archived`
- `topics` (JSONB)
- `status` (active, archived)
- `created_at`, `updated_at`

---

**Key Features Summary**:
✅ Real-time messaging  
✅ Threaded conversations  
✅ File attachments  
✅ @mentions with notifications  
✅ Typing indicators  
✅ Read receipts  
✅ Message search  
✅ Convert to RFI  
✅ Message editing and deletion  
✅ Pin and archive threads  
✅ Online presence indicators  
✅ Quote and reply  
✅ Message templates  

---

### 5. RFIs Page (`/rfis`)

**Route**: `/rfis`  
**Component**: `src/pages/RFIs.tsx`

**Purpose**: Request for Information (RFI) management system for formal project inquiries and correspondence

**RFI System Overview**:
- Structured inquiry and response workflow
- Auto-numbering with company prefix
- Priority and deadline tracking
- Status management (open, in progress, closed)
- Email integration for notifications
- Audit trail for all actions
- Attachment support
- Multiple RFI types for different use cases

---

#### **RFI Types**

**1. Request for Information (RFI)**
- Formal inquiry requiring documented response
- Typical use: Clarification on drawings, specifications
- Requires response by specific date
- Tracked for compliance

**2. General Correspondence (GC)**
- Less formal communication
- General questions or updates
- May not require formal response
- Tracked for record-keeping

**3. General Advice (GA)**
- Request for professional advice or opinion
- May require expert input
- Tracked for liability purposes

**4. Message Inquiry**
- Created from message thread conversion
- Links back to original conversation
- Retains thread context

---

#### **RFI Numbering System**

**Format**: `[COMPANY_PREFIX]-[TYPE]-[SEQUENCE]`

**Examples**:
- `ACME-RFI-0001`
- `ACME-GC-0042`
- `ACME-GA-0003`

**Numbering Logic**:
1. Company prefix from user's company (e.g., "ACME")
2. RFI type abbreviation (RFI, GC, GA, MI)
3. Sequential number (padded to 4 digits)
4. Auto-incremented per company/project
5. Unique across project
6. Never reused

**Implementation**: See `rfiUtils.ts` (`generateRFINumber` function)

---

#### **RFI Creation**

**Create RFI Dialog** (`CreateRFIDialog.tsx`):

**Basic Information**:
- **RFI Type*** (required)
  - Radio buttons: RFI, GC, GA
- **Subject/Title*** (required)
  - Short descriptive title
  - Example: "Clarification on Foundation Detail - Sheet A3.2"
- **Description*** (required)
  - Detailed question or inquiry
  - Supports multi-line text
  - Markdown formatting (optional)
  - Minimum 20 characters

**Assignment**:
- **Assigned To*** (required)
  - Dropdown of project team members
  - Shows name, role, company
  - Can assign to multiple users (cc)
- **Required Date** (optional but recommended)
  - Date picker
  - Default: 7 days from creation
  - Urgency indicator based on date

**Categorization**:
- **Priority**:
  - Urgent (red) - Response needed ASAP
  - High (orange) - Important
  - Normal (yellow) - Standard
  - Low (green) - Non-critical
- **Category** (optional):
  - Design
  - Specification
  - Construction Method
  - Safety
  - Schedule
  - Budget
  - Other
- **Tags** (optional):
  - Free-text tags
  - Autocomplete from existing tags

**Attachments** (`RFIAttachmentUpload.tsx`):
- Attach relevant documents
- Reference drawings
- Photos
- Drag-and-drop or browse
- Multiple files supported
- File preview before upload
- File types: Images, PDFs, CAD, Office docs

**On Submit**:
1. Validates all required fields
2. Generates RFI number
3. Creates record in `rfis` table
4. Uploads attachments to `rfi-attachments` bucket
5. Creates initial status (Open)
6. Sends notification via `send-rfi-notification` Edge Function
7. Creates activity log entry
8. Shows success toast with RFI number
9. Redirects to RFI details view

---

#### **Enhanced RFI Form** (`EnhancedRFIForm.tsx`)

**Additional Features**:
- **Related RFIs**: Link to related inquiries
- **Reference Documents**: Link to project documents
- **Impact Assessment**:
  - Schedule impact (yes/no, estimated days)
  - Cost impact (yes/no, estimated amount)
  - Safety impact (yes/no, risk level)
- **Proposed Solution**: Submitter's suggested resolution
- **CC Recipients**: Additional notification recipients
- **Auto-save**: Saves draft every 30 seconds
- **Form validation** with inline error messages

---

#### **Advanced RFI Composer** (`AdvancedRFIComposer.tsx`)

**For Complex RFIs**:
- Multi-section form
- Drawing markup tool (annotate PDFs)
- Comparison view (existing vs. proposed)
- Impact calculator (schedule, cost)
- Approval workflow configuration
- Template selection
- Bulk RFI creation (from Excel)

---

#### **Simplified RFI Composer** (`SimplifiedRFIComposer.tsx`)

**Quick RFI Creation**:
- Minimal fields
- One-screen form
- Fast submission
- Pre-filled defaults
- For routine inquiries

---

#### **RFI List Views**

**RFI Inbox** (`RFIInbox.tsx`):

**Standard List View**:
- Table format
- Columns:
  - RFI Number (clickable)
  - Subject
  - Type badge
  - Status badge
  - Priority indicator
  - Raised By (avatar + name)
  - Assigned To (avatar + name)
  - Required Date (with urgency color)
  - Last Updated
  - Actions menu
- Sortable columns
- Row click to open details
- Unread RFIs highlighted
- Overdue RFIs highlighted in red

**Email-Style Inbox** (`EmailStyleRFIInbox.tsx`):
- Gmail/Outlook-like interface
- RFI list on left (40%)
- RFI details on right (60%)
- Preview pane
- Quick actions toolbar
- Keyboard shortcuts
- Inbox/Sent/Drafts tabs

**Categorized Inbox** (`CategorizedRFIInbox.tsx`):
- Group by status (Open, In Progress, Closed)
- Expandable sections
- Count badges per category
- Drag-and-drop to change status
- Kanban-board style

---

#### **RFI Filtering & Search**

**RFI Filters** (`RFIFilters.tsx`):

**Standard Filters**:
- **Status**: Open, In Progress, Closed
- **Type**: RFI, GC, GA, MI
- **Priority**: Urgent, High, Normal, Low
- **Assigned To**: Team member selection
- **Raised By**: Team member selection
- **Category**: Pre-defined categories
- **Date Range**: Created date, required date, closed date
- **Overdue**: Only overdue RFIs
- **Unread**: Only unread RFIs

**Smart Filters** (`RFISmartFilters.tsx`):
- **My RFIs**: Raised by me
- **Assigned to Me**: I need to respond
- **Urgent & Overdue**: Critical attention needed
- **Awaiting Response**: Open RFIs with no response
- **Recently Closed**: Last 7 days
- **High Impact**: Cost or schedule impact flagged
- **Saved Filters**: User-defined filter combinations

**Search**:
- Full-text search across:
  - RFI number
  - Subject
  - Description
  - Responses
  - Attachments (filenames)
- Search within filtered results
- Advanced search syntax
- Search history

---

#### **RFI Details View**

**RFI Details Dialog** (`RFIDetailsDialog.tsx` / `UnifiedRFIDetailsDialog.tsx`):

**Opened by clicking RFI in list**

**Header Section**:
- RFI Number (large, prominent)
- Type badge
- Status badge
- Priority indicator
- Created date and user
- Quick actions:
  - Respond
  - Edit (if owner or admin)
  - Close RFI
  - Delete
  - Print
  - Share
  - Copy link

**Information Tab**:
- **Details**:
  - Subject/Title
  - Full description
  - Category and tags
  - Assigned to (with avatar)
  - Required date (with countdown)
  - Priority
  - Impact assessment (if filled)
- **Attachments**:
  - List of attached files
  - Thumbnail preview (images)
  - Download buttons
  - View in preview pane
- **Related Items**:
  - Linked documents
  - Related RFIs
  - Related tenders
  - Linked messages

**Responses Tab** (`RFIResponsesViewer.tsx`):
- All responses in chronological order
- Each response shows:
  - Response text
  - Responder name, role, company
  - Response timestamp
  - Attachments (if any)
  - Edit/Delete (own responses only)
- Threaded responses (replies to responses)
- Add new response section:
  - Text editor
  - Attach files
  - Mark as final response
  - Submit button

**Activity Tab**:
- Full audit trail:
  - RFI created
  - Assigned to changed
  - Status changed
  - Priority changed
  - Responses added
  - Attachments added/removed
  - Edited
  - Closed
  - Reopened
- Each entry:
  - Timestamp
  - User
  - Action description
  - Details (what changed)

**Collaboration Tab** (`RFICollaborationPanel.tsx`):
- Discussion threads
- @mentions
- Internal notes (not visible to external stakeholders)
- Team member comments
- Real-time collaboration

---

#### **RFI Response System**

**Response Composer** (`RFIResponseComposer.tsx`):

**Features**:
- Rich text editor
- Attach supporting documents
- Reference other RFIs or documents
- Proposed resolution
- Impact clarification (cost, schedule)
- Mark as "Final Response" checkbox
- Save as draft
- Submit response

**Quick Respond** (`QuickRFIRespondDialog.tsx`):
- Lightweight response dialog
- Opens from RFI list (without full details)
- Pre-filled RFI context
- Quick text response
- Fast submission
- For simple acknowledgments or brief answers

**Response Notifications**:
- Email notification to RFI creator
- In-app notification
- Browser push notification
- Includes response preview
- Link to RFI

**Response Tracking**:
- Time to first response
- Total response count
- Last response date
- Response quality metrics (optional)

---

#### **RFI Status Management**

**Status Workflow**:

```
Draft → Open → In Progress → Closed
          ↑                      ↓
          └──────← Reopened ────┘
```

**Status Definitions**:

**Draft**: RFI created but not yet sent
- Editable by creator
- Not visible to assigned user
- Can be deleted without trace
- No notifications sent

**Open**: RFI submitted and awaiting response
- Notifications sent to assigned user
- Visible to project team
- Creator can edit (limited fields)
- Assigned user can respond

**In Progress**: Response work started
- Changed manually by assigned user
- Indicates active work
- Can add partial responses
- Creator sees progress

**Closed**: RFI resolved
- Final response provided
- Required date met (or waived)
- No further action needed
- Can be reopened if needed

**Reopened**: Previously closed RFI needs more information
- Reverts to Open status
- Reason for reopen required
- Notifications sent
- Original responses retained

**Status Change Logic**:
- Creator can close if satisfied
- Assigned user can close when answered
- Admin can close anytime
- Auto-close if marked "Final Response" (optional)

**Status Badge Colors**:
- Draft: Grey
- Open: Blue
- In Progress: Yellow
- Closed: Green
- Reopened: Orange

---

#### **RFI Quick Actions** (`RFIQuickActions.tsx`)

**Bulk Actions**:
- Select multiple RFIs (checkbox)
- Available actions:
  - Bulk assign to user
  - Bulk change priority
  - Bulk change status
  - Bulk close
  - Bulk delete
  - Bulk export (PDF or Excel)
  - Bulk download attachments
- Confirmation dialog before bulk operations

**Single RFI Quick Actions**:
- Respond (opens quick respond)
- Mark as read/unread
- Star/favorite
- Duplicate RFI
- Convert to GC/GA/RFI
- Copy link
- Add to dashboard

---

#### **RFI Dashboard** (`EnhancedRFIDashboard.tsx`)

**Dashboard Widgets**:

**1. RFI Summary Cards**:
- Total RFIs
- Open RFIs
- Overdue RFIs
- Closed this week
- Color-coded cards

**2. RFI Status Distribution**:
- Pie chart: RFIs by status
- Bar chart: RFIs by type
- Interactive (click to filter)

**3. Response Time Metrics**:
- Average response time
- Fastest response
- Slowest response
- On-time response rate

**4. RFI Trends**:
- Line chart: RFIs created over time
- Line chart: RFIs closed over time
- Identify patterns

**5. Top Contributors**:
- Users who create most RFIs
- Users who respond fastest
- Users with overdue RFIs

**6. Urgent & Overdue**:
- List of urgent RFIs
- List of overdue RFIs
- Quick access to critical items

**7. My RFI Summary**:
- RFIs I created (status breakdown)
- RFIs assigned to me (status breakdown)
- My response time average

---

#### **RFI Analytics** (`RFIAnalytics.tsx` / `RFIAnalyticsDashboard.tsx`)

**Comprehensive Analytics**:

**Performance Metrics** (`RFIPerformanceMetrics.tsx`):
- Total RFIs per project
- RFIs per month/quarter
- Average response time by type
- On-time closure rate
- Overdue rate
- RFI density (RFIs per project size/budget)

**Trend Analysis**:
- RFI creation trends
- Response time trends
- Category distribution over time
- Impact on project (schedule, cost)

**Team Performance**:
- RFIs by team member
- Response time by team member
- Quality of responses (subjective rating)

**Project Insights**:
- Which projects have most RFIs?
- Which categories most common?
- Which phases generate most RFIs?
- Root cause analysis (recurring issues)

**Export Reports**:
- PDF reports
- Excel exports
- Charts as images
- Email scheduled reports

---

#### **RFI Templates** (`RFITemplateManager.tsx`)

**Purpose**: Speed up RFI creation with pre-defined templates

**Template Features**:
- Template name
- Pre-filled subject pattern
- Pre-filled description template
- Default priority
- Default category
- Default required date (relative, e.g., +7 days)
- Default attachments (if applicable)

**Template Management**:
- Create template from existing RFI
- Edit templates
- Delete templates
- Share templates with project team
- Personal vs. shared templates

**Common Templates**:
- "Drawing Clarification"
- "Specification Question"
- "Material Substitution Request"
- "Construction Method Approval"
- "Safety Concern"

**Using Templates**:
- Select template when creating RFI
- Template populates form fields
- User can edit before submitting
- Saves time on repetitive RFIs

---

#### **RFI Reports** (`RFIReportGenerator.tsx`)

**Report Types**:

**1. RFI Register**:
- Complete list of all RFIs
- Columns: Number, Subject, Type, Status, Dates, Assignee
- Filterable and sortable
- Export to Excel/PDF

**2. Overdue RFIs Report**:
- All RFIs past required date
- Assignee responsibility
- Days overdue
- Impact assessment

**3. RFI Status Report**:
- Summary of open/in progress/closed
- By project, by type, by assignee
- Visual charts

**4. Response Time Report**:
- Average response times
- By user, by type, by priority
- Benchmark against targets

**5. RFI Impact Report**:
- RFIs with cost/schedule impact
- Total impact to project
- Trend over time

**Report Generation**:
- Select report type
- Choose date range and filters
- Generate (PDF, Excel, CSV)
- Download or email
- Schedule recurring reports

---

#### **Email Integration**

**RFI Email Notifications** (`RFIEmailService.ts`):

**Email Triggers**:
- New RFI assigned
- RFI response received
- RFI status changed
- RFI approaching due date (reminder)
- RFI overdue
- RFI closed
- RFI reopened

**Email Content**:
- RFI number and subject
- Priority and type badges
- Brief description
- Assigned to / Raised by
- Required date
- Direct link to RFI in platform
- "Respond Now" button
- Attachment notification (if files attached)

**Edge Function**: `send-rfi-notification`

**Email Parsing** (`EmailRFIParser.ts`):
- Reply to RFI email to create response (future feature)
- Parses email content
- Creates response in platform
- Uploads email attachments

---

#### **RFI Permissions**

**Who Can Create RFIs**:
- All project members

**Who Can Respond**:
- Assigned user
- Project architects
- Admins
- Users with "RFI Responder" permission

**Who Can Close**:
- RFI creator
- Assigned user
- Project architects
- Admins

**Who Can Edit**:
- RFI creator (before responses)
- Admins (any time)

**Who Can Delete**:
- RFI creator (if no responses)
- Admins (with confirmation)

---

#### **Advanced RFI Features**

**RFI Workflows** (Optional):
- Approval workflow before sending
- Multi-stage review (technical, cost, schedule)
- Escalation rules (if overdue)
- Delegation (assign to backup if unavailable)

**RFI Linking**:
- Link RFI to specific drawing sheet
- Link to document section
- Link to BIM element (if BIM integration)
- Link to tender line item
- Link to budget item

**Drawing Markup**:
- Annotate PDF drawings directly in RFI
- Highlight areas of concern
- Add dimensions, arrows, notes
- Attach marked-up drawing to RFI

**RFI Dependencies**:
- RFI cannot be closed until related RFI closed
- Parent-child RFI relationships
- Block project phase until critical RFIs resolved

---

#### **Data Structure**

**Tables**:
- `rfis`: Main RFI records
- `rfi_responses`: Responses to RFIs
- `rfi_attachments`: File attachments
- `rfi_templates`: Saved templates

**RFI Fields**:
- `id`, `project_id`, `rfi_number`
- `rfi_type` (RFI, GC, GA, MI)
- `subject`, `description`
- `raised_by`, `assigned_to`
- `status`, `priority`, `category`
- `required_date`, `closed_date`
- `impact_cost`, `impact_schedule`, `impact_safety`
- `tags` (array)
- `created_at`, `updated_at`

**RFI Response Fields**:
- `id`, `rfi_id`, `response_by`
- `response_text`
- `attachments` (JSONB)
- `is_final_response`
- `created_at`

---

**Key Features Summary**:
✅ Auto-numbered RFIs (COMPANY-TYPE-NNNN)  
✅ Multiple RFI types (RFI, GC, GA)  
✅ Priority and deadline tracking  
✅ Status workflow (Open → In Progress → Closed)  
✅ Rich text responses with attachments  
✅ Email notifications  
✅ Real-time collaboration  
✅ RFI templates  
✅ Advanced filtering and search  
✅ RFI analytics and reports  
✅ Bulk actions  
✅ Drawing markup (advanced)  
✅ Impact tracking (cost, schedule, safety)  
✅ Audit trail  

---

*(Continuing with remaining sections...)*

---

### 6. Tenders Page (`/tenders`)

**Route**: `/tenders`  
**Component**: `src/pages/Tenders.tsx`

**Purpose**: Complete tender/bid management system for issuing tenders to contractors and comparing submitted bids

**Tender System Overview**:
- Architects issue tenders with detailed specifications
- Contractors request access or are invited
- Access controlled by architect approval
- Contractors submit bids with line-item pricing
- Architects compare bids side-by-side
- Award contracts to winning bidders
- Full audit trail of all bid activities

---

#### **Tender Structure**

**Tender Components**:
1. **Tender Metadata**: Title, description, dates, budget
2. **Line Items**: Itemized bill of quantities (BOQ)
3. **Documents**: Drawings, specifications, contracts
4. **Access Control**: Who can view and bid
5. **Submissions**: All bids received
6. **Evaluation**: Comparison and scoring

---

#### **Tender Creation**

**Create Tender Dialog** (`CreateTenderDialog.tsx` / `EnhancedCreateTenderDialog.tsx`):

**Basic Information**:
- **Tender Title*** (required)
  - Example: "Electrical Works - Main Building"
- **Description**:
  - Scope of work
  - Special requirements
  - Exclusions
- **Project*** (required)
  - Select from user's projects
- **Trade/Category**:
  - Electrical
  - Plumbing
  - HVAC
  - Structural
  - Landscaping
  - General Building
  - Custom

**Dates**:
- **Issue Date*** (defaults to today)
- **Closing Date*** (required)
  - Date/time picker
  - Must be future date
  - Time zone displayed
- **Tender Validity Period**:
  - How long bid pricing remains valid (e.g., 90 days)
- **Expected Start Date**:
  - When work should commence
- **Expected Completion Date**:
  - Project duration

**Budget & Pricing**:
- **Budget Range** (optional):
  - Minimum amount
  - Maximum amount
  - Currency (AUD default)
  - Helps contractors assess fit
- **Pricing Method**:
  - Lump sum
  - Bill of quantities (line items)
  - Cost-plus
  - Hybrid

**On Create**:
- Generates unique 15-character tender ID
- Creates record in `tenders` table
- Status set to "Draft"
- Architect can edit before issuing

---

#### **Tender Builder / Wizard**

**Create Tender Wizard** (`CreateTenderWizard.tsx` / `EnhancedTenderWizard.tsx`):

**Multi-Step Process**:

**Step 1: Basic Details**
- As described above

**Step 2: Line Items** (`TenderLineItemsDisplay.tsx`)
- Add line items for bill of quantities
- Each line item:
  - Item number (auto or manual)
  - Description*
  - Quantity*
  - Unit* (m, m², m³, kg, hours, item, etc.)
  - Estimated rate (optional, guide for contractors)
  - Category/trade
  - Notes
- Bulk import from Excel (`TenderExcelParser.ts`)
  - Upload Excel file
  - Map columns
  - Validate data
  - Import all items at once
- Manual entry (one by one)
- Drag to reorder
- Delete items
- Subtotals by category

**Step 3: Documents** (`EnhancedDocumentGallery.tsx`)
- Select documents from project
- Filter by category (drawings, specs, etc.)
- Multi-select documents
- Create tender package
  - Bundles selected documents
  - Generates cover sheet
  - Creates ZIP file
  - Stored in `tender-documents` bucket
- Upload new documents specific to tender
- Document carousel view
- Preview documents before finalizing

**Step 4: Drawings** (`DrawingsUploadManager.tsx`)
- Upload CAD drawings
- PDF plans
- Specifications
- 3D models (if supported)
- Organize by discipline
- Set primary drawings

**Step 5: Contractor Selection**
- **Invite Contractors**:
  - Search contractor database
  - Select contractors to invite
  - Email invitations sent
- **Public Tender**:
  - Allow any contractor to request access
  - Architects approve requests
- **Prequalification** (`ContractorPrequalificationPanel.tsx`):
  - Require contractors to submit qualifications
  - Insurance certificates
  - Past project references
  - Financial capacity
  - Safety record

**Step 6: Review & Issue**
- Preview all tender details
- Review line items, documents, contractors
- Edit any section (jump back to previous steps)
- Issue tender:
  - Changes status from "Draft" to "Issued"
  - Sends notifications to invited contractors
  - Starts closing date countdown
  - Tender becomes visible to approved contractors

---

#### **Tender ID System**

**Format**: 15-character unique code

**Example**: `T2A3B4C5D6E7F8G`

**Generation**: Random alphanumeric
- Uses uppercase letters and numbers
- Collision detection (regenerates if exists)
- Short enough to communicate verbally
- Long enough to be unique

**Display**: Shown prominently on all tender pages and emails

---

#### **Line Item Management**

**Tender Line Items** (`tender_line_items` table):

**Fields**:
- `item_number`: Sequential or custom (e.g., 1.01, 1.02)
- `description`: Detailed work description
- `quantity`: Numeric value
- `unit`: Measurement unit (m, m², hours, etc.)
- `estimated_rate`: Architect's estimate (optional)
- `category`: Grouping (Earthworks, Concrete, Finishes, etc.)
- `trade`: Trade type (Electrical, Plumbing, etc.)
- `notes`: Additional information
- `specifications`: Reference to spec section

**Excel Import**:
- Service: `TenderExcelParser.ts`
- Expected columns:
  - Item Number (A)
  - Description (B)
  - Quantity (C)
  - Unit (D)
  - Rate (E) [optional]
  - Category (F)
- Parses Excel file
- Validates data types
- Handles merged cells
- Imports all valid rows
- Shows error summary for invalid rows

**Line Item Display**:
- Table view with all columns
- Edit inline (if draft)
- Total line items count
- Total estimated value (if rates provided)
- Group by category (collapsible sections)
- Export back to Excel

---

#### **Tender Documents**

**Document Package Manager** (`TenderPackageManager.tsx`):

**Package Creation**:
- Select project documents
- Bundle into tender-specific package
- Generate cover sheet:
  - Tender title and number
  - Issue date and closing date
  - Instructions to bidders
  - Contact information
  - Document list/index
- Create ZIP archive
- Store in `tender-documents` bucket

**Document Gallery** (`EnhancedDocumentGallery.tsx`):
- Visual carousel of all tender documents
- Thumbnail previews
- Document metadata
- Download individual documents
- Download entire package (ZIP)
- Document revision tracking
- Links to source project documents

**Document Types**:
- Architectural drawings
- Structural drawings
- MEP drawings
- Specifications
- General conditions
- Contract template
- Site photos
- Survey reports
- Soil reports
- Other supporting documents

---

#### **Tender Access Control**

**Access Methods**:

**1. Invite-Only** (`TenderInviteDialog.tsx`):
- Architect invites specific contractors
- Enter email addresses
- Select contractors from database
- Send invitations via `send-tender-invitation` Edge Function
- Email contains:
  - Tender details
  - Closing date
  - Link to tender
  - Instructions to submit bid

**2. Public Tender** (Open to all):
- Any contractor can view tender summary
- Must request access to view full details
- Architect approves/rejects access requests

**3. Prequalification Required**:
- Contractors submit prequalification documents
- Architect reviews qualifications
- Approved contractors gain access

**Tender Access Table** (`tender_access`):
- `tender_id`, `user_id`
- `status`: pending, approved, rejected
- `requested_at`, `approved_at`, `approved_by`

**Access Approvals** (`TenderAccessApprovals.tsx`):
- Architect dashboard showing pending requests
- Contractor information:
  - Name, company
  - License number
  - Years of experience
  - Past projects
  - References
- Approve/reject buttons
- Bulk approve
- Email notifications on decision

---

#### **Bid Submission (Contractor Side)**

**Public Bid Submission** (`PublicBidSubmission.tsx`):
- Accessible without full project access
- Contractors see tender summary
- Must sign up/log in to submit bid
- Request access if not invited

**Tender Response Page** (`/tender-response/:tenderId`):
- Shows tender details (if access granted)
- Tender documents available for download
- Line items displayed (read-only)
- Bid submission form

**Bid Submission Form** (`BidSubmissionForm.tsx`):

**Bid Information**:
- Contractor details (auto-filled from profile)
- Company name, ABN, license
- Contact information

**Line Item Pricing** (`BidLineItemEditor.tsx`):
- Table showing all tender line items
- Columns:
  - Item number
  - Description
  - Quantity
  - Unit
  - Unit Rate (contractor enters)*
  - Total (calculated: quantity × rate)
- Required: All line items must have rates
- Subtotals by category
- Grand total (auto-calculated)
- Discount field (optional, % or fixed amount)
- GST/tax calculation
- Final total

**Bid Details**:
- **Delivery Time**: Number of weeks to complete
- **Validity Period**: How long bid pricing is valid
- **Exclusions**: What's not included
- **Assumptions**: Any assumptions made
- **Alternative Pricing**: Optional alternative approaches
- **Value Engineering Suggestions**: Cost-saving ideas

**Attachments**:
- Upload supporting documents:
  - Insurance certificates
  - Safety plans
  - Methodology
  - References
  - Product brochures
- Multiple files supported

**Submit Bid**:
- All required fields validated
- Confirmation dialog (cannot edit after submit)
- Creates record in `tender_bids` table
- Creates records in `tender_bid_line_items` table
- Changes bid status from "Draft" to "Submitted"
- Sends notification to architect
- Uploads bid Excel file (if uploaded)
- Sends confirmation email to contractor

**Bid Excel Upload**:
- Contractors can upload Excel with their pricing
- Service: `BidExcelParser.ts`
- Parses Excel to extract line item rates
- Maps to tender line items
- Validates all items priced
- Service: `TenderBidFileService.ts` for file upload/download

---

#### **Bid Submission Wizard** (`TenderBidSubmissionWizard.tsx`):

**Step-by-Step Bid Process**:

**Step 1: Review Tender**
- Tender details, documents
- Confirm understanding
- Download documents

**Step 2: Price Line Items**
- Enter rates for each item
- Import from Excel option
- Validate completeness

**Step 3: Add Details**
- Delivery time, exclusions, assumptions
- Attach documents

**Step 4: Review & Submit**
- Preview complete bid
- Total cost displayed
- Edit any section (go back)
- Final submit button

---

#### **Bid Comparison (Architect Side)**

**Bids Received Section** (`BidsReceivedSection.tsx`):

**Bid List**:
- All submitted bids for tender
- Each bid shows:
  - Contractor name and company
  - Total bid amount
  - Submitted date
  - Status (Submitted, Under Review, Accepted, Rejected)
  - Actions: View, Compare, Accept, Reject

**View Bid** (`TenderBidDetailsDialog.tsx`):
- Complete bid details
- Line item breakdown
- Attachments
- Contractor information
- Notes field (architect's internal notes)
- Score/rate bid (optional)

**Enhanced Bid Comparison** (`EnhancedBidComparison.tsx`):

**Comparison Table**:
- Side-by-side comparison of all bids
- Columns: One per bidder
- Rows:
  - Total cost
  - Each line item (with contractor's rate)
  - Delivery time
  - Warranty period
  - Payment terms
  - Exclusions
  - Assumptions
- Highlight lowest price (green)
- Highlight highest price (red)
- Sort bids by total (low to high, high to low)
- Filter line items (show only significant differences)

**Comparison Metrics**:
- Price range (min to max)
- Average price
- Standard deviation
- Value for money score (if configured)
- Compliance score (if configured)

**Export Comparison**:
- Export to Excel (all bids, all line items)
- Export to PDF (comparison report)
- Print comparison table

---

#### **Tender Comparison Dashboard** (`TenderComparisonDashboard.tsx`):

**Visual Comparison**:
- Bar chart: Total cost per bidder
- Radar chart: Multi-criteria comparison (price, time, quality, etc.)
- Line chart: Price distribution across line items
- Heatmap: Identify outliers

**Scoring System**:
- Assign weights to criteria:
  - Price (e.g., 40%)
  - Delivery time (20%)
  - Quality/experience (20%)
  - Safety record (10%)
  - Methodology (10%)
- Auto-calculate weighted scores
- Rank bidders by total score
- Recommend top bidder

---

#### **Tender Review Dashboard** (`TenderReviewDashboard.tsx`):

**Comprehensive Evaluation**:
- All bids summary
- Evaluation criteria checklist
- Compliance matrix (did they meet all requirements?)
- Risk assessment
- Reference checks
- Financial checks
- Recommendation summary
- Decision log

---

#### **Bid Evaluation Workflow** (`BidEvaluationWorkflow.tsx`):

**Multi-Stage Review**:

**Stage 1: Compliance Check**
- All line items priced?
- All required documents submitted?
- Meets minimum qualifications?
- Within budget range?
- Non-compliant bids marked

**Stage 2: Technical Evaluation**
- Methodology review
- Quality assessment
- Risk identification
- Assign technical score

**Stage 3: Commercial Evaluation**
- Price analysis
- Payment terms review
- Delivery time assessment
- Assign commercial score

**Stage 4: Reference Checks**
- Contact references
- Verify past project claims
- Check licensing/insurance
- Assign reference score

**Stage 5: Final Selection**
- Weighted scoring
- Committee review (if applicable)
- Board approval (if required)
- Award decision

---

#### **Award Contract**

**Award Process**:
1. Architect selects winning bid
2. Tender status changed to "Awarded"
3. Winning bid status changed to "Accepted"
4. All other bids status changed to "Not Successful"
5. Notifications sent:
   - Winner: Congratulations email with next steps
   - Others: Thank you email, encouragement to bid again
6. Contract generation (if integrated)
7. Financial records updated (project budget, etc.)
8. Create change order (if tender amount differs from budget)

**Post-Award**:
- Winning bidder added to project team (if not already)
- Role assigned (Contractor)
- Access to project documents granted
- Handoff to project execution

---

#### **Tender Status Workflow**

```
Draft → Issued → Closed → Under Review → Awarded
                     ↓
                 Cancelled
```

**Status Definitions**:

**Draft**: Tender being created
- Editable by architect
- Not visible to contractors
- No closing date countdown

**Issued**: Tender published and open for bids
- Visible to invited/approved contractors
- Closing date countdown active
- Contractors can submit bids
- Architect can edit (limited fields)

**Closed**: Closing date passed
- No new bids accepted
- Submitted bids visible to architect
- Architect reviews submissions

**Under Review**: Bids being evaluated
- Architect comparing and scoring bids
- May request clarifications from contractors
- Decision pending

**Awarded**: Contract awarded to winning bidder
- Winner selected
- Notifications sent
- Tender complete

**Cancelled**: Tender cancelled before award
- Reason required
- All bidders notified
- Bids may be returned/deleted

---

#### **Contractor Prequalification** (`ContractorPrequalificationPanel.tsx`)

**Prequalification Form**:
- Company information
- Years in business
- Annual revenue
- Number of employees
- Licensing and certifications
- Insurance details:
  - Public liability
  - Professional indemnity
  - Workers compensation
- Safety record (lost time incidents, etc.)
- Financial capacity (bonding limit, credit rating)
- Previous projects:
  - Project name, location
  - Value
  - Client reference
  - Completion date
- Equipment and resources
- Key personnel CVs
- Environmental/sustainability credentials

**Submission**:
- Stored in `contractor_prequalifications` table
- Architect reviews
- Approve/reject with comments
- Approved contractors gain tender access

---

#### **Tender Analytics** (`TenderAnalytics.tsx`)

**Metrics**:
- Total tenders issued
- Average bids per tender
- Average bid amount
- Lowest/highest bids
- Time to award (from issue to award date)
- Tender success rate (awarded vs. cancelled)
- Contractor participation rate
- Budget accuracy (tender estimate vs. winning bid)

**Trends**:
- Tender activity over time
- Price trends (are bids increasing/decreasing?)
- Contractor performance (on-time, on-budget)

**Insights**:
- Which trades most competitive?
- Which contractors most responsive?
- Budget variance patterns
- Optimal tender duration

---

#### **Tender List View** (`TenderListView.tsx`)

**Tender Card** (`TenderCard.tsx` / `EnhancedTenderCard.tsx`):
- Tender title
- Tender ID
- Status badge (color-coded)
- Closing date (with countdown if open)
- Number of bids received
- Budget range (if disclosed)
- Quick actions:
  - View details
  - View bids (if architect)
  - Submit bid (if contractor)
  - Edit (if draft)
  - Clone
  - Cancel

**Filters**:
- Status (Draft, Issued, Closed, Awarded)
- Trade/category
- Date range
- Budget range
- My tenders (created by me)
- Tenders I can bid on (contractor view)

---

#### **Tender Details View** (`TenderDetailsView.tsx` / `TenderDetailsDialog.tsx`)

**Tabs**:

**1. Overview**
- All tender information
- Line items summary
- Documents list
- Dates and budget
- Edit button (if draft and owner)

**2. Line Items**
- Complete bill of quantities
- View mode (contractors)
- Edit mode (architect, if draft)

**3. Documents**
- All tender documents
- Document carousel
- Download individual or package
- Preview documents

**4. Bids** (Architect only)
- All received bids
- Bid comparison
- Evaluation tools

**5. Activity**
- Tender history:
  - Created
  - Issued
  - Access granted to contractors
  - Bids submitted
  - Status changes
  - Awarded
- Full audit trail

**6. Settings** (Architect only)
- Edit tender details (if not closed)
- Extend closing date
- Cancel tender
- Re-issue tender
- Clone tender

---

#### **Tender Invitation System**

**Join Tender Page** (`/join-tender/:tenderId`):
- Public page accessible via link
- Shows tender summary (title, category, closing date)
- "Request Access" button
- If logged in: Creates access request
- If not logged in: Prompts to sign up/log in
- Architect notified of new request

**Tender Join Section** (`TenderJoinSection.tsx`):
- Embedded in tender details page
- Shows access status:
  - Pending approval
  - Approved
  - Rejected
- Re-request option if rejected

---

#### **Tender Export & Reports**

**Tender Export** (`tenderExportUtils.ts`):
- Export tender details to Excel
- Export line items to Excel
- Export all bids to Excel (comparison)
- Generate tender PDF (`tenderPDFGenerator.ts`):
  - Cover page
  - Line items
  - Instructions to bidders
  - Terms and conditions

**Tender Package Generation** (`tenderPackageGenerator.ts`):
- Bundles all tender documents
- Generates cover sheet
- Creates ZIP file
- Suitable for distribution to contractors

---

#### **Tender Location Map** (`TenderLocationMap.tsx`)

**Map Features**:
- Shows project location
- Leaflet interactive map
- Markers for site access points
- Nearby facilities (if relevant)
- Site photos linked to map
- Useful for contractors assessing logistics

---

#### **Tender Document Carousel** (`TenderDocumentCarousel.tsx`)

**Visual Document Browser**:
- Carousel/slider of all tender documents
- Thumbnail previews
- Click to enlarge/download
- Navigation arrows
- Document metadata tooltips
- Fullscreen view option

---

#### **Advanced Tender Features**

**Tender Packages** (`TenderPackageManager.tsx` / `TenderPackageTracker.tsx`):
- Multiple tender packages for same project
- Track different trade packages separately
- Link packages together
- Package dependencies

**Tender Templates**:
- Save tender as template
- Reuse for similar projects
- Pre-defined line items
- Standard documents
- Typical timeline

**Variations During Tender**:
- Issue addendums
- Update line items
- Extend closing date
- Notify all bidders
- Track acknowledgment of addendums

**Clarifications**:
- Contractors can request clarifications
- Architect responds
- All clarifications shared with all bidders (fairness)
- Logged in tender activity

**Alternative Bids**:
- Allow contractors to submit alternative proposals
- "Base bid" + "Alternative bid"
- Compare base and alternatives

---

#### **Data Structure**

**Tables**:
- `tenders`: Main tender records
- `tender_line_items`: Bill of quantities
- `tender_bids`: Submitted bids
- `tender_bid_line_items`: Bid pricing
- `tender_access`: Access control
- `tender_package_documents`: Document associations
- `contractor_prequalifications`: Prequalification data

**Tender Fields**:
- `id`, `tender_id` (15-char unique code)
- `project_id`, `title`, `description`
- `issued_by`, `issue_date`, `closing_date`
- `status`, `budget_range`, `trade_category`
- `created_at`, `updated_at`

**Tender Bid Fields**:
- `id`, `tender_id`, `contractor_id`
- `total_price`, `delivery_time_weeks`
- `status`, `submitted_at`
- `notes`, `attachments` (JSONB)
- `excel_file_path` (bid Excel upload)

---

**Key Features Summary**:
✅ 15-character unique tender IDs  
✅ Bill of quantities with Excel import/export  
✅ Document package bundling  
✅ Access control (invite or public)  
✅ Contractor prequalification  
✅ Bid submission with line-item pricing  
✅ Side-by-side bid comparison  
✅ Evaluation workflow with scoring  
✅ Award contracts  
✅ Tender analytics  
✅ Audit trail  
✅ Email notifications  
✅ Drawing upload and management  
✅ Tender templates  
✅ Clarifications and addendums  

---

### 6.7 Financials Page (`/financials`)

**Purpose**: Complete financial tracking and management for construction projects

**Route Protection**: Requires authentication + complete profile

---

#### **Financial Overview Dashboard**

**Budget Overview** (`BudgetOverview.tsx`):
- Total contract value display
- Original budget vs. revised budget
- Total spent to date
- Remaining budget
- Budget variance (over/under)
- Visual progress indicator
- Budget breakdown by category
- Alerts for budget overruns

**Contract Summary** (`ContractSummaryOverview.tsx`):
- Contract number and details
- Contract value
- Contract start and end dates
- Payment terms
- Contract status (active, completed, terminated)
- Contract parties (client, contractor)
- Contract documents link
- Key milestones

---

#### **Budget Management**

**Cost Breakdown** (`CostBreakdown.tsx`):
- Pie chart or bar chart of costs by category
- Categories:
  - Labor costs
  - Materials
  - Equipment
  - Subcontractors
  - Overheads
  - Contingencies
- Drill-down to individual items
- Export to Excel/PDF
- Visual comparison (budgeted vs. actual)

**Line Item Budgets** (`LineItemBudgets.tsx`):
- Detailed line-by-line budget tracking
- Table with columns:
  - Item number
  - Description
  - Category/trade
  - Quantity, Unit
  - Rate, Total
  - Contract budget
  - Revised budget (if changed)
  - Total claimed to date
  - Balance to claim
  - Percentage complete
  - Forecast to complete
  - Notes
- Inline editing capabilities
- Add/remove line items
- Import from tender
- Bulk update operations
- Filter by category, status
- Sort by any column
- Total calculations at bottom

**Line Item Importer** (`LineItemImporter.tsx`):
- Import budgets from Excel
- Template download
- Column mapping
- Data validation
- Preview before import
- Error reporting
- Bulk insert
- Update existing items

---

#### **Progress Claims**

**Progress Claims Section** (`ProgressClaimsSection.tsx`):
- List of all progress claims
- Claim number, date, status
- Total amount (excl GST, incl GST)
- Payment received
- Outstanding balance
- Create new claim button
- Claim details dialog

**Create Progress Claim**:
- Claim number (auto-generated)
- Claim date
- Period covered (month/dates)
- Select line items to claim:
  - Current claim amount
  - Previous claims
  - Total to date
  - Percentage complete
- Subtotals:
  - Total works to date
  - Less previous claims
  - **This claim amount**
- Variations included
- GST calculation
- Grand total
- Attach supporting documents
- Submit for review/approval

**Claims History** (`ClaimsHistoryTable.tsx`):
- Chronological list of claims
- Status tracking (draft, submitted, approved, paid)
- Payment dates
- Outstanding amounts
- Retention amounts
- Export to PDF (claim form)

---

#### **Invoices & Payments**

**Invoices Section** (`InvoicesSection.tsx`):
- List of all invoices
- Invoice number, date, amount
- Vendor/supplier name
- Status (draft, sent, paid, overdue)
- Due date
- Payment status
- Attached documents
- Create invoice button
- Filter by status, vendor, date
- Export to accounting software

**Create Invoice Form**:
- Invoice number (auto or manual)
- Invoice date
- Vendor/supplier details
- Line items (description, qty, rate, total)
- Subtotal
- Tax/GST
- Total amount
- Due date
- Payment terms
- Notes
- Attach PDF/images
- Link to budget category
- Submit

**Payments Section** (`PaymentsSection.tsx`):
- List of all payments made
- Payment date, amount, method
- Recipient
- Reference number
- Linked invoice
- Payment status
- Bank account details
- Reconciliation status
- Export to Excel

**Record Payment Form**:
- Payment date
- Amount
- Payment method (bank transfer, check, cash, card)
- Reference/transaction number
- Recipient details
- Link to invoice(s)
- Bank account
- Notes
- Upload receipt/confirmation

---

#### **Change Orders & Variations**

**Change Orders Section** (`ChangeOrdersSection.tsx`):
- List of all change orders
- Change order number
- Title and description
- Financial impact (+ or -)
- Timeline impact (days)
- Status (pending, approved, rejected)
- Requested by, approved by
- Approval date
- Link to variation
- Create change order button

**Create Change Order**:
- CO number (auto-generated)
- Title
- Description of change
- Reason for change
- Financial impact (cost increase/decrease)
- Timeline impact (days added/removed)
- Requested by
- Supporting documents
- Submit for approval

**Variations Detailed Section** (`VariationsDetailedSection.tsx`):
- Variation number
- Description
- Original scope
- Changed scope
- Cost impact
- Time impact
- Status
- Approval workflow
- Linked change order
- Linked claims (if claimed)
- Audit trail

---

#### **Payment Stages & Milestones**

**Payment Schedule Stages** (`PaymentScheduleStages.tsx`):
- Milestone-based payment schedule
- Table showing:
  - Stage number
  - Stage name (e.g., "Foundation Complete", "Framing Complete")
  - Percentage of contract
  - Amount
  - Completion criteria
  - Status (not started, in progress, complete, paid)
  - Actual completion date
  - Payment date
- Progress visualization
- Mark stage as complete
- Request payment
- Link to progress claim

**Progress Billing**:
- Automated payment triggers
- Milestone tracking
- Percentage complete vs. payment
- Retentions and holdbacks
- Final payment release

---

#### **Financial Forecasting**

**Cashflow Forecast** (`CashflowForecast.tsx`):
- Monthly/weekly cash flow projection
- Chart showing:
  - Expected income (progress claims)
  - Expected expenses (invoices, payments)
  - Net cashflow
  - Cumulative cashflow
- Forecast vs. actual comparison
- Identify cashflow gaps
- Scenario planning
- Export forecast

**Cashflow Items**:
- Expected income items:
  - Progress claim payments
  - Retention releases
  - Variation approvals
  - Client contributions
- Expected expense items:
  - Supplier invoices
  - Subcontractor payments
  - Equipment rentals
  - Labor costs
  - Overheads

---

#### **Client Contributions**

**Client Contributions Section** (`ClientContributionsSection.tsx`):
- Owner-supplied materials/equipment
- Owner payments/deposits
- Track client contributions:
  - Contribution type
  - Description
  - Expected amount
  - Received amount
  - Expected date
  - Received date
  - Status (expected, received, overdue)
  - Payment method
  - Reference number
- Total contributions
- Impact on project budget

---

#### **Financial Reports & Analytics**

**Financial Analytics**:
- Budget performance chart (plan vs. actual)
- Cash flow chart
- Invoice aging report
- Payment history
- Variation impact analysis
- Cost per trade/category
- Profitability analysis
- Forecast to complete

**Export Capabilities**:
- Export to Excel (all financial data)
- Export to PDF (reports, invoices, claims)
- Export to accounting software (CSV)
- Print-friendly formats

---

#### **Permissions**

- **View Financials**: All project members can view
- **Edit Budget**: Architect, Builder (project creator)
- **Create Claims**: Builder, Contractor
- **Approve Claims**: Architect, Homeowner
- **Record Payments**: Architect, Builder
- **Create Invoices**: Builder, Contractor
- **Approve Change Orders**: Architect

---

**Key Features Summary**:
✅ Budget tracking with line-item detail  
✅ Progress claims with GST calculation  
✅ Invoice and payment management  
✅ Change orders and variations  
✅ Milestone-based payment schedule  
✅ Cashflow forecasting  
✅ Client contributions tracking  
✅ Financial reports and analytics  
✅ Excel import/export  
✅ Audit trail for all transactions  
✅ Real-time budget updates  
✅ Role-based financial permissions  

---

### 6.8 Calendar Page (`/calendar`)

**Purpose**: Project scheduling, events, meetings, and deadlines

**Route Protection**: Requires authentication + complete profile

---

#### **Calendar Views**

**Modern Calendar** (`ModernCalendar.tsx`):
- Full calendar interface
- Monthly view (primary)
- Weekly view option
- Daily view option
- Agenda/list view
- Event color coding by type
- Multi-project event display
- Today indicator
- Navigate between months
- Quick date picker
- Event count badges on dates
- Responsive mobile layout

**Calendar Widget** (`CalendarWidget.tsx`):
- Compact calendar for dashboard
- Shows current month
- Highlights days with events
- Click date to see events
- Quick event creation

**Agenda View** (`AgendaView.tsx`):
- List of upcoming events
- Grouped by date
- Shows event details:
  - Title
  - Time
  - Location
  - Project
  - Attendees
  - Category
  - Priority
- Filter by date range
- Filter by project
- Filter by event type
- Search events

---

#### **Event Management**

**Create Event**:
- Event title (required)
- Description
- Start date/time
- End date/time (optional)
- All-day event toggle
- Project association
- Event category:
  - Meeting
  - Deadline
  - Milestone
  - Site visit
  - Inspection
  - Delivery
  - Other
- Location
- Meeting link (Zoom, Teams, etc.)
- Priority (high, medium, low)
- Attendees:
  - Select from project team
  - Add external emails
- Reminder:
  - 15 min before
  - 30 min before
  - 1 hour before
  - 1 day before
  - Custom
- Recurring event:
  - Daily
  - Weekly
  - Monthly
  - Custom pattern
- Event status (scheduled, completed, cancelled)
- Notes
- Save

**Edit Event**:
- Update any field
- Delete event
- Mark as complete
- Cancel event
- Send update notifications

**Event Details View**:
- Full event information
- Attendees list with RSVP status
- Edit/delete buttons
- Quick actions:
  - Join meeting (if link)
  - Get directions (if location)
  - Add to personal calendar
  - Share event

---

#### **Event Types & Categories**

**Event Categories**:
- **Meetings**: Team meetings, client meetings, contractor meetings
- **Deadlines**: RFI due dates, tender closing, submission deadlines, payment due dates
- **Milestones**: Project phases, completion dates, handover
- **Site Visits**: Inspections, walkthroughs, surveys
- **Deliveries**: Material deliveries, equipment arrivals
- **Inspections**: Building inspections, compliance checks
- **Other**: Custom categories

**Color Coding**:
- Each category has distinct color
- Visual differentiation on calendar
- Customizable colors per user

---

#### **Integration with Other Modules**

**Automatic Event Creation**:
- RFI due dates → Calendar events
- Tender closing dates → Calendar events
- Meeting scheduled in messages → Calendar event
- Payment due dates → Calendar events
- Milestone dates → Calendar events
- Inspection dates → Calendar events

**Event Notifications**:
- Email reminder before event
- In-app notification
- Browser notification (if permitted)
- SMS reminder (optional)

---

#### **Calendar Features**

**Filtering**:
- Filter by project
- Filter by category
- Filter by attendee
- Filter by status
- Show/hide completed events
- Show only my events

**Search**:
- Search event titles
- Search descriptions
- Search locations
- Date range search

**Sharing**:
- Share event with team
- Export to .ics file
- Add to Google Calendar
- Add to Outlook
- Print calendar

**Conflict Detection**:
- Warns if overlapping events
- Shows conflicting events
- Suggests alternative times

**Real-time Updates**:
- Live sync across devices
- Instant updates when events change
- Team member's changes reflected immediately

---

**Database**:
- **Table**: `calendar_events`
- **Fields**:
  - `id`, `title`, `description`
  - `start_datetime`, `end_datetime`
  - `project_id`, `created_by`
  - `category`, `location`, `meeting_link`
  - `attendees` (JSONB array)
  - `external_attendees` (email addresses)
  - `priority`, `status`
  - `reminder_minutes`
  - `is_meeting` (boolean)
  - `created_at`, `updated_at`

---

**Key Features Summary**:
✅ Full calendar interface with multiple views  
✅ Event creation and management  
✅ Meeting scheduling with attendees  
✅ Automatic event creation from RFIs, tenders  
✅ Event reminders and notifications  
✅ Color-coded event categories  
✅ Calendar sharing and export  
✅ Conflict detection  
✅ Real-time synchronization  
✅ Mobile responsive  

---

### 6.9 To-Do List Page (`/todo-list`)

**Purpose**: Personal task management for users

**Route Protection**: Requires authentication + complete profile

---

#### **Task Management**

**Task List View**:
- All user's tasks displayed
- Task checkbox (mark complete)
- Task title
- Due date
- Priority indicator
- Project association
- Category/tag
- Add new task button
- Completed tasks (collapsible section)

**Create Task**:
- Task title (required)
- Description (optional)
- Due date (optional)
- Priority (high, medium, low, none)
- Project link (optional)
- Category/tags
- Assignee (self or team member)
- Reminder date
- Save

**Task Details**:
- Full description
- Created date
- Due date
- Priority
- Status
- Linked project
- Notes
- Edit button
- Delete button
- Mark complete

**Task Actions**:
- Mark as complete/incomplete
- Edit task
- Delete task
- Duplicate task
- Snooze (postpone due date)
- Convert to RFI or project issue

---

#### **Task Organization**

**Filtering**:
- Show all tasks
- Show only incomplete
- Show only completed
- Filter by priority
- Filter by project
- Filter by due date
- Filter by category
- Overdue tasks only
- Today's tasks only
- This week's tasks

**Sorting**:
- Sort by due date
- Sort by priority
- Sort by created date
- Sort by alphabetical
- Sort by project

**Categories/Tags**:
- User-defined categories
- Color-coded tags
- Quick filter by tag
- Examples: "Follow-up", "Urgent", "Awaiting response", "Admin", etc.

---

#### **Task Notifications**

**Reminders**:
- Email reminder on due date
- In-app notification
- Overdue task alerts
- Daily digest of tasks

**Integration**:
- Link tasks to projects, RFIs, documents
- Create tasks from messages
- Create tasks from RFI responses

---

**Database**:
- **Table**: `todos`
- **Fields**:
  - `id`, `user_id`, `project_id`
  - `title`, `description`
  - `completed` (boolean)
  - `due_date`
  - `priority`
  - `category`, `tags`
  - `reminder_date`
  - `created_at`, `updated_at`

---

**Key Features Summary**:
✅ Simple task creation and management  
✅ Due dates and priorities  
✅ Project association  
✅ Categories and tags  
✅ Task reminders  
✅ Filter and sort  
✅ Completed task tracking  
✅ Real-time sync  

---

## 7. Project Invitation System

### Purpose
Allow architects and project creators to invite users to join projects via email or shareable links.

---

### 7.1 Project Invite Page (`/project-invite/:token`)

**Purpose**: Accept project invitations via unique token link

**Flow**:
1. User clicks invitation link from email
2. If not logged in → redirect to auth page (with return URL)
3. If logged in → show project details
4. User clicks "Accept Invitation"
5. User added to project team
6. Redirect to project page

**Components**:
- **ProjectInvitationLink**: Display invitation details
- **Project information preview**:
  - Project name
  - Project description
  - Project address
  - Project creator
  - Role they're being invited as
- **Accept/Decline buttons**
- **Error handling for invalid/expired tokens**

**Database**:
- **Table**: `invitations`
- **Fields**: `id`, `token`, `email`, `project_id`, `role`, `inviter_id`, `status`, `expires_at`

---

### 7.2 Project Join Page (`/project-join/:projectId`)

**Purpose**: Request to join a public project or view join invitation

**Flow**:
1. User navigates to project join URL
2. View project details (limited info)
3. Click "Request to Join" or "Join Now" (if open)
4. Join request submitted
5. Project admin receives notification
6. Admin approves/rejects
7. User receives notification

**Components**:
- **ProjectJoinSection**: Join request interface
- Project preview
- Join button
- Status message (pending, approved, rejected)

---

### 7.3 Accept Invitation Page (`/accept-invitation`)

**Purpose**: Generic invitation acceptance handler

**Handles**:
- Email-based invitations
- Token validation
- Auto-login if needed
- Project linking

---

### 7.4 Invitation Features

**Invitation Methods**:
1. **Email Invitation**:
   - Admin enters email address and role
   - System sends email with link
   - Edge function: `send-team-invitation`
   - Token-based authentication
   - Expiration (7 days default)

2. **Shareable Link**:
   - Admin generates invitation link
   - Copy link to clipboard
   - Share via any channel
   - Same token system
   - Link can be regenerated (invalidates old)

**Invitation Management**:
- **Pending Invitations Dialog**: View all sent invitations
- Invitation status (pending, accepted, expired, rejected)
- Resend invitation
- Cancel invitation
- Track who invited whom

**Database Tables**:
- `invitations`: Tracks all project invitations
- `project_pending_invitations`: Pre-registration invitations (users who don't have accounts yet)
- `project_join_requests`: User-initiated join requests

**Edge Functions**:
- `send-team-invitation`: Sends invitation emails
- `link-pending-projects`: Links users to projects they were invited to before registration
- `generate-invite-link`: Generates secure invitation tokens

---

**Key Features Summary**:
✅ Email invitations with expiration  
✅ Shareable invitation links  
✅ Token-based security  
✅ Auto-linking after registration  
✅ Pending invitation management  
✅ Join request system  
✅ Role assignment on invitation  
✅ Resend and cancel invitations  

---

## 8. Tender Invitation System

### Purpose
Allow tender creators to invite contractors to submit bids, or allow contractors to request access to tenders.

---

### 8.1 Join Tender Page (`/join-tender/:tenderId`)

**Purpose**: Contractor requests access to a tender

**Flow**:
1. Contractor receives tender link or finds tender
2. Navigates to join page
3. Views tender details (limited information):
   - Tender title
   - Project name
   - Closing date
   - Brief description
   - Required trades
4. Clicks "Request Access"
5. Access request submitted
6. Tender creator receives notification
7. Creator approves/rejects access
8. Contractor receives notification
9. If approved → can view full tender and submit bid

**Components**:
- **TenderJoinSection**: Request access interface
- Tender preview card
- Request access button
- Status indicator (pending, approved, rejected)
- Company information form (if required)

---

### 8.2 Tender Response Page (`/tender-response/:tenderId`)

**Purpose**: Contractor submits bid to tender

**Flow**:
1. Approved contractor navigates to response page
2. Views full tender details
3. Fills out bid submission form:
   - Company details (pre-filled from profile)
   - Total bid amount
   - Line item pricing (matches tender line items)
   - Delivery timeline
   - Notes/comments
   - Alternative proposals
   - Upload bid documents/Excel
4. Submits bid
5. Confirmation shown
6. Tender creator receives notification
7. Contractor can view/edit bid until closing date

**Components**:
- **TenderResponse** page component
- **PublicBidSubmission**: External bid form
- **BidSubmissionForm**: Bid entry interface
- **TenderBidSubmissionWizard**: Multi-step bid wizard
- Tender documents viewer
- Line items pricing table
- Excel upload for pricing
- Bid summary and total
- Submit button

---

### 8.3 Tender Access Control

**Access Levels**:
1. **Invite-Only Tenders**:
   - Tender creator sends invitations
   - Only invited contractors can access
   - Invitation via email or link
   - Approval required before full access

2. **Public Tenders**:
   - Visible to all contractors
   - Anyone can request access
   - Approval may still be required
   - Prequalification criteria

3. **Prequalification Required**:
   - Contractors submit prequalification form
   - Experience, certifications, insurance
   - Financial capacity
   - References
   - Previous projects
   - Creator reviews and approves

**Tender Invitations**:
- **TenderInviteDialog**: Send invitations to contractors
- Select contractors from database
- Enter external contractor emails
- Customizable invitation message
- Track invitation status
- Reminder emails

**Access Management**:
- **TenderAccessApprovals**: Manage access requests
- List of pending requests
- View contractor details
- Approve/reject access
- Bulk approval actions
- Notification to contractors

---

### 8.4 Tender Documents

**Document Access**:
- Tender package documents visible to approved contractors
- Document gallery with preview
- Download all documents as ZIP
- Document versioning
- Addendums and clarifications

**Components**:
- **EnhancedDocumentGallery**: Visual document browser
- **TenderDocumentCarousel**: Swipeable document viewer
- **DocumentCreatorDialog**: Create tender documents
- **DrawingsUploadManager**: CAD drawing management

---

### 8.5 Contractor Prequalification

**Prequalification Process**:
1. Contractor fills out prequalification form:
   - Company details
   - Years of experience
   - Trade specializations
   - Licenses and certifications
   - Insurance details (liability, workers comp)
   - Financial capacity
   - Bank references
   - Previous project references
   - Upload company documents
2. Submit for review
3. Tender creator reviews
4. Approve/reject with notes
5. Approved contractors can bid

**Components**:
- **ContractorPrequalificationPanel**: Prequalification form and review
- Company profile display
- Document upload
- Reference management
- Review and approval interface

**Database**:
- **Table**: `contractor_prequalifications`
- **Fields**: `contractor_id`, `tender_id`, `status`, `experience_years`, `certifications`, `insurance_details`, `financial_capacity`, `previous_projects`, `contractor_references`, `documents`, `reviewed_by`, `reviewed_at`, `review_notes`

---

**Key Features Summary**:
✅ Tender access request system  
✅ Invitation-based or public tenders  
✅ Contractor prequalification  
✅ Bid submission interface  
✅ Line-item pricing entry  
✅ Document access control  
✅ Excel upload for bids  
✅ Access approval workflow  
✅ Email notifications  
✅ Audit trail  

---

## 9. Admin Pages (Admin Role Only)

### Purpose
System administration, user management, monitoring, and configuration for users with admin role.

**Access**: Only users with `user_roles.role = 'admin'` can access these pages.

---

### 9.1 Admin Login (`/admin/login`)

**Purpose**: Separate authentication page for admin access

**Features**:
- Admin-specific login form
- Enhanced security checks
- Admin session management
- Redirect to admin dashboard on success
- Separate from regular user auth

**Components**:
- **AdminAuth**: Admin login interface
- Security validation
- Rate limiting
- Activity logging

---

### 9.2 Admin Dashboard (`/admin/dashboard`)

**Purpose**: Central hub for system administration and monitoring

**Layout**:
- **AdminLayout**: Wrapper with admin sidebar and header
- **AdminSidebar**: Navigation menu
- **AdminHeader**: Top bar with system status

**Dashboard Widgets** (all real-time):

#### System Overview
- **DashboardOverviewWidget**: Key metrics at a glance
  - Total users (approved, pending)
  - Total projects
  - Active projects
  - Total documents
  - Total RFIs
  - Active tenders
  - System health status
  - Server uptime
  - Today's activity count

#### System Health
- **SystemHealthWidget**: Infrastructure monitoring
  - Supabase status (operational, degraded, down)
  - Database status
  - API response time
  - Storage status
  - Edge functions status
  - Error rate
  - Uptime percentage
  - Health score (0-100)
  - Alerts and warnings

#### User Activity
- **UserActivityCard**: User engagement metrics
  - Active users now (online)
  - Active users today
  - Active users this week
  - New signups today
  - Pending approvals count
  - User growth chart
  - Most active users
  - User session times
  - Online/offline status indicators

#### API Monitoring
- **APIMonitoringCard**: Supabase API health
  - API uptime
  - Request count (last hour, today)
  - Average response time
  - Error rate
  - Slow queries
  - Rate limit status
  - API endpoint status
  - Request distribution chart

#### Database Performance
- **DatabasePerformanceCard**: Database metrics
  - Database size
  - Table sizes
  - Row counts
  - Active connections
  - Connection pool status
  - Query performance
  - Slow queries log
  - Index usage
  - Cache hit rate
  - Database CPU and memory

#### Edge Functions
- **EdgeFunctionsCard**: Serverless function monitoring
  - Function execution count
  - Average execution time
  - Error rate by function
  - Cold starts
  - Function logs
  - Deployment status
  - Function list with metrics
  - Recent errors

#### Storage Overview
- **StorageOverviewCard**: File storage metrics
  - Total storage used
  - Storage by bucket
  - File count by bucket
  - Recent uploads
  - Large files
  - Storage growth trend
  - Bucket quotas
  - Bandwidth usage

#### Security Overview
- **SecurityOverviewCard**: Security monitoring
  - Failed login attempts (last hour, today)
  - Suspicious activity alerts
  - Rate limit violations
  - CSRF token failures
  - Recent security events
  - IP blocks
  - Security score
  - Vulnerabilities detected

#### Email Monitoring
- **EmailMonitoringDashboard**: Email delivery tracking
  - Emails sent (today, this week)
  - Delivery rate
  - Bounce rate
  - Failed deliveries
  - Email queue status
  - Email types (invitation, notification, RFI, etc.)
  - Recent emails log
  - SMTP status

#### Module-Specific Cards
- **CalendarOverviewCard**: Calendar events stats
- **DocumentsOverviewCard**: Document system metrics
- **ProjectsOverviewCard**: Project analytics
- **TasksOverviewCard**: Tasks and todos
- **MessagesOverviewCard**: Messaging stats
- **TenderRFIPipelineCard**: Tenders and RFIs in progress

#### Alerts & Issues
- **AlertsIssuesCard**: Active system alerts
  - Critical alerts
  - Warning alerts
  - Info alerts
  - Recent issues
  - Alert history
  - Acknowledge button
  - Resolve button

#### Financial Dashboard
- **FinancialDashboardCard**: (If applicable)
  - Revenue metrics
  - Subscription status
  - Payment processing
  - Billing issues

#### Team Collaboration
- **TeamCollaborationCard**: (If applicable)
  - Active collaborations
  - Team performance
  - Collaboration metrics

#### Real-time Activity Log
- **EnhancedRealtimeActivityLog**: Live system activity
  - Real-time activity feed
  - User actions
  - System events
  - Filters by action type, user, entity
  - Search functionality
  - Activity details
  - Timestamp
  - IP address
  - User agent
  - Metadata

---

**Real-time Data**:
- All dashboard data updates in real-time via WebSocket subscriptions
- No page refresh needed
- Live counters and charts
- Instant alert notifications

**Components**:
- **AdminDashboard**: Main dashboard page
- **AdminLayout**: Layout wrapper
- **AdminSidebar**: Navigation
- **AdminHeader**: Header with user menu and notifications
- All widget components listed above

**Hooks**:
- `useAdminStats`: Fetch admin statistics
- `useSystemHealth`: System health monitoring
- `useAPIMonitoring`: API metrics
- `useDatabaseMonitoring`: DB performance
- `useStorageMonitoring`: Storage stats
- `useEdgeFunctionsMonitoring`: Edge function metrics
- `useSecurityMonitoring`: Security monitoring
- `useCalendarMonitoring`: Calendar metrics
- `useDocumentsMonitoring`: Documents metrics
- `useMessagesMonitoring`: Messages stats
- `useTasksMonitoring`: Tasks stats
- `useRealtimeMonitoring`: Real-time data subscriptions
- `useRealtimeAdminStats`: Real-time admin stats
- `useAdminAlerts`: Alert management
- `useUserSessionMonitoring`: User session tracking

---

### 9.3 User Management (`/admin/users`)

**Purpose**: Manage all users in the system

**Features**:

**User List**:
- Table of all users with:
  - Avatar
  - Name
  - Email
  - Role (contractor, architect, builder, homeowner)
  - Company
  - Status (approved, pending, rejected)
  - Last seen
  - Online status
  - Created date
  - Actions (view, edit, approve, reject, delete)
- Search users (by name, email, company)
- Filter by:
  - Role
  - Status (approved, pending, rejected)
  - Company
  - Online status
  - Registration date
- Sort by any column
- Pagination

**User Actions**:
- **Approve User**: Change approval status to approved
- **Reject User**: Reject pending user with reason
- **Edit User**:
  - Change role
  - Change company
  - Update profile information
  - Reset password
  - Change admin status (grant/revoke admin role)
- **View User Details**:
  - Full profile
  - Activity history
  - Projects they're in
  - Documents uploaded
  - RFIs created/responded
  - Login history
  - Security events
- **Deactivate User**: Temporarily disable account
- **Delete User**: Permanently remove (with confirmation)

**Bulk Operations**:
- Select multiple users
- Bulk approve
- Bulk reject
- Bulk delete
- Bulk role assignment
- Export user list to Excel

**Components**:
- **UserManagement**: Main user management page
- **AdvancedUserManagement**: Advanced user administration
- **UserApprovalDashboard**: Pending approval queue
- User list table
- User details dialog
- Edit user dialog
- Activity log viewer

**Database**:
- **Table**: `profiles` (user profiles)
- **Table**: `user_roles` (admin role assignments)
- **Table**: `activity_log` (user actions)

---

**Document Version**: 1.0  
**Generated**: 2025  
**Format**: Markdown (convertible to PDF/Word)  
**Maintenance**: Update as features are added or changed

---

**Export Instructions**:

To convert this markdown file to PDF or Word:

**PDF Conversion**:
- Use Pandoc: `pandoc STOREA_COMPLETE_DOCUMENTATION.md -o STOREA_COMPLETE_DOCUMENTATION.pdf`
- Use online converters: markdown2pdf.com, cloudconvert.com
- Use VS Code extensions: Markdown PDF
- Print to PDF from markdown viewers

**Word Conversion**:
- Use Pandoc: `pandoc STOREA_COMPLETE_DOCUMENTATION.md -o STOREA_COMPLETE_DOCUMENTATION.docx`
- Open in Microsoft Word (Word can import .md files)
- Use online converters
- Copy-paste into Word (formatting may need adjustment)

**Viewing**:
- Any markdown viewer/editor (VS Code, Typora, MacDown, etc.)
- GitHub/GitLab (auto-renders markdown)
- Markdown preview in most IDEs

---

END OF DOCUMENT
