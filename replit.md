# Video Management Dashboard - Tutor Dashboard

## Overview

This is a productivity-focused video management dashboard designed for educational content creators. The application allows tutors to upload, organize, and manage their tutorial videos through an intuitive Material Design-inspired interface. It provides a streamlined workflow for adding video metadata (title, description, URL, category) and displays videos in a responsive grid layout with delete functionality.

The system is built as a full-stack TypeScript application with a React frontend and Express backend, utilizing in-memory storage with schema validation for data integrity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state management
- **Form Handling**: React Hook Form with Zod schema validation
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system following Material Design principles

**Design System**:
- Typography: Inter or DM Sans font families
- Color scheme: Neutral base with customizable HSL color variables
- Responsive breakpoints: Mobile-first approach with lg (desktop), md (tablet), and default (mobile) breakpoints
- Component theming: Support for light/dark modes via CSS variables

**Key Architectural Decisions**:
- Component composition pattern using Radix UI primitives for accessibility
- Form validation at both client and server levels using shared Zod schemas
- Optimistic UI updates disabled (staleTime: Infinity) for data consistency
- Toast notifications for user feedback on mutations

### Backend Architecture

**Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **Build Tool**: esbuild for production builds, tsx for development
- **API Pattern**: RESTful endpoints with JSON responses

**Storage Layer**:
- **Current Implementation**: In-memory storage (MemStorage class)
- **Interface-based Design**: IStorage interface allows for easy migration to persistent storage
- **Data Models**: Users and Videos with UUID primary keys

**Key Architectural Decisions**:
- Interface-driven storage abstraction for flexibility
- Separation of concerns: routes, storage, and server setup in distinct modules
- Request/response logging middleware for debugging
- Raw body capture for potential webhook integrations

### Data Schema

**Database ORM**: Drizzle ORM configured for PostgreSQL
- Schema definition using Drizzle's table definitions
- Zod schema generation via drizzle-zod for type-safe validation
- Migration support (migrations directory)

**Data Models**:

1. **Users Table**:
   - id (UUID primary key)
   - username (unique text)
   - password (text)

2. **Videos Table**:
   - id (UUID primary key)
   - title (required text)
   - description (required text)
   - videoUrl (validated URL)
   - category (required text)

**Validation Strategy**:
- Shared Zod schemas between client and server
- Insert schemas omit auto-generated fields (id)
- URL validation for video URLs
- Required field validation for all user inputs

### External Dependencies

**Database**:
- **Provider**: Neon Database (@neondatabase/serverless)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Configuration**: DATABASE_URL environment variable required
- **Note**: Schema is defined for PostgreSQL but currently using in-memory storage. Database connection will need to be initialized when migrating from MemStorage.

**UI Component Libraries**:
- **Radix UI**: Comprehensive set of accessible component primitives (accordion, dialog, dropdown, select, etc.)
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for managing component variants
- **Tailwind Merge & CLSX**: Utility for conditional class merging

**Form & Validation**:
- **React Hook Form**: Form state management
- **@hookform/resolvers**: Integration with Zod validation
- **Zod**: Runtime type validation and schema definition

**Development Tools**:
- **Vite**: Development server and build tool
- **@replit/vite-plugin-runtime-error-modal**: Enhanced error reporting in development
- **@replit/vite-plugin-cartographer**: Development tooling (Replit-specific)

**Additional Integrations**:
- **Google Fonts**: Inter, DM Sans, Architects Daughter, Fira Code, and Geist Mono font families
- **PostCSS & Autoprefixer**: CSS processing

**Session Management** (configured but not actively used):
- connect-pg-simple: PostgreSQL session store for Express sessions