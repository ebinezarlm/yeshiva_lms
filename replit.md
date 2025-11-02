# Video Learning Platform - Tutor & Student Dashboard

## Overview

This project is a comprehensive video learning platform featuring distinct interfaces for students, tutors, administrators, and super administrators. It enables tutors to upload and manage video tutorials, students to consume content and interact, administrators to oversee platform operations, and super administrators to control role-based access permissions. The platform supports various video sources and includes robust playlist management. It's built as a full-stack TypeScript application with a React frontend, an Express backend, and PostgreSQL for data persistence, aiming to provide a rich educational experience.

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
- **Navigation**: Features a multi-role routing system with dedicated interfaces for Tutors (`/tutor`), Students (`/student`), Admins (`/admin`), and Super Admins (`/superadmin`).
- **Super Admin Dashboard**: A control panel for managing role-based permissions with the Access Control Panel, allowing fine-grained control over which features each role can access.

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

- **Admin Dashboard**: A comprehensive 5-page admin portal:
  - **Dashboard Overview**: Displays 4 stat cards (Total Users, Active Subscriptions, Total Revenue, Growth Rate), a revenue growth line chart showing monthly trends, and a subscription status pie chart (Active/Expired/Expiring). Uses Recharts for data visualization.
  - **Users Page**: Full-featured user management with a searchable table showing student subscriptions, status filters (All/Active/Expired), pagination (10 per page), view details modal with complete student information, and invoice download functionality.
  - **Playlists Page**: Card grid layout displaying all playlists with thumbnails, video counts, categories, and tutor names. Includes complete CRUD operations (create, edit with update mutation, delete) through dialogs using React Hook Form and Zod validation.
  - **Payments Page**: Transaction management featuring 4 summary cards (Total Earnings, Pending Payments, Successful, Failed), monthly earnings bar chart, and a detailed transactions table with status filters and invoice actions.
  - **Settings Page**: Platform configuration with three sections: Subscription Pricing (monthly/yearly prices, currency, tax), Admin Profile (name, email, password change), and Account Actions (logout).
- **Student Dashboard**: Includes "My Playlists" with progress tracking, a "Playlist Detail" view with video player and interaction features, "Explore Courses" for browsing and subscribing, "My Subscriptions" for managing historical data, "Comments & Q&A" for interaction, and "Profile Settings."
- **Tutor Dashboard**: Offers an overview with tutor-specific metrics, "My Playlists" for CRUD operations, "Upload Videos" using the unified manager, "Comments & Questions" for student interaction, "Earnings Summary," and "Profile Settings" including payment information.
- **Super Admin Dashboard**: A comprehensive 2-page control panel:
  - **Dashboard Overview**: Displays 5 stat cards (Total Users, Admins, Tutors, Students, System Status), Quick Actions card for accessing key features, and Platform Overview with system statistics.
  - **Access Control Panel**: Features dynamic permission management with collapsible role cards (Admin, Tutor, Student), checkbox-based feature toggles for each role, badge counts showing enabled/total features, and atomic save operations. Permissions are stored in localStorage and persist across sessions. Super Admin always has full access regardless of permission settings.
- **PermissionsContext**: Centralized permission management system that controls which features are visible in each role's sidebar. Includes `hasPermission()` function for checking access, `updateAllPermissions()` for atomic updates, and automatic synchronization with localStorage.
- **Dynamic Sidebar Filtering**: Admin, Tutor, and Student roles have their sidebar menu items filtered based on permissions set by Super Admin. Super Admin role is never filtered and always has access to all features.
- **Authentication (Mock)**: Currently uses a mock system with demo credentials (student@lms.com, tutor@lms.com, admin@lms.com, superadmin@lms.com - all with password: password123) and client-side role-based routing via LocalStorage. This is a known limitation for a production environment.
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

**Data Visualization**:
- Recharts (for admin dashboard charts: LineChart, PieChart, BarChart)

**Additional Integrations**:
- Google Fonts (Inter, DM Sans, Architects Daughter, Fira Code, Geist Mono)
- PostCSS & Autoprefixer
- `date-fns`
- `file-type` (server-side file validation)

## Recent Changes

### November 2, 2025 - Super Admin Access Control System
- Added 'superadmin' role to authentication system with dedicated routing and login flow
- Created PermissionsContext for centralized role-based access control management
- Built Super Admin Dashboard with system overview (5 stat cards, Quick Actions, Platform Overview)
- Implemented Access Control Panel with dynamic permission management:
  - Collapsible role cards for Admin, Tutor, and Student with checkbox controls
  - Badge counts showing enabled/total features for each role
  - Save Changes button with atomic `updateAllPermissions` function (fixes race conditions)
  - Reset Changes button to restore default permissions
  - Permissions persist in localStorage across sessions
- Updated Sidebar component to dynamically filter menu items based on permissions
- Super Admin always has full access to all features (not affected by permission restrictions)
- Added useEffect synchronization to ensure UI reflects saved permissions after navigation
- Comprehensive end-to-end testing verified all functionality including permission persistence, sidebar filtering, and cross-role behavior

### November 1, 2025 - Admin Dashboard Enhancement
- Enhanced Dashboard Overview with revenue growth line chart and subscription status pie chart using Recharts
- Created comprehensive Users Page with search, filter, pagination, and detailed view modal
- Built Playlists Page with card grid layout and full CRUD operations (create, edit, delete)
- Implemented Payments Page with transaction table, filters, summary cards, and monthly earnings chart
- Added Settings Page with pricing configuration, currency/tax settings, and admin profile management
- All pages use React Query for data fetching, React Hook Form with Zod validation for forms, and shadcn/ui components for consistency
- Successfully tested all admin pages end-to-end with playwright verification