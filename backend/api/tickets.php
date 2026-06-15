<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PATCH, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/activity.php';
require_once __DIR__ . '/../config/notify.php';

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

// CREATE TICKET
if ($method === 'POST') {
    $title       = mysqli_real_escape_string($conn, $data['title']);
    $description = mysqli_real_escape_string($conn, $data['description']);
    $categoryID  = (int)$data['categoryID'];
    $priorityID  = (int)$data['priorityID'];
    $createdBy   = (int)$data['createdBy'];
    $statusID    = 1;

    $query = "INSERT INTO Tickets (Title, Description, CategoryID, PriorityID, StatusID, CreatedBy)
              VALUES ('$title', '$description', '$categoryID', '$priorityID', '$statusID', '$createdBy')";

    if (mysqli_query($conn, $query)) {
        $ticketID = mysqli_insert_id($conn);
        logActivity($conn, $createdBy, $ticketID, 'created', "Ticket \"{$data['title']}\" submitted");
        echo json_encode(["success" => true, "message" => "Ticket created successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to create ticket"]);
    }
}

// GET TICKETS
if ($method === 'GET') {
    $userID     = $_GET['userID'] ?? null;
    $all        = $_GET['all'] ?? null;
    $assignedTo = $_GET['assignedTo'] ?? null;

    if ($all) {
        $query = "SELECT t.ID, t.Title, t.Description, t.CreatedAt, t.WorkMinutes,
                         c.CategoryName, p.PriorityName, s.StatusName,
                         u.Name AS EmployeeName, e.Name AS AgentName
                  FROM Tickets t
                  JOIN Categories c ON t.CategoryID = c.ID
                  JOIN Priorities p ON t.PriorityID = p.ID
                  JOIN Statuses s   ON t.StatusID   = s.ID
                  JOIN Users u      ON t.CreatedBy  = u.ID
                  LEFT JOIN Users e ON t.AssignedTo = e.ID
                  ORDER BY t.CreatedAt DESC";
    } elseif ($assignedTo) {
        // ?status=2 (default) for the active queue, ?status=3,4 for resolved history
        $statusParam = $_GET['status'] ?? '2';
        $statusIDs   = implode(',', array_map('intval', explode(',', $statusParam)));
        $query = "SELECT t.ID, t.Title, t.Description, t.CreatedAt, t.WorkMinutes,
                         c.CategoryName, p.PriorityName, s.StatusName,
                         u.Name AS EmployeeName
                  FROM Tickets t
                  JOIN Categories c ON t.CategoryID = c.ID
                  JOIN Priorities p ON t.PriorityID = p.ID
                  JOIN Statuses s   ON t.StatusID   = s.ID
                  JOIN Users u      ON t.CreatedBy  = u.ID
                  WHERE t.AssignedTo = '$assignedTo'
                  AND t.StatusID IN ($statusIDs)
                  ORDER BY t.CreatedAt DESC";
    } else {
        $query = "SELECT t.ID, t.Title, t.Description, t.CreatedAt,
                         t.CategoryID, t.PriorityID,
                         c.CategoryName, p.PriorityName, s.StatusName
                  FROM Tickets t
                  JOIN Categories c ON t.CategoryID = c.ID
                  JOIN Priorities p ON t.PriorityID = p.ID
                  JOIN Statuses s   ON t.StatusID   = s.ID
                  WHERE t.CreatedBy = '$userID'
                  ORDER BY t.CreatedAt DESC";
    }

    $result  = mysqli_query($conn, $query);
    $tickets = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $tickets[] = $row;
    }
    echo json_encode(["success" => true, "tickets" => $tickets]);
}

// EDIT TICKET (employee can edit their own open tickets)
if ($method === 'PUT') {
    $ticketID    = (int)$data['ticketID'];
    $userID      = (int)($data['userID'] ?? 0);
    $title       = mysqli_real_escape_string($conn, $data['title']);
    $description = mysqli_real_escape_string($conn, $data['description']);
    $categoryID  = (int)$data['categoryID'];
    $priorityID  = (int)$data['priorityID'];

    $query = "UPDATE Tickets
              SET Title='$title', Description='$description',
                  CategoryID='$categoryID', PriorityID='$priorityID'
              WHERE ID='$ticketID'";

    if (mysqli_query($conn, $query)) {
        logActivity($conn, $userID, $ticketID, 'updated', 'Ticket details edited');
        echo json_encode(["success" => true, "message" => "Ticket updated"]);
    } else {
        echo json_encode(["success" => false, "message" => mysqli_error($conn)]);
    }
    exit();
}

// DELETE TICKET
if ($method === 'DELETE') {
    $ticketID = (int)$data['ticketID'];
    $userID   = (int)($data['userID'] ?? 0);

    $res    = mysqli_query($conn, "SELECT Title FROM Tickets WHERE ID='$ticketID'");
    $ticket = mysqli_fetch_assoc($res);

    $query = "DELETE FROM Tickets WHERE ID='$ticketID'";

    if (mysqli_query($conn, $query)) {
        if ($ticket) {
            logActivity($conn, $userID, $ticketID, 'deleted', "Ticket \"{$ticket['Title']}\" deleted");
        }
        echo json_encode(["success" => true, "message" => "Ticket deleted"]);
    } else {
        echo json_encode(["success" => false, "message" => mysqli_error($conn)]);
    }
    exit();
}

// ASSIGN, CLOSE, OR UPDATE STATUS (workflow rules enforced server-side)
if ($method === 'PATCH') {
    $ticketID = (int)$data['ticketID'];
    $action   = $data['action'];
    $actorID  = (int)($data['userID'] ?? 0);

    $res = mysqli_query($conn, "SELECT t.StatusID, t.WorkMinutes, t.Title, t.CreatedBy, t.AssignedTo, s.StatusName
                                FROM Tickets t
                                JOIN Statuses s ON t.StatusID = s.ID
                                WHERE t.ID = '$ticketID'");
    $ticket = mysqli_fetch_assoc($res);
    if (!$ticket) {
        echo json_encode(["success" => false, "message" => "Ticket not found"]);
        exit();
    }
    $currentStatus = (int)$ticket['StatusID'];
    $logAction     = null;
    $logDetails    = null;
    $notifications = []; // [userID, type, message] — sent after a successful update

    // Optional work time submitted by the IT agent (only used by the 'status' action)
    $addMinutes = max(0, (int)($data['workHours'] ?? 0)) * 60 + max(0, (int)($data['workMinutes'] ?? 0));
    $fmt = function ($m) {
        $h = intdiv($m, 60); $r = $m % 60;
        return $h ? ($r ? "{$h}h {$r}m" : "{$h}h") : "{$r}m";
    };

    if ($action === 'assign') {
        if ($currentStatus === 3 || $currentStatus === 4) {
            echo json_encode(["success" => false, "message" => "Cannot assign a {$ticket['StatusName']} ticket"]);
            exit();
        }
        $agentID  = (int)$data['agentID'];
        $agentRes = mysqli_query($conn, "SELECT Name FROM Users WHERE ID='$agentID'");
        $agent    = mysqli_fetch_assoc($agentRes);
        if (!$agent) {
            echo json_encode(["success" => false, "message" => "IT agent not found"]);
            exit();
        }
        $query      = "UPDATE Tickets SET AssignedTo = '$agentID', StatusID = 2 WHERE ID = '$ticketID'";
        $logAction  = 'assigned';
        $logDetails = "Assigned to {$agent['Name']}";
        $notifications[] = [$agentID, 'assigned', "You've been assigned ticket #$ticketID: {$ticket['Title']}"];
    } elseif ($action === 'close') {
        if ($currentStatus === 4) {
            echo json_encode(["success" => false, "message" => "Ticket is already closed"]);
            exit();
        }
        $query      = "UPDATE Tickets SET StatusID = 4 WHERE ID = '$ticketID'";
        $logAction  = 'closed';
        $logDetails = "{$ticket['StatusName']} → closed";
        if ($ticket['CreatedBy']) {
            $notifications[] = [(int)$ticket['CreatedBy'], 'status_changed', "Your ticket #$ticketID ({$ticket['Title']}) has been closed"];
        }
    } elseif ($action === 'status') {
        if ($currentStatus === 4) {
            echo json_encode(["success" => false, "message" => "Closed tickets cannot change status"]);
            exit();
        }
        $statusID = (int)$data['statusID'];
        if ($statusID === $currentStatus) {
            echo json_encode(["success" => true, "message" => "Status unchanged"]);
            exit();
        }
        $nameRes   = mysqli_query($conn, "SELECT StatusName FROM Statuses WHERE ID='$statusID'");
        $newStatus = mysqli_fetch_assoc($nameRes);
        if (!$newStatus) {
            echo json_encode(["success" => false, "message" => "Invalid status"]);
            exit();
        }
        if ($addMinutes > 0) {
            $newTotal   = (int)$ticket['WorkMinutes'] + $addMinutes;
            $query      = "UPDATE Tickets SET StatusID = '$statusID', WorkMinutes = $newTotal WHERE ID = '$ticketID'";
            $logDetails = "{$ticket['StatusName']} → {$newStatus['StatusName']} · logged {$fmt($addMinutes)} (total {$fmt($newTotal)})";
        } else {
            $query      = "UPDATE Tickets SET StatusID = '$statusID' WHERE ID = '$ticketID'";
            $logDetails = "{$ticket['StatusName']} → {$newStatus['StatusName']}";
        }
        $logAction  = 'status_changed';
        if ($ticket['CreatedBy']) {
            $notifications[] = [(int)$ticket['CreatedBy'], 'status_changed', "Ticket #$ticketID ({$ticket['Title']}) status changed: {$ticket['StatusName']} → {$newStatus['StatusName']}"];
        }
    } elseif ($action === 'failed') {
        if ($currentStatus === 4) {
            echo json_encode(["success" => false, "message" => "Closed tickets cannot be reopened"]);
            exit();
        }
        $query      = "UPDATE Tickets SET StatusID = 1, AssignedTo = NULL WHERE ID = '$ticketID'";
        $logAction  = 'reopened';
        $logDetails = "Returned to queue — could not be resolved";
        if ($ticket['CreatedBy']) {
            $notifications[] = [(int)$ticket['CreatedBy'], 'status_changed', "Your ticket #$ticketID ({$ticket['Title']}) was sent back to the queue — could not be resolved"];
        }
        $mgrRes = mysqli_query($conn, "SELECT u.ID FROM Users u JOIN Roles r ON u.RoleID = r.ID WHERE r.RoleName = 'manager' AND u.IsActive = 1");
        while ($m = mysqli_fetch_assoc($mgrRes)) {
            $notifications[] = [(int)$m['ID'], 'assigned', "Ticket #$ticketID ({$ticket['Title']}) needs reassignment"];
        }
    } else {
        echo json_encode(["success" => false, "message" => "Unknown action"]);
        exit();
    }

    if (mysqli_query($conn, $query)) {
        logActivity($conn, $actorID, $ticketID, $logAction, $logDetails);
        foreach ($notifications as [$notifyUserID, $notifyType, $notifyMessage]) {
            notifyUser($conn, $notifyUserID, $notifyType, $notifyMessage, $ticketID);
        }
        echo json_encode(["success" => true, "message" => "Ticket updated"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update ticket"]);
    }
}
?>
