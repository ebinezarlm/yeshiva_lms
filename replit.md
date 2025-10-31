# Video Learning Platform - Tutor & Student Dashboard

## Overview

This is a full-featured video learning platform designed for educational content creators and students. The application provides two distinct interfaces:

1. **Tutor Dashboard**: Allows educators to upload, organize, and manage their tutorial videos through an intuitive Material Design-inspired interface with full CRUD operations
2. **Student Feed**: Provides an interactive video viewing experience with likes, comments, and question submission capabilities

The system is built as a full-stack TypeScript application with a React frontend and Express backend, utilizing PostgreSQL for persistent data storage with comprehensive schema validation for data integrity.

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

**Component Structure**:
- **AddVideoForm** (`client/src/components/AddVideoForm.tsx`): Standalone, reusable component for adding videos with built-in form state, validation, and submission handling
- **CommentList** (`client/src/components/CommentList.tsx`): Reusable comment component that fetches and displays comments with username, timestamp, and text. Includes input fields for posting new comments with auto-refresh
- **TutorDashboard** (`client/src/pages/TutorDashboard.tsx`): Main page component handling video display, search, filtering, pagination, editing, and deletion
- **StudentVideoFeed** (`client/src/pages/StudentVideoFeed.tsx`): Interactive video feed with embedded players, like system, expandable comments (using CommentList), and question modal
- **App.tsx** (`client/src/App.tsx`): Navigation bar with routing between Tutor (/tutor) and Student (/student) views

**Key Architectural Decisions**:
- Component composition pattern using Radix UI primitives for accessibility
- Standalone form component with encapsulated state for better reusability
- Form validation at both client and server levels using shared Zod schemas
- Query cache management: Global `staleTime: Infinity` with selective overrides (`staleTime: 0`) for real-time data like comments
- TanStack Query mutations with `refetchQueries` for immediate UI updates after server mutations
- Toast notifications for user feedback on mutations
- Controlled Select components using `value` prop (not `defaultValue`) for proper form resets
- Dialog components for modals (video editing, question submission)

### Backend Architecture

**Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ESM modules
- **Build Tool**: esbuild for production builds, tsx for development
- **API Pattern**: RESTful endpoints with JSON responses

**Storage Layer**:
- **Current Implementation**: PostgreSQL database with Drizzle ORM
- **Interface-based Design**: IStorage interface abstracts database operations
- **Data Models**: Users, Videos, Comments, and Questions tables with UUID primary keys
- **Database Connection**: Uses Neon serverless PostgreSQL via DATABASE_URL environment variable

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
   - likes (integer, default 0)

3. **Comments Table**:
   - id (UUID primary key)
   - videoId (UUID foreign key to videos)
   - username (text with default "Anonymous")
   - text (required text)
   - createdAt (timestamp with default now())

4. **Questions Table**:
   - id (UUID primary key)
   - videoId (UUID foreign key to videos)
   - text (required text)
   - createdAt (timestamp with default now())

**Validation Strategy**:
- Shared Zod schemas between client and server
- Insert schemas omit auto-generated fields (id, createdAt)
- URL validation for video URLs
- Required field validation for all user inputs
- Foreign key constraints for data integrity

### External Dependencies

**Database**:
- **Provider**: Neon Database (@neondatabase/serverless)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Configuration**: DATABASE_URL environment variable
- **Status**: Fully migrated to PostgreSQL with persistent storage

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

## Recent Changes (October 31, 2025)

**Component Refactoring**:
- Extracted AddVideoForm into standalone component (`client/src/components/AddVideoForm.tsx`)
- Reduced TutorDashboard complexity by ~120 lines
- Improved code maintainability and reusability

**Database Migration**:
- Migrated from in-memory storage to PostgreSQL for persistent data storage
- All videos now persist across server restarts
- Added comments and questions tables with timestamp tracking
- Added likes column to videos table

**Major Feature: Student Video Feed** (NEW):
1. **Interactive Video Display**: Grid layout with embedded YouTube/video iframes
2. **Like System**: 
   - POST /api/videos/:id/like endpoint increments video likes
   - Real-time like count updates without page refresh
   - TanStack Query mutations for optimistic UI updates
3. **Comment System**:
   - Expandable comment sections per video
   - GET /api/videos/:id/comments and POST /api/videos/:id/comments endpoints
   - Comments display with formatted timestamps
   - Real-time updates using `refetchQueries` with `staleTime: 0`
4. **Question Submission**:
   - Modal dialog for asking questions about specific videos
   - POST /api/questions endpoint stores questions with video association
   - Toast notifications for successful submissions

**Navigation & Routing**:
- Added navigation bar with "Tutor Dashboard" and "Student Feed" buttons
- Tutor view: /tutor route for video management
- Student view: /student route for interactive video feed
- Active route highlighting in navigation

**Tutor Dashboard Features**:
1. **Video Editing**: Modal-based edit functionality with form validation
2. **Search & Filter**: Client-side search by title/description + category-based filtering
3. **Pagination**: Display 12 videos per page with automatic page correction after deletions
4. **CRUD Operations**: Full Create, Read, Update, Delete functionality

**Bug Fixes**:
- Fixed Select component form reset issue by using `value` prop instead of `defaultValue`
- Fixed pagination bug where users got stuck on empty pages after deleting videos on later pages
- Implemented automatic page clamping when totalPages changes
- Fixed comment display bug by changing from `invalidateQueries` to `refetchQueries` to ensure immediate UI updates

**API Endpoints Added**:
- POST /api/videos/:id/like - Increment video likes
- GET /api/videos/:id/comments - Fetch comments for a video
- POST /api/videos/:id/comments - Add a comment to a video
- POST /api/questions - Submit a question about a video
- GET /api/questions - Fetch all questions (for future admin view)

**Storage Interface Updates**:
- Added `likeVideo(id: string)` method
- Added `getComments(videoId: string)` method
- Added `addComment(data)` method
- Added `getQuestions()` method
- Added `addQuestion(data)` method

---

## Latest Updates (October 31, 2025 - Later)

**CommentList Component Refactor**:
- Created standalone, reusable `CommentList` component (`client/src/components/CommentList.tsx`)
- Extracted comment functionality from StudentVideoFeed for better code organization
- Reduced StudentVideoFeed complexity by ~40 lines

**Database Schema Enhancement**:
- Added `username` field to comments table with default value "Anonymous"
- Safely migrated existing comments using default value to prevent data loss
- Updated `insertCommentSchema` to validate username field

**CommentList Component Features**:
1. **Props**: Takes `videoId` as single prop for maximum reusability
2. **Dual Input System**:
   - Username field (optional, defaults to "Anonymous")
   - Comment text field (required)
   - Username persists after submission for easier follow-up comments
3. **Display Features**:
   - Comments shown with username (bold), relative timestamp, and text
   - Uses date-fns `formatDistanceToNow` for human-readable timestamps (e.g., "2 minutes ago")
   - Tailwind styling: rounded borders, card backgrounds, proper spacing
4. **Auto-refresh**: Uses `refetchQueries` to immediately update UI after comment submission
5. **User Experience**:
   - Comment text input clears after submission
   - Username input persists for convenience
   - Toast notifications for success/error feedback
   - Loading and empty states

**API Changes**:
- POST /api/videos/:id/comments now accepts: `{ videoId, username, text }`
- Username defaults to "Anonymous" if not provided

**Testing**:
- All end-to-end tests passed
- Verified username persistence and default behavior
- Confirmed comment isolation per video
- Tested rapid submission handling

---

## Latest Updates (October 31, 2025 - LikeButton Component)

**LikeButton Component Refactor**:
- Created standalone, reusable `LikeButton` component (`client/src/components/LikeButton.tsx`)
- Extracted like functionality from StudentVideoFeed for better code organization
- Reduced StudentVideoFeed complexity and improved maintainability

**LikeButton Component Features**:
1. **Props**: Takes `videoId` and `initialLikeCount` for flexibility
2. **Optimistic Updates**: 
   - Uses local state to show immediate visual feedback when users click Like
   - No flicker or visual regression during server mutations
   - Smoothly transitions to actual server value when refetch completes
3. **Mutation Handling**:
   - POST /api/videos/:id/like to increment likes
   - Invalidates query cache to refresh video data
   - Error handling with rollback on failure
4. **Styling with Tailwind**:
   - Smooth transitions: `transition-all duration-200`
   - Hover effect: `hover:scale-105` (subtle scale up)
   - Active state: `active:scale-95` (subtle scale down)
   - Heart icon with conditional fill (red when liked)
5. **User Experience**:
   - Button disabled during mutation to prevent duplicate requests
   - Toast notifications for error feedback
   - Smooth animations throughout
   - Independent state per video

**Optimistic Update Implementation**:
- Uses `useState` for local optimistic state
- `onMutate`: Increments optimistic count immediately on click
- `onSuccess`: Invalidates query cache but keeps optimistic state visible
- `useEffect`: Clears optimistic state when new server data arrives (when `initialLikeCount` catches up)
- `onError`: Reverts optimistic update and shows error toast

**Bug Fix - Optimistic Update Flicker**:
- **Issue**: Visual flicker when optimistic state was cleared too early in `onSuccess`
- **Root Cause**: `setOptimisticLikes(null)` caused count to revert to stale `initialLikeCount` before refetch completed
- **Solution**: 
  - Removed premature state clearing in `onSuccess`
  - Added `useEffect` to intelligently clear optimistic state when server data arrives
  - Condition: `optimisticLikes <= initialLikeCount` ensures smooth transition
- **Result**: No visual flicker, smooth count updates throughout mutation lifecycle

**Testing**:
- All end-to-end tests passed with architect approval
- Verified optimistic updates work without flicker
- Tested rapid clicks (5 consecutive) - all handled smoothly
- Confirmed hover/active transitions (scale effects, 200ms duration)
- Verified heart icon fills with red color when liked
- Tested independent state per video
- Confirmed like counts persist after page refresh