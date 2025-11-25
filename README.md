# ProUltima Task Manager PWA

📌 Overview

Proultima is a full-stack Project Management System built for engineering companies to manage projects, teams, job flows, transmittals, takeoffs, and client communications.
This application is built with Next.js, TypeScript, Tailwind CSS, Node.js, Supabase (Auth + DB + Storage) and is designed for real-world industrial usage.

- **Progressive Web App (PWA)** - Installable on mobile devices with offline capabilities
- **Modern Dashboard** - Real-time statistics and task overview
- **Team Management** - Create teams and assign staff members
- **Real-time Updates** - Live data synchronization with Supabase
- **Optimistic Updates** - Instant UI feedback for better UX
- **Responsive Design** - Works on desktop and mobile devices

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase
- **State Management**: React Query + Zustand
- **Drag & Drop**: @dnd-kit
- **PWA**: @ducanh2912/next-pwa
- **Notifications**: Sonner

## 📁 Project Structure

```
.
├── app
│   ├── admin
│   │   ├── cashbook
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── dashboard
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── diagnostics
│   │   │   └── page.tsx
│   │   ├── help
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── maintenance
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── reports
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── settings
│   │   │   ├── loading.tsx
│   │   │   ├── opening-balance
│   │   │   │   └── [id]
│   │   │   │       └── history
│   │   │   │           └── page.tsx
│   │   │   └── page.tsx
│   │   ├── staff
│   │   │   ├── loading.tsx
│   │   │   └── page.tsx
│   │   ├── tasks
│   │   │   ├── [id]
│   │   │   │   └── diagram
│   │   │   │       └── page.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── page.tsx
│   │   │   └── tasks-page-client.tsx
│   │   └── teams
│   │       ├── loading.tsx
│   │       └── page.tsx
│   ├── api
│   │   ├── cashbook
│   │   │   ├── notifications
│   │   │   │   └── route.ts
│   │   │   ├── transactions
│   │   │   │   ├── approve
│   │   │   │   │   └── route.ts
│   │   │   │   └── reject
│   │   │   │       └── route.ts
│   │   │   └── voucher-number
│   │   │       └── route.ts
│   │   ├── cron
│   │   │   ├── create-repeated-tasks
│   │   │   │   └── route.ts
│   │   │   └── daily-report
│   │   │       └── route.ts
│   │   ├── email
│   │   │   ├── cash-transaction-pending
│   │   │   │   └── route.ts
│   │   │   ├── send-asset-notification
│   │   │   │   └── route.ts
│   │   │   ├── send-delegation-notification
│   │   │   │   └── route.ts
│   │   │   ├── send-grocery-notification
│   │   │   │   └── route.ts
│   │   │   ├── send-low-balance-alert
│   │   │   │   └── route.ts
│   │   │   ├── send-maintenance-notification
│   │   │   │   └── route.ts
│   │   │   ├── send-proof-notification
│   │   │   │   └── route.ts
│   │   │   ├── send-purchase-notification
│   │   │   │   └── route.ts
│   │   │   ├── send-reschedule-notification
│   │   │   │   └── route.ts
│   │   │   ├── send-scrap-notification
│   │   │   │   └── route.ts
│   │   │   ├── send-task-notification
│   │   │   │   └── route.ts
│   │   │   └── test-low-balance
│   │   │       └── route.ts
│   │   ├── opening-balance
│   │   │   └── append
│   │   │       └── route.ts
│   │   ├── storage
│   │   │   └── sign
│   │   │       └── route.ts
│   │   └── support
│   │       └── send-report
│   │           └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── login
│   │   └── page.tsx
│   ├── manifest.ts
│   ├── not-found.tsx
│   ├── page.tsx
│   └── staff
│       ├── accounting
│       │   └── approvals
│       │       └── page.tsx
│       ├── cashbook
│       │   ├── loading.tsx
│       │   └── page.tsx
│       ├── dashboard
│       │   ├── loading.tsx
│       │   └── page.tsx
│       ├── help
│       │   └── loading.tsx
│       ├── layout.tsx
│       ├── maintenance
│       │   ├── loading.tsx
│       │   └── page.tsx
│       ├── reports
│       │   ├── loading.tsx
│       │   └── page.tsx
│       ├── settings
│       │   ├── loading.tsx
│       │   └── page.tsx
│       └── tasks
│           ├── loading.tsx
│           └── page.tsx
├── components
│   ├── admin
│   │   ├── asset-approval-dialog.tsx
│   │   ├── asset-requests-table.tsx
│   │   ├── attendance-table.tsx
│   │   ├── attendance-widget.tsx
│   │   ├── completed-tasks-table.tsx
│   │   ├── grocery-approval-dialog.tsx
│   │   ├── grocery-report-table.tsx
│   │   ├── incomplete-tasks-table.tsx
│   │   ├── maintenance-approval-dialog.tsx
│   │   ├── maintenance-notification-dropdown.tsx
│   │   ├── maintenance-report-table.tsx
│   │   ├── notification-dropdown.tsx
│   │   ├── purchase-approval-dialog.tsx
│   │   ├── purchase-report-table.tsx
│   │   ├── realtime-data-sync.tsx
│   │   ├── reports-content.tsx
│   │   ├── reschedule-approval-dialog.tsx
│   │   ├── scrap-approval-dialog.tsx
│   │   ├── scrap-report-table.tsx
│   │   ├── settings
│   │   │   ├── notification-settings.tsx
│   │   │   ├── opening-balance-manager.tsx
│   │   │   ├── profile-settings.tsx
│   │   │   ├── system-options-manager.tsx
│   │   │   ├── task-priority-manager.tsx
│   │   │   └── task-status-manager.tsx
│   │   ├── staff-details-dialog.tsx
│   │   ├── task-priority-manager.tsx
│   │   ├── task-verification-dialog.tsx
│   │   ├── transaction-details-dialog.tsx
│   │   └── verify-product-dialog.tsx
│   ├── app-sidebar.tsx
│   ├── asset
│   │   ├── asset-request-pdf-report.tsx
│   │   └── download-asset-pdf.tsx
│   ├── cashbook
│   │   ├── all-transactions-pdf-report.tsx
│   │   ├── branch-pdf-report.tsx
│   │   ├── cash-summary-cards.tsx
│   │   ├── download-transaction-pdf.tsx
│   │   ├── export-pdf-dialog.tsx
│   │   ├── multiple-image-upload.tsx
│   │   ├── nature-expense-combobox.tsx
│   │   ├── staff-pdf-report.tsx
│   │   ├── transaction-details-dialog.tsx
│   │   └── transaction-pdf-receipt.tsx
│   ├── chart-area-interactive.tsx
│   ├── comp-313.tsx
│   ├── comp-331.tsx
│   ├── connection-status.tsx
│   ├── dashboard
│   │   ├── dashboard-client.tsx
│   │   ├── dashboard-stats-cards.tsx
│   │   ├── productivity-chart.tsx
│   │   ├── quick-actions.tsx
│   │   ├── recent-tasks.tsx
│   │   └── team-overview.tsx
│   ├── data-table.tsx
│   ├── error-boundary.tsx
│   ├── login-form.tsx
│   ├── maintenance
│   │   ├── download-maintenance-pdf.tsx
│   │   ├── maintenance-details-dialog.tsx
│   │   ├── maintenance-form-drawer.tsx
│   │   ├── maintenance-request-pdf-report.tsx
│   │   └── purchase-requisition-drawer.tsx
│   ├── nav-documents.tsx
│   ├── nav-main.tsx
│   ├── nav-secondary.tsx
│   ├── nav-user.tsx
│   ├── notification-bell.tsx
│   ├── notification-island
│   │   ├── admin-notification-island.tsx
│   │   ├── category-icons.tsx
│   │   ├── notification-island-manager.tsx
│   │   ├── notification-island.tsx
│   │   └── staff-notification-island.tsx
│   ├── notification-widget
│   │   ├── admin-notification-panel.tsx
│   │   ├── floating-notification-widget.tsx
│   │   ├── notification-widget-manager.tsx
│   │   └── staff-notification-panel.tsx
│   ├── pdf
│   │   ├── maintenance-report-pdf.tsx
│   │   ├── purchase-report-pdf.tsx
│   │   ├── scrap-report-pdf.tsx
│   │   └── tasks-report-pdf.tsx
│   ├── purchase
│   │   ├── download-purchase-pdf.tsx
│   │   ├── purchase-requisition-pdf-report.tsx
│   │   └── upload-product-dialog.tsx
│   ├── reports
│   │   ├── maintenance-report-table.tsx
│   │   ├── purchase-report-table.tsx
│   │   └── tasks-report-table.tsx
│   ├── scrap
│   │   └── download-scrap-pdf.tsx
│   ├── section-cards.tsx
│   ├── site-header.tsx
│   ├── smoothui
│   │   └── ui
│   │       └── DynamicIsland.tsx
│   ├── staff
│   │   ├── add-asset-drawer.tsx
│   │   ├── add-cash-transaction-dialog.tsx
│   │   ├── add-grocery-drawer.tsx
│   │   ├── add-scrap-drawer.tsx
│   │   ├── asset-requests-table.tsx
│   │   ├── delegate-task-dialog.tsx
│   │   ├── edit-asset-drawer.tsx
│   │   ├── edit-grocery-drawer.tsx
│   │   ├── edit-purchase-drawer.tsx
│   │   ├── edit-scrap-drawer.tsx
│   │   ├── employee-form-optimized.tsx
│   │   ├── employee-form-popup.tsx
│   │   ├── grocery-details-dialog.tsx
│   │   ├── help-support-form.tsx
│   │   ├── password-change-form.tsx
│   │   ├── profile-settings-form.tsx
│   │   ├── purchase-requisition-view-dialog.tsx
│   │   ├── realtime-task-update.tsx
│   │   ├── reschedule-task-dialog.tsx
│   │   ├── scrap-report-table.tsx
│   │   ├── staff-card-skeleton.tsx
│   │   ├── staff-card.tsx
│   │   ├── staff-dashboard-tasks-table.tsx
│   │   ├── staff-form-dialog.tsx
│   │   ├── staff-notification-dropdown.tsx
│   │   ├── staff-search-bar.tsx
│   │   ├── staff-table.tsx
│   │   ├── staff-task-details-dialog.tsx
│   │   ├── staff-tasks-table.tsx
│   │   ├── task-proof-upload.tsx
│   │   ├── update-task-dialog.tsx
│   │   └── verify-delegation-dialog.tsx
│   ├── staff-sidebar.tsx
│   ├── tasks
│   │   ├── edit-task-dialog.tsx
│   │   ├── kanban-board.tsx
│   │   ├── member-node.tsx
│   │   ├── task-allocation-dialog.tsx
│   │   ├── task-card.tsx
│   │   ├── task-details-dialog.tsx
│   │   ├── task-diagram-node.tsx
│   │   ├── task-filter-controls.tsx
│   │   ├── task-priority-filter.tsx
│   │   ├── task-search.tsx
│   │   ├── task-staff-filter.tsx
│   │   ├── task-stats-cards.tsx
│   │   ├── task-status-filter.tsx
│   │   ├── tasks-management.tsx
│   │   └── tasks-table.tsx
│   ├── teams
│   │   ├── delete-team-dialog.tsx
│   │   ├── edit-team-dialog.tsx
│   │   ├── team-card-skeleton.tsx
│   │   ├── team-card.tsx
│   │   ├── team-form-dialog.tsx
│   │   ├── teams-grid.tsx
│   │   └── teams-management.tsx
│   └── ui
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── calendar.tsx
│       ├── card.tsx
│       ├── chart.tsx
│       ├── checkbox.tsx
│       ├── command.tsx
│       ├── date-picker.tsx
│       ├── delete-confirmation-dialog.tsx
│       ├── dialog.tsx
│       ├── drawer.tsx
│       ├── dropdown-menu.tsx
│       ├── field.tsx
│       ├── form.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── pagination.tsx
│       ├── popover.tsx
│       ├── radio-group.tsx
│       ├── react-flow
│       │   ├── base-node.tsx
│       │   ├── database-schema-node.tsx
│       │   └── labeled-handle.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       ├── toggle-group.tsx
│       ├── toggle.tsx
│       └── tooltip.tsx
├── contexts
│   └── auth-context.tsx
├── hooks
│   ├── use-all-notifications.ts
│   ├── use-asset-requests.ts
│   ├── use-attendance-tasks.ts
│   ├── use-attendance.ts
│   ├── use-cash-transactions.ts
│   ├── use-character-limit.ts
│   ├── use-debounce.ts
│   ├── use-file-upload.ts
│   ├── use-grocery-requests.ts
│   ├── use-maintenance-requests.ts
│   ├── use-mobile.ts
│   ├── use-notification-categories.ts
│   ├── use-notification-count.ts
│   ├── use-notification-sound.ts
│   ├── use-notifications.ts
│   ├── use-opening-balance.ts
│   ├── use-purchase-requisitions.ts
│   ├── use-scrap-requests.ts
│   ├── use-signed-receipt-urls.ts
│   ├── use-staff-profile.ts
│   ├── use-staff.ts
│   ├── use-support-tickets.ts
│   ├── use-system-options.ts
│   ├── use-task-priorities.ts
│   ├── use-task-proofs.ts
│   ├── use-task-reschedules.ts
│   ├── use-task-statuses.ts
│   ├── use-tasks.ts
│   └── use-teams.ts
├── lib
│   ├── actions
│   │   ├── adminActions.ts
│   │   ├── dashboardActions.ts
│   │   ├── staffActions.ts
│   │   ├── taskActions.ts
│   │   └── teamActions.ts
│   ├── api-error-handler.ts
│   ├── auth.ts
│   ├── broadcast-sync.ts
│   ├── cache-cleanup.ts
│   ├── cleanup-indexdb.ts
│   ├── debounce.ts
│   ├── email.ts
│   ├── pdf
│   │   ├── exportMaintenanceReport.tsx
│   │   ├── exportPurchaseReport.tsx
│   │   ├── exportScrapReport.tsx
│   │   └── exportTasksReport.tsx
│   ├── providers
│   │   └── query-provider.tsx
│   ├── pwa.ts
│   ├── query-invalidation.ts
│   ├── react-query.ts
│   ├── storage-utils.ts
│   ├── supabase
│   │   ├── client.ts
│   │   └── server.ts
│   ├── task-proof-emails.ts
│   ├── task-utils.ts
│   ├── team-utils.ts
│   └── utils.ts
├── middleware.ts
├── stores
│   └── ui-store.ts
├── types
│   ├── attendance.ts
│   ├── auth.ts
│   ├── cashbook.ts
│   ├── grocery.ts
│   ├── index.ts
│   ├── maintenance.ts
│   ├── scrap.ts
│   └── support.ts
└── utils
    └── pdf-helpers.ts

88 directories, 318 files

```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pro-ultima-pwa
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase**
   - Create a new Supabase project
   - Set up the database tables (see Database Schema section)
   - Configure Row Level Security (RLS) policies

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🗄 Database Schema

### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  assignee_id UUID REFERENCES staff(id),
  status TEXT NOT NULL DEFAULT 'backlog',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  repeat TEXT DEFAULT 'none',
  team_id UUID REFERENCES teams(id)
);
```

### Staff Table
```sql
CREATE TABLE staff (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  department TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Teams Table
```sql
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  captain_id UUID REFERENCES staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Team Members Table
```sql
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, staff_id)
);
```

## 🎯 Development Phases

This project follows a structured development approach with 15 phases:

1. ✅ **Project Initialization** - Next.js 15 setup with dependencies
2. ✅ **PWA Configuration** - Service worker, manifest, offline capabilities
3. ⏳ **Supabase Setup** - Database, authentication, real-time features
4. ⏳ **State Management** - React Query + Zustand + Server Actions
5. ⏳ **Server Actions** - CRUD operations without API routes
6. ⏳ **Dashboard Page** - Stats cards and data table
7. ⏳ **Tasks Page** - Drag & drop kanban board
8. ⏳ **Teams Page** - Team creation with staff selection
9. ⏳ **Staff Page** - Staff management with CRUD
10. ⏳ **Reports Page** - Analytics and reporting
11. ⏳ **Optimistic Updates** - Instant UI feedback
12. ⏳ **Performance Optimization** - Loading states, caching
13. ⏳ **PWA Features** - Offline, install prompts
14. ⏳ **Testing & QA** - Component and PWA testing
15. ⏳ **Deployment** - Production setup and monitoring

## 📱 PWA Features

- **Offline Support** - Works without internet connection
- **Installable** - Can be installed on mobile devices
- **App-like Experience** - Standalone display mode
- **Push Notifications** - Real-time updates (optional)
- **Service Worker** - Background sync and caching

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions, please open an issue in the GitHub repository.

---

**Phase 1 Complete** ✅ - Project initialized with Next.js 15, PWA configuration, and basic structure setup.
