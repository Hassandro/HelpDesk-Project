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

$method = $_SERVER['REQUEST_METHOD'];

// GET ACTIVITY LOGS
// ?ticketID=N -> history / status timeline for one ticket (oldest first)
// ?all=1      -> global audit trail, latest 200 entries (admin)
if ($method === 'GET') {
    $ticketID = $_GET['ticketID'] ?? null;
    $all      = $_GET['all'] ?? null;

    if ($ticketID) {
        $ticketID = (int)$ticketID;
        $query = "SELECT a.ID, a.TicketID, a.`ACTION` AS Action, a.Details,
                         a.`TIMESTAMP` AS Timestamp, u.Name AS UserName
                  FROM ActivityLogs a
                  JOIN Users u ON a.UserID = u.ID
                  WHERE a.TicketID = '$ticketID'
                  ORDER BY a.`TIMESTAMP` ASC, a.ID ASC";
    } elseif ($all) {
        $query = "SELECT a.ID, a.TicketID, a.`ACTION` AS Action, a.Details,
                         a.`TIMESTAMP` AS Timestamp, u.Name AS UserName,
                         t.Title AS TicketTitle
                  FROM ActivityLogs a
                  JOIN Users u      ON a.UserID   = u.ID
                  LEFT JOIN Tickets t ON a.TicketID = t.ID
                  ORDER BY a.`TIMESTAMP` DESC, a.ID DESC
                  LIMIT 200";
    } else {
        echo json_encode(["success" => false, "message" => "ticketID or all parameter required"]);
        exit();
    }

    $result = mysqli_query($conn, $query);
    $logs   = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $logs[] = $row;
    }
    echo json_encode(["success" => true, "logs" => $logs]);
}
?>
