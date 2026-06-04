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

$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

// CREATE TICKET
if ($method === 'POST') {
    $title       = $data['title'];
    $description = $data['description'];
    $categoryID  = $data['categoryID'];
    $priorityID  = $data['priorityID'];
    $createdBy   = $data['createdBy'];
    $statusID    = 1;

    $query = "INSERT INTO Tickets (Title, Description, CategoryID, PriorityID, StatusID, CreatedBy)
              VALUES ('$title', '$description', '$categoryID', '$priorityID', '$statusID', '$createdBy')";

    if (mysqli_query($conn, $query)) {
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
        $query = "SELECT t.ID, t.Title, t.Description, t.CreatedAt,
                         c.CategoryName, p.PriorityName, s.StatusName,
                         u.Name AS CustomerName, e.Name AS EmployeeName
                  FROM Tickets t
                  JOIN Categories c ON t.CategoryID = c.ID
                  JOIN Priorities p ON t.PriorityID = p.ID
                  JOIN Statuses s   ON t.StatusID   = s.ID
                  JOIN Users u      ON t.CreatedBy  = u.ID
                  LEFT JOIN Users e ON t.AssignedTo = e.ID
                  ORDER BY t.CreatedAt DESC";
    } elseif ($assignedTo) {
        $query = "SELECT t.ID, t.Title, t.Description, t.CreatedAt,
                         c.CategoryName, p.PriorityName, s.StatusName,
                         u.Name AS CustomerName
                  FROM Tickets t
                  JOIN Categories c ON t.CategoryID = c.ID
                  JOIN Priorities p ON t.PriorityID = p.ID
                  JOIN Statuses s   ON t.StatusID   = s.ID
                  JOIN Users u      ON t.CreatedBy  = u.ID
                  WHERE t.AssignedTo = '$assignedTo'
                  AND t.StatusID = 2
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

// EDIT TICKET (customer can edit their own open tickets)
if ($method === 'PUT') {
    $ticketID    = $data['ticketID'];
    $title       = $data['title'];
    $description = $data['description'];
    $categoryID  = $data['categoryID'];
    $priorityID  = $data['priorityID'];

    $query = "UPDATE Tickets
              SET Title='$title', Description='$description',
                  CategoryID='$categoryID', PriorityID='$priorityID'
              WHERE ID='$ticketID'";

    if (mysqli_query($conn, $query)) {
        echo json_encode(["success" => true, "message" => "Ticket updated"]);
    } else {
        echo json_encode(["success" => false, "message" => mysqli_error($conn)]);
    }
    exit();
}

// DELETE TICKET
if ($method === 'DELETE') {
    $ticketID = $data['ticketID'];

    $query = "DELETE FROM Tickets WHERE ID='$ticketID'";

    if (mysqli_query($conn, $query)) {
        echo json_encode(["success" => true, "message" => "Ticket deleted"]);
    } else {
        echo json_encode(["success" => false, "message" => mysqli_error($conn)]);
    }
    exit();
}

// ASSIGN, CLOSE, OR UPDATE STATUS
if ($method === 'PATCH') {
    $ticketID = $data['ticketID'];
    $action   = $data['action'];

    if ($action === 'assign') {
        $employeeID = $data['employeeID'];
        $query = "UPDATE Tickets SET AssignedTo = '$employeeID', StatusID = 2 WHERE ID = '$ticketID'";
    } elseif ($action === 'close') {
        $query = "UPDATE Tickets SET StatusID = 4 WHERE ID = '$ticketID'";
    } elseif ($action === 'status') {
    $statusID = $data['statusID'];
    $query = "UPDATE Tickets SET StatusID = '$statusID' WHERE ID = '$ticketID'";
} elseif ($action === 'failed') {
    $query = "UPDATE Tickets SET StatusID = 1, AssignedTo = NULL WHERE ID = '$ticketID'";
}

    if (mysqli_query($conn, $query)) {
        echo json_encode(["success" => true, "message" => "Ticket updated"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update ticket"]);
    }
}
?>