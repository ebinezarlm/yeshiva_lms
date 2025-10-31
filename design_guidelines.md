# TutorDashboard Design Guidelines

## Design Approach: Productivity-Focused Dashboard

**Selected System**: Material Design-inspired with modern dashboard aesthetics  
**Justification**: This is a utility-focused video management tool requiring clear information hierarchy, efficient workflows, and intuitive data visualization. Drawing inspiration from platforms like **Notion**, **Linear**, and **YouTube Studio** for their clean, functional dashboard interfaces.

---

## Core Design Elements

### A. Typography

**Font Family**: Inter or DM Sans (via Google Fonts CDN)

**Hierarchy**:
- Page Title: text-2xl md:text-3xl font-bold
- Section Headers: text-xl font-semibold
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Labels/Metadata: text-sm font-medium text-gray-600
- Helper Text: text-xs text-gray-500

### B. Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 (e.g., p-4, gap-6, mb-8)

**Container Structure**:
- Main container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Page padding: py-8
- Section spacing: mb-8
- Component gaps: gap-6 for grids, gap-4 for forms

**Responsive Grid**:
- Desktop (lg): Two-column layout (form: 1/3 width, video grid: 2/3 width)
- Tablet (md): Stacked layout with full-width form above grid
- Mobile: Single column, full-width everything

**Video Grid**:
- Desktop: grid-cols-1 lg:grid-cols-2 xl:grid-cols-3
- Tablet: grid-cols-2
- Mobile: grid-cols-1
- Gap: gap-6

---

## Component Library

### Dashboard Header
- Full-width header with page title "Video Management Dashboard"
- Subtitle/description: "Manage your educational video content"
- Optional stat counters: "Total Videos: X" displayed as small badges

### Add Video Form Card
**Structure**:
- White background with subtle shadow (shadow-md)
- Rounded corners: rounded-lg
- Padding: p-6
- Sticky positioning on desktop: sticky top-8

**Form Elements**:
- Input fields with labels above
- Input styling: w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
- Label styling: block mb-2 text-sm font-medium text-gray-700
- Textarea for description: rows={4}
- Select dropdown for category with icon indicator
- Submit button: Full-width, primary style (see Buttons section)

**Field Arrangement**:
- Title (text input)
- Description (textarea)
- Video URL (text input with helper text: "Enter YouTube or Vimeo URL")
- Category (select dropdown with options: Tutorial, Lecture, Demo, Review)

### Video Cards
**Card Structure**:
- Background: white with shadow-lg hover:shadow-xl transition
- Border radius: rounded-xl
- Padding: p-0 (image fills top)
- Aspect ratio container for video preview: aspect-video

**Card Content Layout**:
1. **Video Preview Section**: 
   - iframe embedded at top with rounded-t-xl
   - Fallback thumbnail if URL invalid
   - Overlay play icon when hovering

2. **Content Section** (p-5):
   - Video title (font-semibold, text-lg, mb-2)
   - Category badge (inline-flex px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800)
   - Description text (text-sm text-gray-600, line-clamp-3)

3. **Action Footer** (p-4 pt-0):
   - Delete button (see Buttons section)
   - View count or duration metadata (optional)

### Buttons

**Primary Button (Add Video)**:
- bg-blue-600 hover:bg-blue-700 active:bg-blue-800
- text-white font-medium
- px-6 py-3 rounded-lg
- shadow-sm hover:shadow-md transition-all
- Disabled state: opacity-50 cursor-not-allowed

**Danger Button (Delete)**:
- bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700
- border border-red-200
- px-4 py-2 rounded-lg
- text-sm font-medium
- Icon: Trash icon from Heroicons (via CDN)

**Button Icons**: Use Heroicons v2 Outline
- Add: PlusIcon
- Delete: TrashIcon

### Empty State
When no videos exist:
- Centered content with illustration placeholder
- Icon: VideoCameraIcon from Heroicons (large, 64px)
- Heading: "No videos yet"
- Description: "Add your first educational video using the form"
- Subtle background: bg-gray-50 rounded-lg p-12

### Loading States
- Skeleton cards matching video card dimensions
- Pulsing animation: animate-pulse bg-gray-200
- Form disabled with opacity-60 during submission

---

## Visual Treatments

### Shadows & Depth
- Cards: shadow-md
- Hovered cards: shadow-lg
- Form container: shadow-lg
- Buttons: shadow-sm hover:shadow

### Borders & Dividers
- Input borders: border-gray-300
- Focus rings: ring-2 ring-blue-500
- Card separators: border-t border-gray-100 (if needed)

### Interactive States
- Hover transitions: transition-all duration-200
- Focus states: Always include focus:ring for accessibility
- Active button states: transform active:scale-98

---

## Responsive Behavior

**Desktop (lg: 1024px+)**:
- Side-by-side layout: Form fixed on left (360px wide), grid takes remaining space
- Sticky form behavior
- 3-column video grid

**Tablet (md: 768px)**:
- Stacked layout: Form full-width at top
- 2-column video grid
- Reduced padding

**Mobile (base to md)**:
- Single column everything
- Full-width form and cards
- Larger touch targets for buttons (min-height: 44px)

---

## Accessibility

- All form inputs have associated labels with htmlFor
- Error states shown with text-red-600 and border-red-500
- Focus indicators on all interactive elements (ring-2)
- ARIA labels on icon-only buttons
- Semantic HTML: form, section, button elements

---

## Animations

**Use Sparingly**:
- Card hover elevation change
- Button press animation (scale)
- Form submission success: Brief checkmark animation
- Delete confirmation: Fade out removed card

**No Animations For**:
- Page load
- Scroll effects
- Background animations

---

## Images

**No hero image required** - This is a dashboard application focused on utility.

**Video Thumbnails**:
- Generated from iframe embeds or URL previews
- Fallback: Gray placeholder with video icon
- Maintain 16:9 aspect ratio