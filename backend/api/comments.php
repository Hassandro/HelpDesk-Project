<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/activity.php';

$method = $_SERVER['REQUEST_METHOD'];
$data   = json_decode(file_get_contents("php://input"), true);

// GET COMMENTS FOR A TICKET (employees — ticket submitters — never see internal notes)
if ($method === 'GET') {
    $ticketID = (int)$_GET['ticketID'];
    $role     = $_GET['role'] ?? '';
    $internalFilter = ($role === 'employee') ? "AND tc.IsInternal = 0" : "";

    $query = "SELECT tc.ID, tc.CommentText, tc.IsInternal, tc.CreatedAt,
                     u.Name AS AuthorName, r.RoleName AS AuthorRole
              FROM TicketComments tc
              JOIN Users u ON tc.UserID = u.ID
              JOIN Roles r ON u.RoleID  = r.ID
              WHERE tc.TicketID = '$ticketID' $internalFilter
              ORDER BY tc.CreatedAt ASC, tc.ID ASC";

    $result   = mysqli_query($conn, $query);
    $comments = [];
    while ($row = mysqli_fetch_assoc($result)) {
        $comments[] = $row;
    }
    echo json_encode(["success" => true, "comments" => $comments]);
}

// ADD COMMENT / INTERNAL NOTE
if ($method === 'POST') {
    $ticketID    = (int)$data['ticketID'];
    $userID      = (int)$data['userID'];
    $isInternal  = !empty($data['isInternal']) ? 1 : 0;
    $commentText = mysqli_real_escape_string($conn, $data['commentText']);

    $query = "INSERT INTO TicketComments (TicketID, UserID, CommentText, IsInternal)
              VALUES ('$ticketID', '$userID', '$commentText', '$isInternal')";

    if (mysqli_query($conn, $query)) {
        $snippet = mb_substr($data['commentText'], 0, 120);
        logActivity($conn, $userID, $ticketID,
            $isInternal ? 'internal_note' : 'commented',
            ($isInternal ? "Internal note: " : "") . $snippet);
        echo json_encode(["success" => true, "message" => $isInternal ? "Internal note added" : "Comment added"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to add comment"]);
    }
}
?>
