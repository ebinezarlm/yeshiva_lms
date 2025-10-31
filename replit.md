# Video Learning Platform - Tutor & Student Dashboard

## Overview

This is a full-featured video learning platform providing distinct interfaces for educators and students. The platform allows tutors to upload, organize, and manage tutorial videos with full CRUD operations, while students can view videos, interact via likes and comments, and submit questions. The system is a full-stack TypeScript application with a React frontend and Express backend, utilizing PostgreSQL for data storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, Wouter for routing, TanStack Query for state management, React Hook Form with Zod for forms, Shadcn/ui and Radix UI for components, and Tailwind CSS for styling.
**Design System**: Material Design-inspired with Inter/DM Sans fonts, neutral color scheme with HSL variables, responsive mobile-first breakpoints, and light/dark mode support.
**Component Structure**: Key components include `AddVideoForm` (reusable video addition), `CommentList` (reusable comment display and submission), `TutorDashboard` (video management), `StudentVideoFeed` (interactive video viewing with likes, comments, questions), and `QuestionAnswerSection` (role-based Q&A).
**Key Architectural Decisions**: Component composition, standalone form components with encapsulated state, client/server Zod validation, query cache management with `staleTime`, TanStack Query mutations for UI updates, toast notifications, controlled components, and dialogs for modals.

### Backend Architecture

**Framework**: Express.js with TypeScript and Node.js (ESM modules).
**Storage Layer**: PostgreSQL with Drizzle ORM via Neon Database, abstracted using an `IStorage` interface.
**Data Models**: Users, Videos, Comments, and Questions tables with UUID primary keys.
**Key Architectural Decisions**: Interface-driven storage, separation of concerns for routes/storage/server, and request/response logging.

### Data Schema

**ORM**: Drizzle ORM for PostgreSQL with `drizzle-zod` for type-safe validation.
**Data Models**:
- **Users**: `id`, `username`, `password`.
- **Videos**: `id`, `title`, `description`, `videoUrl`, `category`, `likes`.
- **Comments**: `id`, `videoId` (FK), `username`, `text`, `createdAt`.
- **Questions**: `id`, `videoId` (FK), `text`, `createdAt`, `answer` (nullable), `answeredAt` (nullable).
**Validation Strategy**: Shared Zod schemas between client/server, URL validation, required field validation, and foreign key constraints.

### UI/UX Decisions

The platform follows Material Design principles with Notion-inspired aesthetics. It incorporates proper spacing, border separators, rounded borders for cards, hover effects, and visually distinct backgrounds for answers. Timestamps are formatted for human readability using `date-fns`.

## External Dependencies

**Database**:
- **Provider**: Neon Database (`@neondatabase/serverless`)
- **ORM**: Drizzle ORM (PostgreSQL dialect)

**UI Component Libraries**:
- **Radix UI**: Accessible component primitives (accordion, dialog, dropdown, select)
- **Lucide React**: Icon library
- **Class Variance Authority**: Component variant management
- **Tailwind Merge & CLSX**: Conditional class merging

**Form & Validation**:
- **React Hook Form**: Form state management
- **@hookform/resolvers**: Integration with Zod
- **Zod**: Runtime type validation and schema definition

**Development Tools**:
- **Vite**: Development server and build tool
- **@replit/vite-plugin-runtime-error-modal**
- **@replit/vite-plugin-cartographer**

**Additional Integrations**:
- **Google Fonts**: Inter, DM Sans, Architects Daughter, Fira Code, Geist Mono
- **PostCSS & Autoprefixer**: CSS processing