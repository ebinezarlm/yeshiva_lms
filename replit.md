# Video Learning Platform - Tutor & Student Dashboard

## Overview

This is a full-featured video learning platform providing distinct interfaces for educators and students. Tutors can upload, organize, and manage tutorial videos with full CRUD operations. Students can view videos, interact via likes and comments, and submit questions. The system supports various video sources including YouTube/Vimeo, Google Drive, and direct file uploads, with robust playlist management. It is a full-stack TypeScript application with a React frontend and Express backend, utilizing PostgreSQL for data storage.

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
- **Form Handling**: Utilizes React Hook Form and Zod for robust form validation and state management, with shared schemas between client and server.
- **Navigation**: Enhanced navbar with a dark theme, responsive design, and clear routing for Tutor Dashboard, Student Feed, and a placeholder Login Page. Default route redirects to Student Feed.

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