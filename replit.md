# Video Learning Platform - Tutor & Student Dashboard

## Overview

This project is a comprehensive video learning platform featuring distinct interfaces for students, tutors, and administrators. It enables tutors to upload and manage video tutorials, students to consume content and interact, and administrators to oversee platform operations. The platform supports various video sources and includes robust playlist management. It's built as a full-stack TypeScript application with a React frontend, an Express backend, and PostgreSQL for data persistence, aiming to provide a rich educational experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

**Frameworks & Libraries**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, React Hook Form with Zod for forms, Shadcn/ui and Radix UI for components, and Tailwind CSS for styling.
**Design System**: Material Design-inspired with Inter/DM Sans fonts, a neutral HSL color scheme, responsive mobile-first breakpoints, and light/dark mode support. It incorporates Notion-inspired aesthetics with attention to spacing, borders, and hover effects.
**Core Features**:
- **Unified Video Manager**: Facilitates adding videos from YouTube/Vimeo, Google Drive, or direct uploads, including live previews and playlist integration.
- **Playlist Management**: Tutors can create, edit, and organize videos into playlists.
- **Video Playback**: Supports embedded YouTube/Vimeo and Google Drive videos, offering consistent interaction features across all sources.
- **Admin Dashboard**: A central portal for managing users, subscriptions, revenue, and platform analytics with search, filtering, and reporting capabilities.
- **Form Handling**: Utilizes React Hook Form and Zod for robust client-side validation, sharing schemas with the backend for type safety.
- **Navigation**: Features a multi-role routing system with dedicated interfaces for Tutors (`/tutor`), Students (`/student`), and Admins (`/admin`).

### Backend

**Framework**: Express.js with TypeScript and Node.js (ESM modules).
**Storage Layer**: PostgreSQL with Drizzle ORM via Neon Database, abstracted using an `IStorage` interface for flexibility.
**Data Models**: Includes Users, Videos, Comments, Questions, and Playlists, all utilizing UUIDs for primary keys.
**API Endpoints**: Provides comprehensive CRUD operations for videos, playlists, comments, and questions. Secure direct file upload endpoints include magic byte validation, MIME type checking, and size limits.
**Key Architectural Decisions**: Emphasizes interface-driven storage, clear separation of concerns, request/response logging, and shared Zod schemas for end-to-end type-safe validation.

### Data Schema (PostgreSQL with Drizzle ORM)

- **Users**: `id`, `username`, `password`.
- **Playlists**: `id`, `name`, `description`, `createdAt`, `tutorName`, `category`, `thumbnail`, `isPublic`, `videoCount`, `viewCount`.
- **Videos**: `id`, `title`, `description`, `videoUrl`, `category`, `likes`, `playlistId`.
- **Comments**: `id`, `videoId`, `username`, `text`, `createdAt`.
- **Questions**: `id`, `videoId`, `text`, `createdAt`, `answer`, `answeredAt`, `studentEmail`, `studentName`.
- **Subscriptions**: `studentEmail`, `studentName`, `playlistId`, `startDate`, `endDate`, `status`, `amountPaid`.
- **Watch Progress**: `studentEmail`, `videoId`, `playlistId`, `progress`, `completed`, `lastWatched`.
**Validation**: Enforced via client/server shared Zod schemas, URL validation, required fields, and foreign key constraints.

### UI/UX Decisions

- **Color Scheme**: Neutral HSL palette.
- **Typography**: Inter/DM Sans for general text, specialized fonts for code and headings.
- **Responsiveness**: Mobile-first approach with defined breakpoints.
- **Interaction**: Notion-inspired aesthetics including spacing, border separators, rounded borders, and hover effects.
- **Theming**: Supports both light and dark modes.

### Technical Implementations & Feature Specifications

- **Admin Dashboard**: Provides an overview of total users, active subscriptions, total revenue, and expiring subscriptions. Features a user management table with search, filter, and pagination, and a modal for detailed playlist information.
- **Student Dashboard**: Includes "My Playlists" with progress tracking, a "Playlist Detail" view with video player and interaction features, "Explore Courses" for browsing and subscribing, "My Subscriptions" for managing historical data, "Comments & Q&A" for interaction, and "Profile Settings."
- **Tutor Dashboard**: Offers an overview with tutor-specific metrics, "My Playlists" for CRUD operations, "Upload Videos" using the unified manager, "Comments & Questions" for student interaction, "Earnings Summary," and "Profile Settings" including payment information.
- **Authentication (Mock)**: Currently uses a mock system with demo credentials and client-side role-based routing via LocalStorage. This is a known limitation for a production environment.
- **Data Filtering**: Tutor and student dashboards implement data filtering based on `tutorName` or `studentEmail` to scope content appropriately.

## External Dependencies

**Database**:
- Neon Database (`@neondatabase/serverless`)
- Drizzle ORM (PostgreSQL dialect)

**UI Component Libraries**:
- Radix UI
- Lucide React (icons)
- Shadcn/ui
- Class Variance Authority, Tailwind Merge, CLSX (styling utilities)

**Form & Validation**:
- React Hook Form
- `@hookform/resolvers` (Zod integration)
- Zod

**Development Tools**:
- Vite

**Additional Integrations**:
- Google Fonts (Inter, DM Sans, Architects Daughter, Fira Code, Geist Mono)
- PostCSS & Autoprefixer
- `date-fns`
- `file-type` (server-side file validation)