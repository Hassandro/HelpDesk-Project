<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

$userID = (int)($_GET['userID'] ?? 0);
$role   = $_GET['role'] ?? '';

// admin / manager see global stats; agents/employees see only their own tickets
$where = '1=1';
if ($role === 'it_agent') {
    $where = "t.AssignedTo = '$userID'";
} elseif ($role === 'employee') {
    $where = "t.CreatedBy = '$userID'";
}

// --- Status breakdown ---
$statusBreakdown = [];
$byStatus = [];
$result = mysqli_query($conn, "SELECT s.StatusName AS name, COUNT(*) AS value
                                FROM Tickets t JOIN Statuses s ON t.StatusID = s.ID
                                WHERE $where
                                GROUP BY s.StatusName");
while ($row = mysqli_fetch_assoc($result)) {
    $statusBreakdown[] = ['name' => $row['name'], 'value' => (int)$row['value']];
    $byStatus[$row['name']] = (int)$row['value'];
}
$total = array_sum($byStatus);

// --- Category breakdown ---
$categoryBreakdown = [];
$result = mysqli_query($conn, "SELECT c.CategoryName AS name, COUNT(*) AS value
                                FROM Tickets t JOIN Categories c ON t.CategoryID = c.ID
                                WHERE $where
                                GROUP BY c.CategoryName");
while ($row = mysqli_fetch_assoc($result)) {
    $categoryBreakdown[] = ['name' => $row['name'], 'value' => (int)$row['value']];
}

// --- Priority breakdown ---
$priorityBreakdown = [];
$result = mysqli_query($conn, "SELECT p.PriorityName AS name, COUNT(*) AS value
                                FROM Tickets t JOIN Priorities p ON t.PriorityID = p.ID
                                WHERE $where
                                GROUP BY p.PriorityName");
while ($row = mysqli_fetch_assoc($result)) {
    $priorityBreakdown[] = ['name' => $row['name'], 'value' => (int)$row['value']];
}

// --- Tickets created over the last 30 days, zero-filled ---
$result = mysqli_query($conn, "SELECT DATE(t.CreatedAt) AS d, COUNT(*) AS c
                                FROM Tickets t
                                WHERE t.CreatedAt >= DATE_SUB(CURDATE(), INTERVAL 29 DAY) AND $where
                                GROUP BY d");
$byDate = [];
while ($row = mysqli_fetch_assoc($result)) {
    $byDate[$row['d']] = (int)$row['c'];
}
$ticketsOverTime = [];
for ($i = 29; $i >= 0; $i--) {
    $date = date('Y-m-d', strtotime("-$i day"));
    $ticketsOverTime[] = ['date' => $date, 'count' => $byDate[$date] ?? 0];
}

// --- KPI cards ---
$kpis = [
    ['label' => 'Total',       'value' => $total,                       'color' => '#4f46e5'],
    ['label' => 'Open',        'value' => $byStatus['open'] ?? 0,        'color' => '#3b82f6'],
    ['label' => 'In Progress', 'value' => $byStatus['in_progress'] ?? 0, 'color' => '#f59e0b'],
    ['label' => 'Resolved',    'value' => $byStatus['resolved'] ?? 0,    'color' => '#10b981'],
    ['label' => 'Closed',      'value' => $byStatus['closed'] ?? 0,      'color' => '#6b7280'],
];

// Average time-to-close, in hours, based on the 'closed' activity log entry
$result = mysqli_query($conn, "SELECT AVG(TIMESTAMPDIFF(HOUR, t.CreatedAt, a.`TIMESTAMP`)) AS avgHrs
                                FROM Tickets t
                                JOIN ActivityLogs a ON a.TicketID = t.ID AND a.`ACTION` = 'closed'
                                WHERE t.StatusID = 4 AND $where");
$row = mysqli_fetch_assoc($result);
$kpis[] = ['label' => 'Avg Resolution (hrs)', 'value' => $row['avgHrs'] !== null ? round((float)$row['avgHrs'], 1) : 0, 'color' => '#7c3aed'];

// Hours of work logged on these tickets
$result = mysqli_query($conn, "SELECT SUM(t.WorkMinutes) AS m FROM Tickets t WHERE $where");
$row = mysqli_fetch_assoc($result);
$kpis[] = ['label' => 'Hours Logged', 'value' => round((int)($row['m'] ?? 0) / 60, 1), 'color' => '#0ea5e9'];

$response = [
    "success"            => true,
    "kpis"               => $kpis,
    "statusBreakdown"    => $statusBreakdown,
    "categoryBreakdown"  => $categoryBreakdown,
    "priorityBreakdown"  => $priorityBreakdown,
    "ticketsOverTime"    => $ticketsOverTime,
];

// Admin/manager-only: org-wide views that don't make sense scoped to one user
if ($role === 'admin' || $role === 'manager') {
    $result = mysqli_query($conn, "SELECT COUNT(*) AS c FROM Tickets t
                                    WHERE t.AssignedTo IS NULL AND t.StatusID IN (1,2)");
    $row = mysqli_fetch_assoc($result);
    $response['kpis'][] = ['label' => 'Unassigned', 'value' => (int)$row['c'], 'color' => '#ef4444'];

    $agentWorkload = [];
    $result = mysqli_query($conn, "SELECT u.Name AS name, COUNT(*) AS value
                                    FROM Tickets t JOIN Users u ON t.AssignedTo = u.ID
                                    WHERE t.StatusID IN (1,2)
                                    GROUP BY u.Name
                                    ORDER BY value DESC");
    while ($row = mysqli_fetch_assoc($result)) {
        $agentWorkload[] = ['name' => $row['name'], 'value' => (int)$row['value']];
    }
    $response['agentWorkload'] = $agentWorkload;
}

echo json_encode($response);
?>
