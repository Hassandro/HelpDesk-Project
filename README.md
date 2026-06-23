# HelpDesk Project

A full-stack helpdesk ticketing system built with React and PHP/MySQL. Users are assigned roles (Admin, Manager, IT-Agent, Employee) each with their own dashboard and permissions.

## Tech Stack

- **Frontend:** React (React Router, React Query, Recharts, react-hook-form, axios, jsPDF)
- **Backend:** PHP (REST API via mysqli)
- **Database:** MariaDB/MySQL (via XAMPP)
- **Web Server:** Apache (XAMPP) — serves both frontend and API on port 80

## Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Manage all users (create, activate/deactivate, delete), view global analytics, audit trail, Knowledge Base management |
| **Manager** | View all tickets, assign tickets to IT agents, close tickets, publish closed tickets to Knowledge Base, view global analytics, comment / add internal notes |
| **IT Agent** | View tickets assigned to them, update ticket status, log work time, attach files, comment / add internal notes, view personal analytics |
| **Employee** | Submit tickets, view their own tickets and status, reply to comments, attach files, read Knowledge Base |

## Features

### Ticket Workflow
`open → in_progress (assigned) → resolved → closed`, with a "failed to resolve" path that returns the ticket to the open queue. Rules are enforced server-side (e.g. resolved/closed tickets can't be reassigned).

### Notifications
Every ticket status change and file upload triggers a notification for the affected user. A bell icon in the header shows an unread count badge and a dropdown list. Notifications are fetched every 15 seconds via React Query's `refetchInterval`.

### Knowledge Base
Managers can publish closed tickets as KB articles (title + solution description). All roles can search and browse the KB. Managers and admins can remove entries.

### Analytics Dashboard
Role-aware analytics panel available to all roles:
- **KPI cards:** total tickets, open, resolved, avg resolution time, hours logged
- **Charts:** tickets by status (pie), by priority (bar), by category (bar), tickets over time — last 30 days (line)
- **Agent workload** bar chart (admin/manager only)
- **Per-user breakdown** table with ticket counts by status and hours logged (admin/manager only)
- **PDF export** button (admin/manager only) — exports the full panel to A4 landscape PDF via jsPDF + html2canvas

### Activity Logs / Audit Trail
Every action on a ticket (create, assign, status change, comment, file upload, close) is recorded in `ActivityLogs` with who did it and when. Shown as a collapsible timeline inside each ticket and as a global audit trail for admin/manager.

### Comments & Internal Notes
Staff can mark comments as internal (staff-only) — employees never see them. Displayed with a distinct yellow background and a lock badge.

### File Attachments
Files can be uploaded on any ticket. Allowed types: PNG, Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx). PHP validates extension and MIME type; an `.htaccess` rule blocks script execution in the uploads directory.

### Work Time Logging
IT agents log hours and minutes when updating ticket status. Time accumulates per ticket and is visible in analytics (Hours Logged KPI).

### Date Range Filter
All ticket lists include a date range picker (From / To) that filters visible tickets by creation date without an additional API call.

### Dark Mode
Each dashboard includes a dark mode toggle in the sidebar. The button is hidden when the sidebar is collapsed.

## Project Structure

```
HelpDesk-Project/
├── backend/
│   ├── api/
│   │   ├── login.php
│   │   ├── tickets.php
│   │   ├── users.php
│   │   ├── categories.php
│   │   ├── priorities.php
│   │   ├── roles.php
│   │   ├── comments.php
│   │   ├── activity.php
│   │   ├── attachments.php
│   │   ├── notifications.php
│   │   ├── knowledgebase.php
│   │   └── stats.php
│   ├── config/
│   │   ├── db.php
│   │   ├── activity.php
│   │   └── uploads.php
│   ├── app/                         ← React production build (served at /app/)
│   ├── uploads/                     ← uploaded attachment files (gitignored)
│   ├── database_migration.sql
│   ├── database_migration_2_roles.sql
│   ├── database_migration_4.sql
│   └── database_migration_5.sql
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ActivityTimeline.js
│       │   ├── Sidebar.js
│       │   ├── Attachments.js
│       │   ├── AuditTrail.js
│       │   ├── NotificationCenter.js
│       │   ├── KnowledgeBase.js
│       │   ├── AnalyticsPanel.js
│       │   ├── DateRangeFilter.js
│       │   └── Icons.js
│       └── pages/
│           ├── Login.js
│           ├── AdminDashboard.js
│           ├── ManagerDashboard.js
│           ├── AgentDashboard.js
│           └── EmployeeDashboard.js
└── mysql/
    └── data/                        ← MariaDB data directory (tracked for portability)
```

## Setup

### Requirements
- XAMPP (Apache + MySQL/MariaDB)
- Node.js (only needed to rebuild the frontend)

### 1. Database
Point XAMPP's `my.ini` `datadir` to the `mysql/data/` folder in this repository, or copy its contents into your existing XAMPP data directory.

Run the migration files once in order (phpMyAdmin → SQL tab):
1. `backend/database_migration.sql`
2. `backend/database_migration_2_roles.sql`
3. `backend/database_migration_4.sql`
4. `backend/database_migration_5.sql`

### 2. Apache
In `C:/xampp/apache/conf/httpd.conf`, set the `DocumentRoot` to the `backend/` folder:
```
DocumentRoot "path/to/HelpDesk-Project/backend"
<Directory "path/to/HelpDesk-Project/backend">
```
Start Apache and MySQL from the XAMPP Control Panel.

### 3. Access the app
Open `http://localhost/app/` in your browser. The React frontend and PHP API are both served by Apache on port 80 — no separate Node.js server needed.

To rebuild the frontend after code changes:
```bash
cd frontend
npm install
npm run build
# copy build/ contents into backend/app/
```

### 4. External access (optional)
To expose the app over the internet (e.g. for remote testing):
```bash
ngrok http 80
```
The ngrok URL works for both the frontend (`/app/`) and the API (`/api/`).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login.php` | Authenticate user |
| GET/POST/PUT/DELETE/PATCH | `/api/tickets.php` | Full ticket CRUD + assign/status/close |
| GET/POST/PATCH/DELETE | `/api/users.php` | User management |
| GET | `/api/categories.php` | List categories |
| GET | `/api/priorities.php` | List priorities |
| GET | `/api/roles.php` | List roles |
| GET/POST | `/api/comments.php` | Comments and internal notes |
| GET | `/api/activity.php` | Activity logs per ticket or global audit trail |
| GET/POST/DELETE | `/api/attachments.php` | File upload, list, download |
| GET/PATCH | `/api/notifications.php` | Fetch and mark notifications read |
| GET/POST/DELETE | `/api/knowledgebase.php` | KB articles — search, publish, remove |
| GET | `/api/stats.php` | Role-aware analytics and KPI data |
