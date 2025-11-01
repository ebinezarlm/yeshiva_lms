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