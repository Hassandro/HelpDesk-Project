# HelpDesk Project

A full-stack helpdesk ticketing system built with React and PHP/MySQL. Users are assigned roles (Admin, Manager, IT-Agent, Employee) each with their own dashboard and permissions.

## Tech Stack

- **Frontend:** React (React Router, localStorage for auth)
- **Backend:** PHP (REST API)
- **Database:** MySQL (via XAMPP)

## Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Manage all users (create, activate/deactivate, delete), view the global audit trail |
| **Manager** | View all tickets, assign tickets to IT agents, close tickets, view ticket history, comment / add internal notes, view the activity log |
| **IT-Agent** | View tickets assigned to them, update ticket status, log work time, attach files, comment / add internal notes |
| **Employee** | Submit tickets, edit/delete their own open tickets, view status timeline, reply to comments, attach files |

## Workflow & History Features

- **Ticket workflow:** `open → in_progress (assigned) → resolved → closed`, with a "failed to resolve" path that returns the ticket to the open queue. Rules are enforced server-side (e.g. resolved/closed tickets can't be assigned, closed tickets can't change status).
- **Activity logs / audit trail:** every action (create, edit, assign, status change, comment, close, reopen, delete) is recorded in `ActivityLogs` with who did it, when, and details.
- **Status timeline / ticket history:** each ticket shows a chronological timeline built from its activity log.
- **Internal notes:** staff can mark comments as internal — employees (ticket submitters) never see them.
- **Control panel:** every dashboard has a collapsible side panel (☰) with role-specific navigation, live ticket counts, a contact link (employees/IT agents → manager, manager → admin), and logout. Admins get Overview / Users / All Tickets / Audit Trail views; managers get status filters, an Unassigned queue, plus the Activity Log; IT agents get My Queue plus a Resolved-by-Me history.
- **Password hashing:** passwords are stored as bcrypt hashes (`password_hash` / `password_verify`) — never plaintext.
- **Activity log access:** the global audit trail is restricted to Admin and Manager dashboards.
- **Attachments:** files can be uploaded next to every comment section (IT-Agent, Manager, Employee) and downloaded by anyone viewing the ticket. Uploads are stored outside the DB in `backend/uploads/` (script execution disabled there).
- **Work time:** IT agents log time spent (hours + minutes) when marking a ticket *In Progress* or *Resolved*; it accumulates per ticket and is visible to the agent and the manager, with each entry recorded in the activity log.

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
│   │   └── attachments.php
│   ├── config/
│   │   ├── db.php
│   │   └── activity.php
│   ├── tools/
│   │   └── hash_passwords.php   ← one-off: bcrypt existing plaintext passwords
│   ├── uploads/                 ← uploaded attachment files (gitignored)
│   ├── database_migration.sql
│   ├── database_migration_2_roles.sql
│   └── database_migration_4.sql
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── ActivityTimeline.js
│       │   ├── Sidebar.js
│       │   ├── Attachments.js
│       │   └── AuditTrail.js
│       └── pages/
│           ├── Login.js
│           ├── AdminDashboard.js
│           ├── ManagerDashboard.js
│           ├── AgentDashboard.js
│           └── EmployeeDashboard.js
└── mysql/
    └── data/
        ├── helpdesk/        ← your database tables
        ├── mysql/
        └── performance_schema/
```

## Setup

### Requirements
- XAMPP (Apache + MySQL)
- Node.js

### 1. Database
Copy the `mysql/data/` folder into your XAMPP MySQL data directory (e.g. `C:/xampp/mysql/data/`) — or point XAMPP's `my.ini` `datadir` to this folder directly.

Then run the migrations once (phpMyAdmin → SQL tab), in order:
1. `backend/database_migration.sql` — audit-trail and internal-notes columns
2. `backend/database_migration_2_roles.sql` — renames roles to `it_agent` / `employee`
3. `backend/database_migration_4.sql` — attachment metadata + ticket work-time column

Finally, hash any existing plaintext passwords once (from the project root):
```bash
C:/xampp/php/php.exe backend/tools/hash_passwords.php
```
New users created through the app are hashed automatically.

### 2. Apache
In `C:/xampp/apache/conf/httpd.conf`, set the `DocumentRoot` to the `backend/` folder:
```
DocumentRoot "path/to/HelpDesk-Project/backend"
<Directory "path/to/HelpDesk-Project/backend">
```
Then start Apache and MySQL from the XAMPP Control Panel.

### 3. Frontend
```bash
cd frontend
npm install
npm start
```

The React app runs on `http://localhost:3000` and communicates with the PHP API on `http://localhost`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login.php` | Authenticate user, returns token |
| GET/POST/PUT/DELETE/PATCH | `/api/tickets.php` | Full ticket CRUD + assign/close/status |
| GET/POST/PATCH/DELETE | `/api/users.php` | User management |
| GET | `/api/categories.php` | List categories |
| GET | `/api/priorities.php` | List priorities |
| GET | `/api/roles.php` | List roles |
| GET/POST | `/api/comments.php` | Ticket comments & internal notes (`?role=employee` hides internal) |
| GET | `/api/activity.php` | Activity logs — `?ticketID=N` for one ticket's history, `?all=1` for the audit trail |
| GET/POST | `/api/attachments.php` | Ticket attachments — `?ticketID=N` lists, `?download=ID` streams a file, POST (multipart) uploads |
