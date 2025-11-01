# Video Learning Platform - Tutor & Student Dashboard

## Overview

This is a full-featured video learning platform providing distinct interfaces for educators, students, and administrators. Tutors can upload, organize, and manage tutorial videos with full CRUD operations. Students can view videos, interact via likes and comments, and submit questions. Administrators can monitor platform usage, manage users and subscriptions through a comprehensive dashboard. The system supports various video sources including YouTube/Vimeo, Google Drive, and direct file uploads, with robust playlist management. It is a full-stack TypeScript application with a React frontend and Express backend, utilizing PostgreSQL for data storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

**Framework**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, React Hook Form with Zod for forms, Shadcn/ui and Radix UI for components, and Tailwind CSS for styling.
**Design System**: Material Design-inspired with Inter/DM Sans fonts, neutral HSL color scheme, responsive mobile-first breakpoints, and light/dark mode support. Notion-inspired aesthetics with proper spacing, border separators, rounded borders, and hover effects.
**Core Features**:
- **Unified Video Manager**: Streamlined interface for adding videos from YouTube/Vimeo URLs, Google Drive links, and direct file uploads. Includes live preview, playlist integration (select existing or create new), and client-side validation.
- **Playlist Management**: Tutors can create, manage, and assign videos to playlists. Playlists are displayed in an accordion-style interface.
- **Video Playback**: Supports YouTube/Vimeo embeds and Google Drive embeds, with consistent interaction features (likes, comments, Q&A) across all video sources.
- **Admin Dashboard**: Comprehensive management portal for monitoring users, subscriptions, revenue, and platform analytics with search, filtering, and detailed reporting.
- **Form Handling**: Utilizes React Hook Form and Zod for robust form validation and state management, with shared schemas between client and server.
- **Navigation**: Multi-role routing system with separate interfaces for Tutors (`/tutor`), Students (`/student`), and Admins (`/admin`). Main navigation hidden on admin routes for clean dashboard experience.

### Backend

**Framework**: Express.js with TypeScript and Node.js (ESM modules).
**Storage Layer**: PostgreSQL with Drizzle ORM via Neon Database, abstracted using an `IStorage` interface.
**Data Models**: Users, Videos, Comments, Questions, and Playlists. All entities use UUID primary keys.
**API Endpoints**:
- **Videos**: CRUD operations, including a dedicated secure endpoint for direct file uploads (`POST /api/videos/upload`) with magic byte validation, MIME type checking, size limits, and sanitization.
- **Playlists**: CRUD operations for managing video collections.
- **Comments & Questions**: Endpoints for student interaction.
**Key Architectural Decisions**: Interface-driven storage, separation of concerns (routes/storage/server), request/response logging, and shared Zod schemas for type-safe validation.

### Data Schema (PostgreSQL with Drizzle ORM)

- **Users**: `id`, `username`, `password`.
- **Playlists**: `id`, `name` (unique), `description` (nullable), `createdAt`.
- **Videos**: `id`, `title`, `description`, `videoUrl`, `category`, `likes`, `playlistId` (nullable FK to playlists).
- **Comments**: `id`, `videoId` (FK), `username`, `text`, `createdAt`.
- **Questions**: `id`, `videoId` (FK), `text`, `createdAt`, `answer` (nullable), `answeredAt` (nullable).
**Validation**: Client/server shared Zod schemas, URL validation, required field validation, and foreign key constraints.

## External Dependencies

**Database**:
- Neon Database (`@neondatabase/serverless`)
- Drizzle ORM (PostgreSQL dialect)

**UI Component Libraries**:
- Radix UI (accessible primitives)
- Lucide React (icons)
- Shadcn/ui (reusable components)
- Class Variance Authority, Tailwind Merge, CLSX (styling utilities)

**Form & Validation**:
- React Hook Form
- `@hookform/resolvers` (Zod integration)
- Zod (runtime type validation)

**Development Tools**:
- Vite (development server and build tool)

**Additional Integrations**:
- Google Fonts (Inter, DM Sans, Architects Daughter, Fira Code, Geist Mono)
- PostCSS & Autoprefixer
- `date-fns` (date formatting)
- `file-type` (server-side file validation)

---

## Recent Feature: Admin Dashboard (November 1, 2025)

**Admin Dashboard** - Comprehensive management interface for platform administrators accessible at `/admin`:

### Key Features

**Layout & Navigation**:
- Clean dashboard layout with fixed sidebar and top navbar
- Five navigation sections: Dashboard, Users, Subscriptions, Invoices, Settings
- Responsive design with mobile sidebar overlay
- Global navigation hidden on admin routes for distraction-free experience

**Dashboard Overview** - Four key metric cards:
1. **Total Users**: Count of all registered users
2. **Active Subscriptions**: Number of currently active subscriptions
3. **Total Revenue**: Cumulative earnings across all users (₹ currency)
4. **Expiring Soon**: Active subscriptions expiring within 30 days

**User Management Table**:
- **Columns**: User Name, Email, Playlist Subscribed, Due Date, Amount Paid, Invoice, Status
- **Search**: Real-time filtering by name, email, or playlist name
- **Status Filter**: Filter users by Active, Expired, or All statuses
- **Pagination**: 10 users per page with smart page navigation
- **Clickable Playlists**: Opens detailed modal with playlist information
- **Invoice Download**: Generate and download sample invoices per user
- **Status Badges**: Color-coded badges (green for Active, red for Expired)

**Playlist Details Modal**:
- Student information and subscription status
- Course progress bar with percentage completion
- Subscription duration (days remaining or expired status)
- Complete video list with titles and durations
- Scrollable content area for playlists with many videos

### Technical Implementation

**Components**:
- `AdminDashboard.tsx`: Main page with mock data (12 sample users)
- `Sidebar.tsx`: Navigation sidebar with mobile responsiveness
- `TopNavbar.tsx`: Header with search and profile dropdown
- `DashboardCards.tsx`: Summary metrics widgets
- `UserTable.tsx`: Searchable, filterable, paginated user table
- `PlaylistModal.tsx`: Detailed playlist information modal

**Features**:
- Real-time metric calculations from user data
- Combined search and filter capabilities
- Responsive tables with mobile optimization
- Professional UI using Shadcn components
- Comprehensive accessibility with data-testid attributes

**Future Enhancements** (Placeholder sections ready):
- Subscriptions management panel
- Invoices management system
- Settings configuration
- User role management
- Analytics and reporting

---

## Recent Feature: Student Dashboard (November 1, 2025)

**Complete Student Dashboard** - Six fully functional pages for student learning experience accessible at `/student/*`:

### Student Dashboard Pages

1. **My Playlists** (`/student/playlists`)
   - Grid layout showing all subscribed playlists
   - Progress tracking with completion percentages
   - "Continue Watching" functionality with last watched video
   - Visual progress bars for each playlist
   - "View Playlist" button to access detailed view

2. **Playlist Detail** (`/student/playlist/:id`)
   - Complete video list for selected playlist
   - Video player modal with YouTube/Vimeo/Google Drive support
   - Like/comment functionality on videos
   - Q&A section for asking questions about videos
   - Real-time interaction with comments and questions

3. **Explore Courses** (`/student/explore`)
   - Browse all public playlists
   - Search by course name or tutor name
   - Filter by category (Programming, Design, Business, etc.)
   - Sort by newest or most popular (view count)
   - Subscribe modal with duration selection (1/3/6/12 months)
   - Pricing: ₹500 per month
   - Shows subscription status (already subscribed vs. available)

4. **My Subscriptions** (`/student/subscriptions`)
   - Complete subscription history table
   - Status tracking (Active/Expired) with color-coded badges
   - Days remaining for active subscriptions
   - Invoice download functionality (generates text invoices)
   - Renewal option for expired subscriptions
   - Summary metrics: Total, Active, Expired subscriptions, Total spent

5. **Comments & Q&A** (`/student/qna`)
   - View all student's posted questions
   - Filter by All/Answered/Unanswered status
   - Post new questions with video selection
   - React Hook Form with Zod validation
   - Shows tutor replies with timestamps
   - Summary metrics: Total, Answered, Pending questions

6. **Profile Settings** (`/student/profile`)
   - Edit profile information (name, email, profile picture URL)
   - Change password with confirmation
   - Email preferences (new content, course reminders, Q&A responses, newsletter)
   - Avatar display with fallback initials
   - Form validation with React Hook Form + Zod

### Technical Implementation

**Data Models Enhanced**:
- **Subscriptions Table**: `studentEmail`, `studentName`, `playlistId`, `startDate`, `endDate`, `status`, `amountPaid`
- **Watch Progress Table**: `studentEmail`, `videoId`, `playlistId`, `progress`, `completed`, `lastWatched`
- **Questions Table**: `videoId`, `studentEmail`, `studentName`, `text`, `answer`, `answeredAt`, `createdAt`
- **Playlists Table**: Added `tutorName`, `category`, `thumbnail`, `isPublic`, `videoCount`, `viewCount`

**API Endpoints**:
- `GET /api/subscriptions/student/:email` - Student's subscriptions
- `POST /api/subscriptions` - Create subscription
- `GET /api/watch-progress/student/:email` - Student's watch progress
- `POST /api/watch-progress` - Update/create progress
- `GET /api/questions/student/:email` - Student's questions (server-side filtered)
- `POST /api/questions` - Create question with student identity

**Frontend Architecture**:
- All pages use React Query for data fetching with proper loading states
- Forms use React Hook Form with Zod validation (shared schemas)
- Shadcn UI components for consistent design
- Responsive layouts with Tailwind CSS
- Comprehensive data-testid attributes for testing
- Server-driven filtering for data isolation

### Authentication & Security Notes

**Current Implementation - Mock Authentication System**:
- Demo credentials: `student@lms.com`, `tutor@lms.com`, `admin@lms.com` / `password123`
- Client-side role-based routing with ProtectedRoute component
- LocalStorage-based session management
- Email/name stored in AuthContext

**Known Limitations (Demo/Learning Platform)**:
- No server-side session validation or JWT tokens
- API endpoints trust client-provided email parameters
- Role-based access control is client-side only
- Data isolation relies on proper API usage (not enforced server-side)

**Production Requirements (Not Implemented)**:
- Server-side authentication middleware (e.g., Passport.js, JWT)
- Session-based or token-based identity verification
- Role-based access control enforced at API layer
- Email/identity derived from authenticated session, not request parameters
- Admin-only endpoints protected with role checks
- CSRF protection and secure session cookies