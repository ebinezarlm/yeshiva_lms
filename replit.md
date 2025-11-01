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
- **Playlists**: `id`, `name` (unique), `description` (nullable), `createdAt`.
- **Videos**: `id`, `title`, `description`, `videoUrl`, `category`, `likes`, `playlistId` (nullable FK to playlists).
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

## Latest Updates (November 1, 2025 - Playlist Management Feature)

**Playlist System**:
- Added playlist/category system to organize videos into collections
- Tutors can create playlists and assign videos to them
- Videos can be added to playlists or left as standalone (orphan) videos
- Playlist assignments are optional and backwards-compatible with existing videos

**Database Schema Updates**:
- **Playlists Table**: `id` (varchar UUID), `name` (text, unique), `description` (text, nullable), `createdAt` (timestamp)
- **Videos Table**: Added `playlistId` (varchar, nullable, foreign key to playlists.id)
- Nullable playlistId ensures backwards compatibility with existing videos

**API Endpoints**:
- **GET /api/playlists**: Fetches all playlists with nested videos array
- **POST /api/playlists**: Creates new playlist (requires `name`, optional `description`)
- **DELETE /api/playlists/:id**: Deletes a playlist by ID
- **POST /api/videos**: Updated to accept optional `playlistId` field

**VideoPlaylistManager Component** (`client/src/components/VideoPlaylistManager.tsx`):
1. **Add Video to Playlist Form**:
   - Video Title, Description, Video URL (Google Drive), Category
   - Dropdown to select existing playlist OR create new playlist
   - Toggle between "Select Playlist" and "Create New Playlist" modes
   - Google Drive URL conversion (supports multiple formats)
   - Form validation with Zod
   - Success/error toast notifications

2. **Playlist Display**:
   - Accordion-style collapsible playlists
   - Each playlist shows video count
   - Videos displayed in responsive grid within playlist
   - Each video card shows: iframe preview, title, description
   - Delete button on each video card
   - Empty state when no playlists exist

3. **Features**:
   - Create new playlist inline when adding video
   - Add video to existing playlist from dropdown
   - Delete videos from playlists
   - Real-time cache invalidation (TanStack Query)
   - Proper data-testid attributes for e2e testing

**TutorDashboard Integration** (`client/src/pages/TutorDashboard.tsx`):
- Added third tab "Playlists" to existing YouTube/Vimeo and Google Drive tabs
- YouTube and Drive tabs maintain 2-column grid layout (form + video management)
- Playlists tab displays VideoPlaylistManager in full-width layout
- Extracted `renderVideoManagementPanel()` helper function to reuse video grid code
- Responsive tab navigation with proper test IDs

**Storage Layer Updates** (`server/storage.ts`):
- Extended IStorage interface with playlist CRUD methods:
  - `getAllPlaylists()`, `getPlaylist(id)`, `createPlaylist()`, `deletePlaylist(id)`
  - `getVideosByPlaylistId(playlistId)`
- DatabaseStorage implementation using Drizzle ORM queries

**Testing**:
- E2E tests verified playlist creation, video assignment, and deletion
- Confirmed accordion interactions and responsive layouts
- Validated Google Drive URL conversion in playlist context
- All playlist API endpoints tested and working correctly

**Architecture Benefits**:
- Clean separation: playlists table independent from videos
- Nullable foreign key allows gradual migration
- No breaking changes to existing video functionality
- Reusable helper functions reduce code duplication

---

## Earlier Updates (November 1, 2025 - Google Drive Video Integration)

**AddDriveVideo Component**:
- Created new component for adding videos from Google Drive (`client/src/components/AddDriveVideo.tsx`)
- Allows tutors to paste Google Drive share links instead of uploading files directly
- Integrated into Tutor Dashboard via tabs (YouTube/Vimeo vs. Google Drive)

**Google Drive Link Conversion**:
- Automatically converts various Google Drive URL formats to embeddable format
- Supported input formats:
  - `https://drive.google.com/file/d/FILE_ID/view?usp=sharing`
  - `https://drive.google.com/open?id=FILE_ID`
  - `https://drive.google.com/uc?export=preview&id=FILE_ID`
- Output format: `https://drive.google.com/file/d/FILE_ID/preview` (2025 standard)

**AddDriveVideo Component Features**:
1. **Form Fields**:
   - Video Title (text input)
   - Description (textarea)
   - Google Drive Video Link (text input with validation)
   - Category / Subject (dropdown: Tutorial, Lecture, Demo, Review)
2. **Validation** (using Zod):
   - All fields required
   - URL must be valid and contain "drive.google.com"
   - Extracts FILE_ID and validates format
3. **Live Preview**:
   - Shows iframe preview as soon as valid Google Drive URL is pasted
   - Preview updates in real-time as URL changes
   - Includes helpful message about sharing permissions
4. **Submission**:
   - Converts URL to embed format before saving
   - Posts to `/api/videos` endpoint (same as YouTube/Vimeo)
   - Shows success toast and clears form
   - Error handling with descriptive messages

**StudentVideoFeed Enhancement**:
- Updated `getEmbedUrl` function to support Google Drive videos
- Handles both pre-converted and unconverted Google Drive URLs
- Google Drive videos display in iframes alongside YouTube/Vimeo videos
- All interactive features (likes, comments, Q&A) work identically for all video sources

**UI/UX Improvements**:
- Tab interface in Tutor Dashboard for choosing video source
- Two tabs: "YouTube / Vimeo" and "Google Drive"
- Seamless switching between upload methods
- Consistent styling and behavior across both forms
- Tailwind CSS with Shadcn components
- Dark mode support
- Responsive design

**Testing**:
- All end-to-end tests passed successfully
- Verified Google Drive URL validation and conversion
- Tested live preview functionality
- Confirmed videos display correctly in Student Feed
- Verified no regression for YouTube/Vimeo videos
- Tested all video interactions (likes, comments, Q&A)
- Validated different Google Drive URL format handling

**Important Notes**:
- Google Drive videos must have sharing set to "Anyone with the link can view"
- Uses the 2025 standard embed format `/preview` (more reliable than older formats)
- Web search confirmed this is the current recommended method for embedding Drive videos

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