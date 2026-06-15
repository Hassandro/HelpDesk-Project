<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, PATCH, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$data   = json_decode(file_get_contents("php://input"), true);

// GET notifications for a user (latest 50) + unread count, for the bell/dropdown
if ($method === 'GET') {
    $userID = (int)($_GET['userID'] ?? 0);

    $countRes = mysqli_query($conn, "SELECT COUNT(*) AS c FROM notifications WHERE UserID = '$userID' AND IsRead = 0");
    $unread   = (int)mysqli_fetch_assoc($countRes)['c'];

    $query = "SELECT n.ID, n.TicketID, n.Type, n.Message, n.IsRead, n.CreatedAt, t.Title AS TicketTitle
              FROM notifications n
              LEFT JOIN Tickets t ON n.TicketID = t.ID
              WHERE n.UserID = '$userID'
              ORDER BY n.CreatedAt DESC, n.ID DESC
              LIMIT 50";
    $result = mysqli_query($conn, $query);
    $notifications = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $notifications[] = $row;
    }

    echo json_encode(["success" => true, "notifications" => $notifications, "unreadCount" => $unread]);
    exit();
}

// PATCH marks one notification (or all of a user's) as read
if ($method === 'PATCH') {
    $userID = (int)($data['userID'] ?? 0);

    if (!empty($data['all'])) {
        mysqli_query($conn, "UPDATE notifications SET IsRead = 1 WHERE UserID = '$userID' AND IsRead = 0");
        echo json_encode(["success" => true, "message" => "All notifications marked as read"]);
    } else {
        $id = (int)($data['notificationID'] ?? 0);
        mysqli_query($conn, "UPDATE notifications SET IsRead = 1 WHERE ID = '$id' AND UserID = '$userID'");
        echo json_encode(["success" => true, "message" => "Notification marked as read"]);
    }
    exit();
}
?>
