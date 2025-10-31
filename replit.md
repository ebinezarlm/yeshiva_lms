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

---

## Latest Updates (October 31, 2025 - Routing & Navigation Enhancement)

**Enhanced Navigation System**:
- Updated navbar with modern dark theme styling (bg-gray-800 background with white text)
- Added LoginPage as a placeholder for future authentication implementation
- Restructured routing with default redirect to Student Feed

**Routing Configuration**:
1. **Default Route (`/`)**: Automatically redirects to `/student` using Wouter's `<Redirect>` component
2. **Tutor Dashboard (`/tutor`)**: Route for video management interface
3. **Student Feed (`/student`)**: Route for interactive video viewing experience
4. **Login Page (`/login`)**: Placeholder page with links to main application areas
5. **404 Not Found**: Fallback route for non-existent paths

**Navbar Styling & Behavior**:
- **Background**: Dark gray (`bg-gray-800`) for professional appearance
- **Text Color**: White (`text-white`) for high contrast
- **Layout**: Flexbox with gap spacing between navigation items
- **Active State**: Secondary variant button for current route
- **Inactive State**: Ghost variant with white text and hover effect (`hover:bg-gray-700`)
- **Responsive**: Max-width container with responsive padding

**LoginPage Component** (`client/src/pages/LoginPage.tsx`):
- Centered card layout using Shadcn Card components
- Placeholder message indicating authentication not yet implemented
- Direct navigation buttons to access Tutor Dashboard and Student Feed
- Clean, minimal design following existing component patterns
- Test IDs for automated testing:
  - `data-testid="link-tutor-from-login"`
  - `data-testid="link-student-from-login"`

**Navigation Component Features**:
- Uses Wouter's `useLocation` hook for active route detection
- Conditional button variants based on current route
- Test IDs for each navigation link:
  - `data-testid="link-tutor-dashboard"`
  - `data-testid="link-student-feed"`
  - `data-testid="link-login"`

**Testing**:
- All end-to-end tests passed successfully
- Verified default route redirect to /student
- Tested direct URL access for all routes
- Confirmed active route highlighting works correctly
- Validated navbar styling (dark background, white text, flexbox layout)
- Tested LoginPage placeholder with navigation links
- Verified 404 page displays for non-existent routes