# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Strict Me is a Japanese study management application for exam preparation students. It features AI-powered feedback, study time tracking, goal setting, and social features for sharing study progress.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript with strict mode
- **Authentication & Database**: Supabase (SSR-compatible)
- **AI Integration**: OpenAI GPT-4o (Japanese language support)
- **Styling**: Tailwind CSS v4
- **UI Libraries**:
  - Framer Motion for animations
  - Lucide React for icons
  - date-fns for date manipulation (Japanese locale)

## Development Commands

```bash
# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm build

# Start production server
npm start

# Run linter
npm run lint
```

## Architecture

### Authentication Flow

The app uses Supabase SSR authentication with middleware-based protection:

1. **Middleware** (`src/middleware.ts`): Handles auth state and redirects
   - Unauthenticated users → `/login` (except `/auth/*` routes)
   - Authenticated users visiting `/login` → `/`
   - Uses `@supabase/ssr` for cookie-based session management

2. **Supabase Client Factories**:
   - `src/lib/supabase/client.ts`: Browser client for Client Components (`"use client"`)
   - `src/lib/supabase/server.ts`: Server client for Server Components and API routes

### Data Model

Key database tables (Supabase):

- `study_records`: Study session tracking (user_id, subject, duration, date, notes)
- `materials`: User's study materials (name, image, status)
- `comments`: Social comments on study records (record_id, user_id, content)
- `follows`: User follow relationships (follower_id, following_id)
- `profiles`: User profile information (id, display_name, bio, gender, etc.)
- Authentication managed by Supabase Auth

### Component Structure

**Pages** (App Router):
- `/` - Dashboard with social feed of all users' study records (with follow/all tabs)
- `/record` - Material-based study recording with manual/stopwatch modes
- `/records/[id]` - Individual study record detail page with comments
- `/goals` - Weekly/monthly study reports with calendar visualization
- `/ai` - AI chat interface for study guidance
- `/materials` - Material management
- `/profile` - Current user's profile page
- `/profile/edit` - Profile editing page
- `/users/[id]` - Other users' profile pages with follow button
- `/login` - Authentication page
- `/auth/callback` - OAuth callback handler

**Shared Components** (`src/components/`):
- `Dashboard.tsx`: Main social feed with follow filtering (used on homepage with `readOnly={true}`)
- `Sidebar.tsx`: Navigation sidebar (desktop + mobile responsive)
- `FollowButton.tsx`: Follow/unfollow button with state management
- `AIChat.tsx`: Chat interface with OpenAI integration
- `AIFeedback.tsx`: AI-powered study feedback widget
- `GoalTimeline.tsx`: Visual goal tracking
- `DailyRecordList.tsx`: Study record list view
- `SleepSchedule.tsx`: Sleep tracking visualization

### AI Integration

**API Route**: `/api/chat/route.ts`

- Uses OpenAI GPT-4o with custom system prompt (Japanese, strict study advisor persona)
- Configured for concise responses (1-2 lines)
- Environment variable: `OPENAI_API_KEY`

### State Management

No global state library - uses React hooks and Supabase real-time subscriptions where needed.

### Styling Patterns

- Tailwind utility-first approach
- Responsive design with `md:` breakpoints for desktop
- Mobile-first design with bottom navigation (hidden on desktop)
- Uses `clsx` for conditional class composition
- Japanese language UI throughout

### Path Aliases

TypeScript paths configured in `tsconfig.json`:
- `@/*` → `./src/*`

## Environment Variables

Required environment variables (create `.env.local`):

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## Common Patterns

### Client Component with Supabase

```typescript
"use client";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### Server Component with Supabase

```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### Date Formatting

Use `date-fns` with Japanese locale:

```typescript
import { format } from "date-fns";
import { ja } from "date-fns/locale";

format(date, "yyyy年MM月dd日", { locale: ja });
```

## Social Features

### Follow System
- Users can follow other users via the `FollowButton` component
- Dashboard has two tabs: "フォロー中" (Following) and "すべて" (All)
- Following tab shows records from followed users + own records
- Follower/following counts displayed on profile pages
- User profiles accessible by clicking usernames in timeline

### Comments
- Comments are shown only on individual record detail pages (`/records/[id]`)
- Timeline shows only comment count, not content
- Comments grouped by record_id

## Notes

- All UI text is in Japanese - maintain Japanese language for user-facing content
- The app targets exam preparation students - AI feedback should be strict but helpful
- Study records can have comments from other users (social feature)
- Materials can optionally have images and are linked to study records by name matching
- User display names are fetched from `profiles` table and enriched into records
