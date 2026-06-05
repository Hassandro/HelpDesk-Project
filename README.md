# HelpDesk Project

A full-stack helpdesk ticketing system built with React and PHP/MySQL. Users are assigned roles (Admin, Manager, Employee, Customer) each with their own dashboard and permissions.

## Tech Stack

- **Frontend:** React (React Router, localStorage for auth)
- **Backend:** PHP (REST API)
- **Database:** MySQL (via XAMPP)

## Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Manage all users (create, activate/deactivate, delete), view all tickets |
| **Manager** | View all tickets, assign tickets to employees, close tickets |
| **Employee** | View tickets assigned to them, update ticket status |
| **Customer** | Submit tickets, edit/delete their own open tickets |

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
│   │   └── comments.php
│   └── config/
│       └── db.php
├── frontend/
│   └── src/
│       └── pages/
│           ├── Login.js
│           ├── AdminDashboard.js
│           ├── ManagerDashboard.js
│           ├── EmployeeDashboard.js
│           └── CustomerDashboard.js
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
| GET/POST | `/api/comments.php` | Ticket comments |
