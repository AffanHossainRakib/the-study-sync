# 📚 The Study Sync - Collaborative Study Plan Manager

> A modern, colorful web application for creating, sharing, and tracking study plans with built-in progress monitoring, resource management, and smart notifications.

[![Next.js](https://img.shields.io/badge/Next.js-16.1.0-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.3-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0.0-green)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)

## 🌟 Features

### 📋 Study Plan Management

- **Create Study Plans** - Build structured study plans with curated resources
- **Public/Private Plans** - Share publicly or keep private
- **Collaborative Editing** - Share plans with collaborators (editor/viewer roles)
- **Course Organization** - Organize plans by course codes (CSE110, EEE220, etc.)
- **Search & Filtering** - Find plans by title, description, or course code
- **Sorting Options** - Sort by newest, popular, or shortest duration

### 🎯 Multi-Source Resource Integration

- **YouTube Videos** - Auto-fetch video metadata (title, duration, thumbnail) via YouTube Data API v3
- **YouTube Playlists** - Bulk import entire playlists with automatic video extraction
- **PDF Documents** - Add PDFs with custom titles, page counts, and reading time estimates
- **Articles** - Track online articles with time estimates
- **Google Drive Links** - Support for Google Drive resources
- **Custom Links** - Support for any external links with optional metadata
- **Smart De-duplication** - Resources are globally shared to prevent duplicates

### 📊 Instance Management & Progress Tracking

- **Instance-based System** - Start personal instances of any study plan
- **Custom Titles & Notes** - Personalize instances with custom names and notes
- **Deadline Management** - Set target completion dates
- **Custom Reminders** - Configure email reminders (e.g., "1 day before", "2 hours before")
- **Resource Snapshot** - Instance resources are independent from original plan
- **Multiple Instances** - Create multiple instances from the same plan
- **Dual Progress Metrics**:
  - Resource-based tracking (X/Y resources completed with percentage)
  - Time-based tracking (X/Y minutes completed with percentage)
- **Global Progress** - Mark resources complete across all instances
- **Visual Progress Bars** - Real-time progress visualization with smooth animations
- **Instant Updates** - No page refresh when marking resources complete

### 🔔 Notification & Reminder System

- **Email Notifications** - Nodemailer integration with Gmail SMTP
- **Multiple Notification Types**:
  - Daily study reminders
  - Deadline warnings
  - Custom deadline reminders (configurable: X days/hours before)
  - Weekly digest support
  - Share invitation emails
- **User-Configurable Settings** - Control notification preferences
- **Automated Reminders** - Vercel Cron jobs for scheduled notifications
- **Duplicate Prevention** - Smart tracking to prevent duplicate reminders

### 🤝 Collaboration & Sharing

- **Email-based Sharing** - Invite collaborators to edit your study plans
- **Role-based Access** - Assign editor or viewer permissions
- **Share Management** - Remove shared access anytime
- **Public Discovery** - Browse and start community-created public plans
- **Shared Plan Discovery** - View plans shared with you

### 📈 Analytics & Tracking

- **Vercel Analytics** - Page view and performance monitoring

### 🎨 Modern UI — "Deep Ocean" Design System

- **Token-Driven Theming** - One source of truth: all colors are OKLCH CSS variables in `src/app/globals.css`, exposed via Tailwind v4 `@theme`. Rebrand the whole app by editing one file.
- **Deep Ocean Palette** - Royal-blue primary with a cyan accent on cool slate neutrals
- **Semantic Tokens** - `primary`, `card`, `muted`, `border`, plus status tokens `success` / `warning` / `info` / `destructive` (no hard-coded hex in pages)
- **Smooth Animations** - Framer Motion for delightful interactions
- **Dark/Light Mode** - Full theme support with next-themes
- **Responsive Design** - Works perfectly on all devices
- **Accessible Components** - Built with Radix UI primitives
- **Drag & Drop** - Intuitive resource reordering

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- MongoDB database (MongoDB Atlas recommended)
- Firebase project (for authentication)
- YouTube Data API v3 key (optional, for YouTube integration)
- Gmail account (optional, for email notifications)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/AffanHossainRakib/study-sync.git
cd study-sync
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create `.env.local` in the root directory:

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study_sync

# Firebase Client (Public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Firebase Admin (place serviceAccountKey.json in root or use env variable)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# YouTube Data API v3 (Optional)
YOUTUBE_API_KEY=your_youtube_api_key

# Email Service (Optional - for notifications)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Vercel Cron (Optional)
CRON_SECRET=your_secret_key

# App URL (Optional - for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Add Firebase Admin credentials**

Place `serviceAccountKey.json` in the root directory or set the `FIREBASE_SERVICE_ACCOUNT` environment variable with your Firebase service account JSON.

5. **Run development server**

```bash
npm run dev
```

6. **Open your browser**

Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
study-sync/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                # Authentication pages
│   │   │   ├── login/            # Login page
│   │   │   ├── register/         # Registration page
│   │   │   └── forget-password/  # Password reset
│   │   ├── plans/                # Study plan pages
│   │   │   ├── [id]/            # Plan details
│   │   │   │   └── edit/        # Edit plan
│   │   │   └── page.jsx         # Browse Public Plans
│   │   ├── my-plans/             # User's study plans
│   │   ├── instances/            # Study instances
│   │   │   └── [id]/            # Instance details
│   │   ├── create-plan/          # Create new plan
│   │   ├── dashboard/            # User dashboard
│   │   ├── profile/              # User profile settings
│   │   ├── api/                  # API routes
│   │   │   ├── study-plans/     # Study plan CRUD
│   │   │   ├── instances/       # Instance management
│   │   │   ├── resources/       # Resource handling
│   │   │   ├── user-progress/   # Progress tracking
│   │   │   ├── users/           # User management
│   │   │   ├── notifications/   # Notification settings
│   │   │   └── cron/            # Scheduled tasks
│   │   └── page.jsx             # Landing page
│   ├── components/               # React components
│   │   ├── Auth/                # Login/signup forms
│   │   ├── Home/                # Landing page sections
│   │   ├── ui/                  # UI components
│   │   ├── Navbar.jsx           # Navigation bar
│   │   ├── Footer.jsx           # Footer
│   │   └── EditInstanceModal.jsx
│   ├── contexts/                # React contexts
│   │   └── AuthContext.jsx     # Authentication context
│   ├── hooks/                   # Custom React hooks
│   │   └── useAuth.js          # Auth hook
│   ├── lib/                     # Utilities and helpers
│   │   ├── api.js              # API client
│   │   ├── firebase.js         # Firebase client
│   │   ├── firebase-admin.js   # Firebase admin
│   │   ├── mongodb.js          # MongoDB connection
│   │   ├── db.js               # Database utilities
│   │   ├── auth.js             # Auth middleware
│   │   ├── youtube.js          # YouTube API
│   │   └── email.js            # Email service
│   └── providers/              # Context providers
├── public/                      # Static assets
├── src/app/globals.css         # Design tokens & Tailwind v4 theme
├── next.config.mjs             # Next.js configuration
└── package.json                # Dependencies
```

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 16.1.0 (App Router architecture)
- **UI Library**: React 19.2.3
- **Language**: JavaScript/JSX
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI (accessible components), Lucide Icons
- **Drag & Drop**: @dnd-kit library
- **Animations**: Framer Motion 12
- **Notifications**: React Hot Toast & Sonner
- **Theme Management**: next-themes (dark mode support)

### Backend (Next.js API Routes)

- **Runtime**: Node.js
- **Database**: MongoDB (Native Driver 7.0.0)
  - Database Name: `study_sync`
  - Connection: MongoDB Atlas
  - Connection Pooling: Global caching in development
- **Authentication**: Firebase Admin SDK 13.6.0
- **Email Service**: Nodemailer 7.0.12 (Gmail SMTP)

### External APIs & Services

- **YouTube Data API v3**: Video and playlist metadata via googleapis
- **Firebase**: Client and admin authentication
- **Vercel**: Hosting, analytics, and cron jobs

### Database Architecture

The application uses MongoDB with **5 main collections**:

1. **users** - User profiles and notification settings
2. **resources** - Global resource pool (YouTube videos, PDFs, articles, etc.)
3. **studyplans** - Study plan templates with metadata
4. **instances** - User's personal study instances with progress
5. **userprogresses** - Global completion tracking per user per resource

## 📖 Key Concepts

### Study Plans vs Instances

- **Study Plan** - A template/class containing curated resources
- **Instance** - A personal copy of a study plan with independent progress tracking
- Users can create multiple instances from the same study plan
- Instances snapshot resources at creation time for independence

### Global Resource Pool

- Resources (videos, PDFs, articles) are stored once and referenced by ID
- Prevents duplication when the same resource is used in multiple plans
- URL-based de-duplication ensures consistency

### Global Progress Tracking

- Marking a resource complete applies across ALL user instances
- Allows users to see previously completed content anywhere
- Progress is user-specific and persistent
- Instant UI updates without page refresh

## 🎨 Features in Detail

### Study Plan Creation

1. Enter basic info (title, short description, full description, course code)
2. Add resources from multiple sources:
   - YouTube videos (auto-fetch metadata)
   - YouTube playlists (bulk import)
   - PDFs with page count and reading estimates
   - Articles, Google Drive links, custom links
3. Reorder resources via intuitive drag-and-drop
4. Toggle public/private visibility
5. Share with collaborators via email (editor/viewer roles)

### Instance Management

1. Browse public plans, your own plans, or shared plans
2. Click "Start This Plan" to create an instance
3. Set target completion date
4. Add personal notes and custom title
5. Configure custom deadline reminders
6. Track progress with dual metrics (resources + time)
7. Mark resources complete with instant visual feedback
8. Edit instance details anytime

### Dashboard

- **Colorful Statistics**: Active plans, overall progress, resources completed, plans created
- **Upcoming Deadlines**: See nearest deadlines with color-coded urgency
- **Active Study Plans**: Visual cards with gradient progress bars
- **Quick Actions**: Browse plans, create plan, view my plans

### Notification System

- **Daily Reminders**: Scheduled study reminders
- **Deadline Warnings**: Alerts before deadlines
- **Custom Reminders**: User-defined notification timing
- **Email Templates**: Professional, branded emails
- **Cron Jobs**: Automated processing via Vercel Cron

## 🔒 Authentication Flow

1. User signs up/logs in via Firebase (email/password or Google OAuth)
2. Frontend receives Firebase ID token
3. Token included in `Authorization: Bearer <token>` header for API calls
4. Backend (API routes) verifies token with Firebase Admin SDK
5. User auto-created in MongoDB on first login
6. Subsequent requests use the same token
7. Protected routes redirect to login if not authenticated

## 📡 API Overview

### Study Plans (`/api/study-plans`)

- `GET /api/study-plans` - List plans (public or user's with filters)
- `GET /api/study-plans/:id` - Get single plan with resources
- `POST /api/study-plans` - Create new plan
- `PUT /api/study-plans/:id` - Update plan
- `DELETE /api/study-plans/:id` - Delete plan
- `POST /api/study-plans/:id/share` - Share with collaborator
- `DELETE /api/study-plans/:id/share/:userId` - Remove shared access

### Instances (`/api/instances`)

- `GET /api/instances` - Get user's instances with progress
- `GET /api/instances/:id` - Get instance details with resources
- `POST /api/instances` - Create new instance
- `PUT /api/instances/:id` - Update instance (title, notes, deadline, reminders)
- `DELETE /api/instances/:id` - Delete instance

### Resources (`/api/resources`)

- `POST /api/resources` - Create or get resource (handles YouTube API calls)
- `GET /api/resources/bulk` - Get multiple resources by IDs
- `GET /api/resources/:id` - Get single resource

### User Progress (`/api/user-progress`)

- `GET /api/user-progress` - Get user's global progress
- `POST /api/user-progress` - Toggle resource completion (instant update)
- `GET /api/user-progress/check` - Check completion status

### Users (`/api/users`)

- `GET /api/users/me` - Get current user info
- `GET /api/users/me/notifications` - Get notification settings
- `PUT /api/users/me/notifications` - Update notification settings

### Notifications (`/api/notifications`)

- `GET /api/notifications/settings` - Get notification preferences
- `PUT /api/notifications/settings` - Update notification preferences
- `POST /api/notifications/test-email` - Send test email

### Cron Jobs (`/api/cron`)

- `GET /api/cron/reminders` - Process and send deadline reminders

## 🎨 UI Design System

### Color Palette ("Deep Ocean")

All colors are CSS variables defined once in `src/app/globals.css` (light + dark) and consumed through semantic Tailwind tokens — pages never hard-code hex/`slate-*` values.

- **Primary**: Royal blue (`--primary`) for primary actions, links, and active states
- **Accent / Info**: Cyan (`--accent` / `--info`) for highlights and secondary brand gradients
- **Neutrals**: `background`, `card`, `muted`, `border`, `foreground`, `muted-foreground` (cool slate)
- **Status**: `success` (emerald), `warning` (amber), `info` (cyan), `destructive` (red)
- **Resource Types**: Red (YouTube), Blue (PDF), Green (Others) — a deliberate functional legend kept for content-type recognition

### Components

- **Cards**: `bg-card` + `border-border`, rounded corners, subtle shadows, hover lift
- **Buttons**: Solid `primary` / `secondary` / outline variants (see `components/ui/button.jsx`)
- **Progress Bars**: `primary` fills (and `primary → info` gradients) with smooth transitions
- **Modals**: Backdrop blur, token-based surfaces and borders
- **Empty States**: Dashed `border-border` with `primary` CTAs

## 🚧 Future Enhancements

### Advanced Features

- [ ] AI-generated study plan suggestions
- [ ] Smart quiz generation from resources
- [ ] Personalized study schedule optimization
- [ ] Advanced analytics dashboard with charts
- [ ] Streak tracking and achievement badges

### Mobile & Extensions

- [ ] Native mobile app (iOS & Android)
- [ ] Offline mode for accessing materials
- [ ] Chrome extension for quick resource addition
- [ ] Browser bookmarklet for easy sharing

### Collaboration

- [ ] Real-time collaborative editing
- [ ] Discussion forums for each plan
- [ ] Study group creation and management
- [ ] Live chat between collaborators
- [ ] Peer review system

### Integration

- [ ] LMS integration (Moodle, Canvas)
- [ ] Google Calendar sync
- [ ] Notion/Evernote integration
- [ ] Spotify integration for study playlists
- [ ] Pomodoro timer integration

### Gamification

- [ ] Points and rewards system
- [ ] Leaderboards for competitive learning
- [ ] Daily challenges and streaks
- [ ] Social sharing of achievements

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write clear commit messages
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Affan Hossain Rakib**

- GitHub: [@AffanHossainRakib](https://github.com/AffanHossainRakib)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org) - The React Framework
- Styled with [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- Icons by [Lucide](https://lucide.dev) - Beautiful & consistent icons
- UI Components from [Radix UI](https://www.radix-ui.com/) - Accessible components
- Animations by [Framer Motion](https://www.framer.com/motion/) - Production-ready animations
- Authentication by [Firebase](https://firebase.google.com/) - Secure auth
- Database by [MongoDB](https://www.mongodb.com/) - Flexible NoSQL database
- Hosted on [Vercel](https://vercel.com) - Frontend cloud platform

## 📸 Screenshots

### Dashboard

Beautiful gradient-based dashboard with colorful stats and upcoming deadlines.

### Study Plans

Browse and discover community study plans with colorful cards and smooth animations.

### Instance Tracking

Track your progress with dual metrics (resources + time) and instant visual feedback.

### Resource Management

Add resources from multiple sources with auto-metadata fetching and drag-and-drop reordering.

---

**Made with ❤️ for students who want to study smarter, not harder.**

_The Study Sync - Your collaborative learning companion_ 📚✨
